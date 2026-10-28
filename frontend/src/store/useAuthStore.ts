import { create } from 'zustand';
import { PrivacySettings, User, UserRole } from '../types';
import { ApiError, setApiSessionAuthenticated } from '../services/apiClient';
import { authService, userService } from '../services';

type AuthStatus = 'INITIALIZING' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'ERROR';

const UI_GENDERS: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
  PREFER_NOT_TO_SAY: 'Không muốn tiết lộ',
};

export interface RegistrationDraft {
  username: string;
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

interface AuthState {
  user: User | null;
  activeRole: UserRole;
  isAuthenticated: boolean;
  authStatus: AuthStatus;
  pendingEmail: string | null;
  pendingDisplayName: string | null;
  registrationDraft: RegistrationDraft;
  updateRegistrationDraft: (draft: Partial<RegistrationDraft>) => void;
  clearRegistrationDraft: () => void;
  initializeSession: () => Promise<void>;
  retrySessionInitialization: () => Promise<void>;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  loginSocial: (provider: string, token: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    displayName?: string;
  }) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePrivacy: (privacy: Partial<PrivacySettings>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  uploadBanner: (file: File) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  verifyForgotPasswordOtp: (email: string, code: string) => Promise<void>;
  resetPassword: (password: string, confirmPassword: string) => Promise<void>;
  changePassword: (oldPassword: string, password: string, confirmPassword: string) => Promise<void>;
  clearSession: () => void;
}

let initializationPromise: Promise<void> | null = null;
let initializationPromiseGeneration = -1;
let initializationComplete = false;
let sessionGeneration = 0;

function mapUser(
  response: Awaited<ReturnType<typeof userService.getMe>>,
  currentUser?: User | null
): User {
  const profile = response.profile;
  const privacy = response.privacySettings;
  const gender = profile?.gender
    ? UI_GENDERS[profile.gender] || profile.gender
    : currentUser?.gender;

  return {
    id: response.id || currentUser?.id || response.username,
    username: response.username,
    displayName: profile?.displayName || currentUser?.displayName || response.username,
    email: response.email,
    avatarUrl: profile?.avatar || currentUser?.avatarUrl || '',
    bannerUrl: profile?.banner || currentUser?.bannerUrl || '',
    bio: profile?.bio ?? currentUser?.bio ?? '',
    location:
      profile?.location === null ? undefined : profile?.location ?? currentUser?.location,
    dateOfBirth:
      profile?.dateOfBirth === null ? undefined : profile?.dateOfBirth ?? currentUser?.dateOfBirth,
    gender,
    privacy: {
      showDateOfBirth: privacy?.showDateOfBirth ?? currentUser?.privacy.showDateOfBirth ?? false,
      showLocation: privacy?.showLocation ?? currentUser?.privacy.showLocation ?? false,
      showPostsOnProfile: privacy?.showPostsOnProfile ?? currentUser?.privacy.showPostsOnProfile ?? true,
    },
    role: response.role,
    status: response.status,
    createdAt: response.createdAt || currentUser?.createdAt || new Date().toISOString(),
    karma: currentUser?.karma ?? 0,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  activeRole: 'GUEST',
  isAuthenticated: false,
  authStatus: 'INITIALIZING',
  pendingEmail: null,
  pendingDisplayName: null,
  registrationDraft: {
    username: '',
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  },
  updateRegistrationDraft: (draft) => set((state) => ({
    registrationDraft: { ...state.registrationDraft, ...draft },
  })),
  clearRegistrationDraft: () => set({
    registrationDraft: {
      username: '',
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  }),

  initializeSession: () => {
    if (initializationComplete) return Promise.resolve();
    if (initializationPromise && initializationPromiseGeneration === sessionGeneration) {
      return initializationPromise;
    }

    const generation = sessionGeneration;
    setApiSessionAuthenticated(true);
    initializationPromiseGeneration = generation;
    const operation = (async () => {
      try {
        const response = await userService.getMe();
        if (generation !== sessionGeneration) return;
        const user = mapUser(response, get().user);
        set({
          user,
          activeRole: user.role,
          isAuthenticated: true,
          authStatus: 'AUTHENTICATED',
        });
      } catch (error) {
        if (generation !== sessionGeneration) return;
        if (error instanceof ApiError && error.status === 401) {
          setApiSessionAuthenticated(false);
          set({
            user: null,
            activeRole: 'GUEST',
            isAuthenticated: false,
            authStatus: 'UNAUTHENTICATED',
          });
        } else {
          set({ authStatus: 'ERROR' });
        }
      } finally {
        if (generation === sessionGeneration) {
          initializationComplete = true;
          initializationPromise = null;
          initializationPromiseGeneration = -1;
        }
      }
    })();
    initializationPromise = operation;
    return operation;
  },

  retrySessionInitialization: async () => {
    sessionGeneration += 1;
    initializationComplete = false;
    set({ authStatus: 'INITIALIZING' });
    await get().initializeSession();
  },

  login: async (emailOrUsername, password) => {
    await authService.login(emailOrUsername, password);
    sessionGeneration += 1;
    initializationComplete = true;
    setApiSessionAuthenticated(true);
    set({ authStatus: 'INITIALIZING' });
    try {
      const userResponse = await userService.getMe();
      const user = mapUser(userResponse);
      set({
        user,
        activeRole: user.role,
        isAuthenticated: true,
        authStatus: 'AUTHENTICATED',
        pendingEmail: null,
      });
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        set({ authStatus: 'ERROR' });
      }
      throw error;
    }
  },

  loginSocial: async (provider, token) => {
    await authService.loginSocial(provider, token);
    sessionGeneration += 1;
    initializationComplete = true;
    setApiSessionAuthenticated(true);
    set({ authStatus: 'INITIALIZING' });
    try {
      const userResponse = await userService.getMe();
      const user = mapUser(userResponse);
      set({
        user,
        activeRole: user.role,
        isAuthenticated: true,
        authStatus: 'AUTHENTICATED',
        pendingEmail: null,
      });
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        set({ authStatus: 'ERROR' });
      }
      throw error;
    }
  },

  register: async (data) => {
    await authService.register(data);
    set({
      pendingEmail: data.email.trim().toLowerCase(),
      pendingDisplayName: data.displayName?.trim() || null,
    });
  },

  verifyEmail: async (email, code) => {
    await authService.verifyEmail({ email, code });
    setApiSessionAuthenticated(false);
    set({
      user: null,
      activeRole: 'GUEST',
      isAuthenticated: false,
      authStatus: 'UNAUTHENTICATED',
      pendingEmail: null,
      pendingDisplayName: null,
    });
    get().clearRegistrationDraft();
  },

  resendOtp: async (email) => {
    await authService.resendOtp(email);
  },

  logout: async () => {
    get().clearSession();
    await authService.logout();
  },

  updateProfile: async (data) => {
    const response = await userService.updateProfile(data);
    const user = mapUser(response, get().user);
    set({
      user,
      activeRole: user.role,
      isAuthenticated: true,
      authStatus: 'AUTHENTICATED',
    });
  },

  updatePrivacy: async (privacy) => {
    const currentUser = get().user;
    if (!currentUser) throw new Error('Vui lòng đăng nhập để cập nhật quyền riêng tư');
    await get().updateProfile({ privacy: { ...currentUser.privacy, ...privacy } });
  },

  uploadAvatar: async (file) => {
    const response = await userService.uploadAvatar(file);
    const user = mapUser(response, get().user);
    set({ user });
  },

  uploadBanner: async (file) => {
    const response = await userService.uploadBanner(file);
    const user = mapUser(response, get().user);
    set({ user });
  },

  forgotPassword: async (email) => {
    await authService.forgotPassword(email);
  },

  verifyForgotPasswordOtp: async (email, code) => {
    await authService.verifyForgotPasswordOtp({ email, code });
  },

  resetPassword: async (password, confirmPassword) => {
    await authService.resetPassword({ password, confirmPassword });
  },

  changePassword: async (oldPassword, password, confirmPassword) => {
    await authService.changePassword({ oldPassword, password, confirmPassword });
  },

  clearSession: () => {
    sessionGeneration += 1;
    initializationComplete = true;
    setApiSessionAuthenticated(false);
    set({
      user: null,
      activeRole: 'GUEST',
      isAuthenticated: false,
      authStatus: 'UNAUTHENTICATED',
      pendingEmail: null,
      pendingDisplayName: null,
    });
  },
}));
