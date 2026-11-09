import apiClient from './apiClient';
import { Community, Post, Comment, User, Report } from '../types';
import { useCommunityStore } from '../store/useCommunityStore';
import { usePostStore } from '../store/usePostStore';
import { useReportStore } from '../store/useReportStore';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

interface AuthResponse {
  message?: string;
  data?: Partial<User>;
}

interface UserResponse {
  id?: string;
  username: string;
  email: string;
  role: User['role'];
  status: User['status'];
  createdAt: string;
  profile?: {
    displayName?: string | null;
    bio?: string | null;
    avatar?: string | null;
    banner?: string | null;
    location?: string | null;
    dateOfBirth?: string | null;
    gender?: string;
  };
  privacySettings?: {
    showDateOfBirth?: boolean;
    showLocation?: boolean;
    showPostsOnProfile?: boolean;
  };
}

const API_GENDERS: Record<string, string> = {
  Nam: 'MALE',
  Nữ: 'FEMALE',
  Khác: 'OTHER',
  'Không muốn tiết lộ': 'PREFER_NOT_TO_SAY',
};

export const authService = {
  login: (emailOrUsername: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', {
      username: emailOrUsername.trim(),
      password,
    }),

  loginSocial: (provider: string, token: string) =>
    apiClient.post<AuthResponse>(`/auth/social/${provider}`, { token }),

  register: (data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) =>
    apiClient.post<AuthResponse>('/auth/register', {
      username: data.username.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      confirmPassword: data.confirmPassword,
    }),

  verifyEmail: (data: { email: string; code: string }) =>
    apiClient.post<AuthResponse>('/auth/verify-email', {
      email: data.email.trim().toLowerCase(),
      code: data.code.trim(),
    }),

  resendOtp: (email: string) =>
    apiClient.post<{ message?: string }>('/auth/resend-otp', {
      email: email.trim().toLowerCase(),
    }),

  logout: () => apiClient.post<{ message?: string }>('/auth/logout'),

  forgotPassword: (email: string) =>
    apiClient.post<{ message?: string }>('/auth/forgot-password', {
      email: email.trim().toLowerCase(),
    }),

  verifyForgotPasswordOtp: (data: { email: string; code: string }) =>
    apiClient.post<{ message?: string }>('/auth/forgot-password/verify', {
      email: data.email.trim().toLowerCase(),
      code: data.code.trim(),
    }),

  resetPassword: (data: { password: string; confirmPassword: string }) =>
    apiClient.post<{ message?: string }>('/auth/forgot-password/reset', data),

  changePassword: (data: { oldPassword: string; password: string; confirmPassword: string }) =>
    apiClient.patch<{ message?: string }>('/auth/change-password', data),
};

export const userService = {
  getMe: () => apiClient.get<UserResponse>('/users/me'),

  updateProfile: (data: Partial<User>) =>
    apiClient.patch<UserResponse>('/users/me/profile', {
      displayName: data.displayName,
      bio: data.bio,
      location: data.location,
      dateOfBirth: data.dateOfBirth || null,
      gender: data.gender ? API_GENDERS[data.gender] || data.gender : undefined,
      showDateOfBirth: data.privacy?.showDateOfBirth,
      showLocation: data.privacy?.showLocation,
      showPostsOnProfile: data.privacy?.showPostsOnProfile,
    }),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.put<UserResponse>('/users/me/avatar', formData);
  },

  uploadBanner: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.put<UserResponse>('/users/me/banner', formData);
  },
};

export const communityService = {
  list: async (): Promise<Community[]> => {
    if (USE_MOCK) {
      return useCommunityStore.getState().communities;
    }
    return apiClient.get<Community[]>('/communities');
  },
  getByName: async (name: string): Promise<Community | undefined> => {
    if (USE_MOCK) {
      return useCommunityStore.getState().communities.find((c) => c.name === name);
    }
    return apiClient.get<Community>(`/communities/${name}`);
  },
  create: async (data: any) => {
    if (USE_MOCK) {
      return useCommunityStore.getState().createCommunity(data);
    }
    return apiClient.post<Community>('/communities', data);
  },
  join: async (name: string) => {
    if (USE_MOCK) {
      useCommunityStore.getState().joinCommunity(name);
      return true;
    }
    await apiClient.post(`/communities/${name}/join`);
    return true;
  },
  leave: async (name: string) => {
    if (USE_MOCK) {
      useCommunityStore.getState().leaveCommunity(name);
      return true;
    }
    await apiClient.post(`/communities/${name}/leave`);
    return true;
  },
};

export const postService = {
  list: async (tab: string = 'for-you'): Promise<Post[]> => {
    if (USE_MOCK) {
      const posts = usePostStore.getState().posts;
      if (tab === 'popular') {
        return [...posts].sort((a, b) => b.heartCount - a.heartCount);
      }
      if (tab === 'latest') {
        return [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      return posts;
    }
    return apiClient.get<Post[]>(`/posts?tab=${encodeURIComponent(tab)}`);
  },
  getById: async (postId: string): Promise<Post | undefined> => {
    if (USE_MOCK) {
      return usePostStore.getState().posts.find((p) => p.id === postId);
    }
    return apiClient.get<Post>(`/posts/${postId}`);
  },
  create: async (data: any) => {
    if (USE_MOCK) {
      return usePostStore.getState().addPost(data);
    }
    return apiClient.post<Post>('/posts', data);
  },
};

export const commentService = {
  list: async (postId: string): Promise<Comment[]> => {
    if (USE_MOCK) {
      return usePostStore.getState().comments[postId] || [];
    }
    return apiClient.get<Comment[]>(`/posts/${postId}/comments`);
  },
  create: async (postId: string, content: string, parentCommentId?: string) => {
    if (USE_MOCK) {
      usePostStore.getState().addComment(postId, content, parentCommentId);
      return true;
    }
    return apiClient.post(`/posts/${postId}/comments`, { content, parentCommentId });
  },
};

export const reportService = {
  create: async (data: any) => {
    if (USE_MOCK) {
      useReportStore.getState().addReport(data);
      return true;
    }
    return apiClient.post<Report>('/reports', data);
  },
};
