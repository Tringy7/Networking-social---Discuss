import { apiClient } from './client';

/**
 * System Admin & Moderation API Service
 * Handles System Admin (Module 8) and Report Resolution (Module 4)
 */

export const adminService = {
  /**
   * Khóa tài khoản người dùng
   */
  lockUser: async (userId, reason) => {
    await apiClient.delay(180);
    return {
      userId,
      status: 'LOCKED',
      reason: reason || 'Vi phạm điều khoản dịch vụ Discuss',
      lockedAt: new Date().toISOString()
    };
  },

  /**
   * Mở khóa tài khoản người dùng
   */
  unlockUser: async (userId) => {
    await apiClient.delay(180);
    return {
      userId,
      status: 'ACTIVE',
      unlockedAt: new Date().toISOString()
    };
  },

  /**
   * Khóa / Mở khóa cộng đồng
   */
  toggleCommunityStatus: async (communityId, currentStatus) => {
    await apiClient.delay(180);
    const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    return { communityId, status: newStatus };
  },

  /**
   * Xử lý báo cáo bài viết vi phạm (Mod, Owner, Admin)
   * action: 'DISMISS' | 'DELETE_POST' | 'WARN_USER'
   */
  resolveReport: async (reportId, action, resolutionNote = '') => {
    await apiClient.delay(200);
    return {
      reportId,
      status: action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED',
      actionTaken: action,
      resolutionNote,
      resolvedAt: new Date().toISOString()
    };
  }
};
