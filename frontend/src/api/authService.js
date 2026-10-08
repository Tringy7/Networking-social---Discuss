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

  verifyEmail: ({ email, code }) =>
    apiClient.post('/auth/verify-email', {
      email: (email || '').trim().toLowerCase(),
      code: (code || '').trim(),
    }),

  resendOtp: ({ email }) =>
    apiClient.post('/auth/resend-otp', {
      email: (email || '').trim().toLowerCase(),
    }),

  login: async ({ username, password }) => {
    const res = await apiClient.post('/auth/login', {
      username: (username || '').trim(),
      password,
    });
    storage.setSavedUser(res.data);
    return res;
  },

  refresh: () => apiClient.post('/auth/refresh'),

  loginSocial: async (provider = 'google', tokenPayload) => {
    const token = typeof tokenPayload === 'string' ? tokenPayload : tokenPayload?.token;
    const res = await apiClient.post(`/auth/social/${provider}`, { token });
    storage.setSavedUser(res.data);
    return res;
  },

  logout: async () => {
    try {
      return await apiClient.post('/auth/logout');
    } finally {
      storage.clearAll();
    }
  },
};