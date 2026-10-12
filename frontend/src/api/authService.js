import { apiClient } from './client';
import { storage } from '../utils/storage';

export const authService = {
  register: ({ username, email, password, confirmPassword }) =>
    apiClient.post('/auth/register', {
      username: (username || '').trim(),
      email: (email || '').trim().toLowerCase(),
      password,
      confirmPassword,
    }),

  verifyEmail: async ({ email, code }) => {
    const res = await apiClient.post('/auth/verify-email', {
      email: (email || '').trim().toLowerCase(),
      code: (code || '').trim(),
    });
    if (res?.data) {
      storage.setSavedUser(res.data);
    }
    return res;
  },

  resendOtp: ({ email }) =>
    apiClient.post('/auth/resend-otp', {
      email: (email || '').trim().toLowerCase(),
    }),

  login: async ({ username, password }) => {
    const res = await apiClient.post('/auth/login', {
      username: (username || '').trim(),
      password,
    });
    if (res?.data) {
      storage.setSavedUser(res.data);
    }
    return res;
  },

  refresh: () => apiClient.post('/auth/refresh'),

  loginSocial: async (provider = 'google', tokenPayload) => {
    const token = typeof tokenPayload === 'string' ? tokenPayload : tokenPayload?.token;
    const res = await apiClient.post(`/auth/social/${provider}`, { token });
    if (res?.data) {
      storage.setSavedUser(res.data);
    }
    return res;
  },

  logout: async () => {
    try {
      return await apiClient.post('/auth/logout');
    } finally {
      storage.clearAll();
    }
  },

  forgotPassword: (params) => {
    const email = typeof params === 'string' ? params : params?.email;
    return apiClient.post('/auth/forgot-password', {
      email: (email || '').trim().toLowerCase(),
    });
  },
};
