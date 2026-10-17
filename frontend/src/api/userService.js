import { apiClient } from './client';
import { storage } from '../utils/storage';

export const userService = {
  /**
   * GET /users/me
   * Lấy thông tin tài khoản và hồ sơ người dùng hiện tại
   */
  getMe: async () => {
    const res = await apiClient.get('/users/me');
    // Backend trả về trực tiếp user object (hoặc res.data nếu có wrapper)
    const userData = res?.data || res;
    if (userData && (userData.username || userData.email)) {
      storage.setSavedUser(userData);
    }
    return userData;
  },

  /**
   * GET /users/{userId}
   * Xem hồ sơ công khai của người dùng khác
   */
  getUserById: async (userId) => {
    const res = await apiClient.get(`/users/${userId}`);
    return res?.data || res;
  },

  /**
   * Cập nhật thông tin profile/privacy (nếu backend hỗ trợ PUT/PATCH /users/me)
   */
  updateMe: async (payload) => {
    const res = await apiClient.put('/users/me', payload);
    const updated = res?.data || res;
    if (updated) {
      storage.setSavedUser(updated);
    }
    return updated;
  },
};
