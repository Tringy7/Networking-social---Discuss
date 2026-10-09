import { apiClient } from './client';
import { COMMUNITY_ROLES } from '../constants/roles';

/**
 * Community API Service
 * Handles Community operations (Module 3)
 */

export const communityService = {
  /**
   * Tạo mới Community
   * Quy tắc: User tạo sẽ tự động trở thành OWNER
   */
  createCommunity: async (data, creatorId) => {
    await apiClient.delay(200);
    const { name, description, category, rules, avatar, banner } = data;

    if (!name || !description) {
      throw new Error('Vui lòng nhập tên và mô tả cho cộng đồng!');
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const newCommunity = {
      id: `comm-${Date.now()}`,
      slug: slug || `c-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      category: category || 'Chung',
      rules: Array.isArray(rules) && rules.length > 0 ? rules : [
        'Tôn trọng thành viên, không công kích cá nhân.',
        'Đăng nội dung đúng chủ đề cộng đồng.',
        'Không spam quảng cáo hoặc nội dung độc hại.'
      ],
      avatar: avatar || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
      banner: banner || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
      ownerId: creatorId,
      moderatorIds: [],
      memberCount: 1,
      postCount: 0,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
    };

    // Tạo membership OWNER cho người tạo
    const ownerMembership = {
      id: `m-${Date.now()}`,
      communityId: newCommunity.id,
      userId: creatorId,
      role: COMMUNITY_ROLES.OWNER,
      isBanned: false,
      joinedAt: new Date().toISOString(),
    };

    return { community: newCommunity, membership: ownerMembership };
  },

  /**
   * Tham gia Community
   * Quy tắc: role ban đầu luôn là MEMBER
   */
  joinCommunity: async (communityId, userId) => {
    await apiClient.delay(150);
    const newMembership = {
      id: `m-${Date.now()}`,
      communityId,
      userId,
      role: COMMUNITY_ROLES.MEMBER,
      isBanned: false,
      joinedAt: new Date().toISOString(),
    };
    return newMembership;
  },

  /**
   * Rời Community
   * Quy tắc quan trọng:
   * Không cho Owner rời trực tiếp. Phải chuyển quyền trước!
   */
  leaveCommunity: async (communityId, userId, currentRole) => {
    await apiClient.delay(150);
    if (currentRole === COMMUNITY_ROLES.OWNER) {
      throw new Error('Chủ sở hữu (Owner) không thể rời trực tiếp! Vui lòng chuyển quyền Owner cho thành viên khác trước khi rời.');
    }
    return { success: true, communityId, userId };
  },

  /**
   * Chuyển quyền Chủ sở hữu (Owner)
   */
  transferOwnership: async (communityId, currentOwnerId, newOwnerId) => {
    await apiClient.delay(200);
    if (currentOwnerId === newOwnerId) {
      throw new Error('Người nhận phải là một thành viên khác!');
    }
    return {
      success: true,
      communityId,
      previousOwnerId: currentOwnerId,
      newOwnerId,
    };
  },

  /**
   * Chỉnh sửa thông tin Community (Owner, Admin)
   */
  updateCommunity: async (communityId, updates) => {
    await apiClient.delay(200);
    return {
      communityId,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Gán Moderator (Owner, Admin)
   */
  assignModerator: async (communityId, userId) => {
    await apiClient.delay(150);
    return { communityId, userId, role: COMMUNITY_ROLES.MODERATOR };
  },

  /**
   * Xóa Moderator (Owner, Admin) -> Giảm xuống MEMBER
   */
  removeModerator: async (communityId, userId) => {
    await apiClient.delay(150);
    return { communityId, userId, role: COMMUNITY_ROLES.MEMBER };
  },

  /**
   * Kick thành viên khỏi Community (Mod, Owner, Admin)
   */
  kickMember: async (communityId, targetUserId) => {
    await apiClient.delay(150);
    return { success: true, communityId, targetUserId };
  },

  /**
   * Ban thành viên khỏi Community (Mod, Owner, Admin)
   */
  banMember: async (communityId, targetUserId, reason) => {
    await apiClient.delay(180);
    return { success: true, communityId, targetUserId, reason: reason || 'Vi phạm nội quy' };
  },

  /**
   * Unban thành viên trong Community (Mod, Owner, Admin)
   */
  unbanMember: async (communityId, targetUserId) => {
    await apiClient.delay(150);
    return { success: true, communityId, targetUserId };
  }
};
