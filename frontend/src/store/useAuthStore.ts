import { create } from 'zustand';
import { PrivacySettings, User, UserRole } from '../types';
import { ApiError } from '../services/apiClient';
import { authService, userService } from '../services';

const UI_GENDERS: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
  PREFER_NOT_TO_SAY: 'Không muốn tiết lộ',
};

interface AuthState {
  user: User | null;
  activeRole: UserRole;
  isAuthenticated: boolean;
  authLoading: boolean;
  authStatus: 'initializing' | 'authenticated' | 'unauthenticated' | 'error';
  authError: string | null;
  pendingEmail: string | null;
  pendingDisplayName: string | null;
  hydrate: () => Promise<void>;
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

let authGeneration = 0;
let hydrationPromise: Promise<void> | null = null;

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
  authLoading: true,
  authStatus: 'initializing',
  authError: null,
  pendingEmail: null,
  pendingDisplayName: null,

  hydrate: () => {
    if (hydrationPromise) return hydrationPromise;

    const generation = authGeneration;
    set({ authLoading: true, authStatus: 'initializing', authError: null });
    const operation = (async () => {
      try {
        const currentUser = await userService.getMe();
        if (generation !== authGeneration) return;
        const user = mapUser(currentUser, get().user);
        set({
          user,
          activeRole: user.role,
          isAuthenticated: true,
          authLoading: false,
          authStatus: 'authenticated',
          authError: null,
        });
      } catch (error) {
        if (generation !== authGeneration) return;
        if (
          error instanceof ApiError &&
          (error.status === 401 ||
            (error.status === 403 &&
              ['ACCOUNT_LOCKED', 'ACCOUNT_NOT_VERIFIED'].includes(error.code)))
        ) {
          set({
            user: null,
            activeRole: 'GUEST',
            isAuthenticated: false,
            authLoading: false,
            authStatus: 'unauthenticated',
            authError: null,
          });
          return;
        }

        const currentUser = get().user;
        set({
          authLoading: false,
          authStatus: currentUser ? 'authenticated' : 'error',
          authError:
            error instanceof Error ? error.message : 'Không thể khôi phục phiên đăng nhập.',
        });
        throw error;
      }
    })();

    hydrationPromise = operation.finally(() => {
      hydrationPromise = null;
    });
    return hydrationPromise;
  },

  login: async (emailOrUsername, password) => {
    authGeneration += 1;
    set({ authLoading: false, authStatus: 'unauthenticated', authError: null });
    await authService.login(emailOrUsername, password);
    const userResponse = await userService.getMe();
    const user = mapUser(userResponse);
    set({
      user,
      activeRole: user.role,
      isAuthenticated: true,
      authLoading: false,
      authStatus: 'authenticated',
      authError: null,
      pendingEmail: null,
    });
  },

  loginSocial: async (provider, token) => {
    authGeneration += 1;
    set({ authLoading: false, authStatus: 'unauthenticated', authError: null });
    await authService.loginSocial(provider, token);
    const userResponse = await userService.getMe();
    const user = mapUser(userResponse);
    set({
      user,
      activeRole: user.role,
      isAuthenticated: true,
      authLoading: false,
      authStatus: 'authenticated',
      authError: null,
      pendingEmail: null,
    });
  },

  register: async (data) => {
    await authService.register(data);
    set({
      pendingEmail: data.email.trim().toLowerCase(),
      pendingDisplayName: data.displayName?.trim() || null,
    });
  },

  verifyEmail: async (email, code) => {
    authGeneration += 1;
    set({ authLoading: false, authStatus: 'unauthenticated', authError: null });
    await authService.verifyEmail({ email, code });
    const userResponse = await userService.getMe();
    let user = mapUser(userResponse);
    const pendingDisplayName = get().pendingDisplayName;
    if (pendingDisplayName) {
      user = mapUser(await userService.updateProfile({ displayName: pendingDisplayName }), user);
    }
    set({
      user,
      activeRole: user.role,
      isAuthenticated: true,
      authLoading: false,
      authStatus: 'authenticated',
      authError: null,
      pendingEmail: null,
      pendingDisplayName: null,
    });
  },

  resendOtp: async (email) => {
    await authService.resendOtp(email);
  },

  logout: async () => {
    const logoutRequest = authService.logout();
    get().clearSession();
    await logoutRequest;
  },

  updateProfile: async (data) => {
    const response = await userService.updateProfile(data);
    const user = mapUser(response, get().user);
    set({
      user,
      activeRole: user.role,
      isAuthenticated: true,
      authStatus: 'authenticated',
      authError: null,
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
    authGeneration += 1;
    set({
      user: null,
      activeRole: 'GUEST',
      isAuthenticated: false,
      authLoading: false,
      authStatus: 'unauthenticated',
      authError: null,
      pendingEmail: null,
      pendingDisplayName: null,
    });
  },
}));
