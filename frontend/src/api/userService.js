import { apiClient } from './client';
import { storage } from '../utils/storage';

export const userService = {
  getMe: async () => {
    const res = await apiClient.get('/users/me');
    const userData = res?.data || res;
    if (userData && (userData.username || userData.email)) {
      storage.setSavedUser(userData);
    }
    return userData;
  },

  getUserById: async (userId) => {
    const res = await apiClient.get(`/users/${userId}`);
    return res?.data || res;
  },

  updateProfile: async (payload) => {
    const res = await apiClient.patch('/users/me/profile', payload);
    const updated = res?.data || res;
    if (updated && (updated.username || updated.email || updated.profile)) {
      storage.setSavedUser(updated);
    }
    return updated;
  },

  updateMe: async (payload) => {
    const res = await apiClient.patch('/users/me/profile', payload);
    const updated = res?.data || res;
    if (updated && (updated.username || updated.email || updated.profile)) {
      storage.setSavedUser(updated);
    }
    return updated;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.put('/users/me/avatar', formData);
    return res?.data || res;
  },

  uploadBanner: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.put('/users/me/banner', formData);
    return res?.data || res;
  },
};
