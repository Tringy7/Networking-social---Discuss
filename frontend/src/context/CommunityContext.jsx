import React, { createContext, useContext, useState, useEffect } from 'react';
import { COMMUNITY_ROLES } from '../constants/roles';
import { communityService } from '../api/communityService';
import { adminService } from '../api/adminService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { permissions } from '../utils/permissions';

const CommunityContext = createContext(null);

export function CommunityProvider({ children }) {
  const { currentUser } = useAuth();
  const { success, error: toastError, warning } = useToast();

  const [communities, setCommunities] = useState(() => {
    try {
      const saved = localStorage.getItem('discuss_communities');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [memberships, setMemberships] = useState(() => {
    try {
      const saved = localStorage.getItem('discuss_memberships');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('discuss_communities', JSON.stringify(communities));
      localStorage.setItem('discuss_memberships', JSON.stringify(memberships));
    } catch {
      // safe fallback
    }
  }, [communities, memberships]);

  /**
   * Lấy vai trò của user trong một community cụ thể:
   * OWNER | MODERATOR | MEMBER | null
   */
  const getUserCommunityRole = (communityId, targetUserId = currentUser?.id) => {
    if (!targetUserId || !communityId) return null;
    const mem = memberships.find(m => m.communityId === communityId && m.userId === targetUserId && !m.isBanned);
    return mem ? mem.role : null;
  };

  /**
   * Lấy chi tiết membership của user trong community
   */
  const getUserMembership = (communityId, targetUserId = currentUser?.id) => {
    if (!targetUserId || !communityId) return null;
    return memberships.find(m => m.communityId === communityId && m.userId === targetUserId) || null;
  };

  /**
   * Lấy danh sách thành viên trong community
   */
  const getCommunityMembers = (communityId) => {
    return memberships.filter(m => m.communityId === communityId);
  };

  /**
   * Tạo Community mới:
   * User tạo sẽ tự động trở thành OWNER
   */
  const createCommunity = async (formData) => {
    if (!currentUser) {
      toastError('Vui lòng đăng nhập để tạo cộng đồng!');
      return;
    }

    try {
      const { community, membership } = await communityService.createCommunity(formData, currentUser.id);
      setCommunities(prev => [community, ...prev]);
      setMemberships(prev => [...prev, membership]);
      success(`Tạo cộng đồng c/${community.slug} thành công! Bạn là Chủ sở hữu (Owner).`);
      return community;
    } catch (err) {
      toastError(err.message || 'Không thể tạo cộng đồng');
      throw err;
    }
  };

  /**
   * Tham gia Community:
   * User trở thành MEMBER
   */
  const joinCommunity = async (communityId) => {
    if (!currentUser) {
      toastError('Vui lòng đăng nhập để tham gia cộng đồng!');
      return;
    }

    const existing = getUserMembership(communityId);
    if (existing) {
      if (existing.isBanned) {
        toastError('Bạn đã bị cấm khỏi cộng đồng này!');
        return;
      }
      warning('Bạn đã là thành viên của cộng đồng này rồi.');
      return;
    }

    try {
      const newMembership = await communityService.joinCommunity(communityId, currentUser.id);
      setMemberships(prev => [...prev, newMembership]);
      setCommunities(prev =>
        prev.map(c => c.id === communityId ? { ...c, memberCount: c.memberCount + 1 } : c)
      );
      success('Đã tham gia cộng đồng thành công! Vai trò của bạn: Thành viên (Member).');
    } catch (err) {
      toastError(err.message || 'Không thể tham gia cộng đồng');
    }
  };

  /**
   * Rời Community:
   * QUY TẮC: Owner KHÔNG THỂ rời trực tiếp! Phải chuyển quyền trước.
   */
  const leaveCommunity = async (communityId) => {
    if (!currentUser) return;
    const currentRole = getUserCommunityRole(communityId);

    if (!currentRole) {
      toastError('Bạn không phải là thành viên cộng đồng này.');
      return;
    }

    if (currentRole === COMMUNITY_ROLES.OWNER) {
      toastError('Chủ sở hữu (Owner) không thể rời trực tiếp! Bạn cần chuyển quyền Owner cho thành viên khác trước khi rời.');
      return false;
    }

    try {
      await communityService.leaveCommunity(communityId, currentUser.id, currentRole);
      setMemberships(prev => prev.filter(m => !(m.communityId === communityId && m.userId === currentUser.id)));
      setCommunities(prev =>
        prev.map(c => c.id === communityId ? { ...c, memberCount: Math.max(1, c.memberCount - 1) } : c)
      );
      success('Đã rời khỏi cộng đồng thành công.');
      return true;
    } catch (err) {
      toastError(err.message || 'Không thể rời cộng đồng');
      return false;
    }
  };

  /**
   * Chuyển quyền Owner:
   * Owner cũ -> MEMBER, User được chọn -> OWNER
   */
  const transferOwnership = async (communityId, newOwnerUserId) => {
    const currentRole = getUserCommunityRole(communityId);
    if (!permissions.canTransferOwnership(currentUser, currentRole)) {
      toastError('Bạn không có quyền chuyển quyền Owner của cộng đồng này.');
      return;
    }

    try {
      await communityService.transferOwnership(communityId, currentUser.id, newOwnerUserId);

      // Cập nhật memberships:
      // Owner cũ -> MEMBER
      // newOwner -> OWNER
      setMemberships(prev => prev.map(m => {
        if (m.communityId === communityId) {
          if (m.userId === currentUser.id) {
            return { ...m, role: COMMUNITY_ROLES.MEMBER };
          }
          if (m.userId === newOwnerUserId) {
            return { ...m, role: COMMUNITY_ROLES.OWNER };
          }
        }
        return m;
      }));

      // Cập nhật ownerId trong community
      setCommunities(prev => prev.map(c => {
        if (c.id === communityId) {
          return {
            ...c,
            ownerId: newOwnerUserId,
            moderatorIds: c.moderatorIds.filter(id => id !== newOwnerUserId)
          };
        }
        return c;
      }));

      success('Đã chuyển quyền Chủ sở hữu (Owner) thành công! Vai trò hiện tại của bạn là Member.');
      return true;
    } catch (err) {
      toastError(err.message || 'Chuyển quyền Owner thất bại');
      throw err;
    }
  };

  /**
   * Chỉnh sửa thông tin Community (Owner hoặc Admin)
   */
  const updateCommunity = async (communityId, updates) => {
    const currentRole = getUserCommunityRole(communityId);
    if (!permissions.canEditCommunity(currentUser, currentRole)) {
      toastError('Chỉ Chủ sở hữu (Owner) hoặc Quản trị viên mới có thể chỉnh sửa thông tin cộng đồng!');
      return;
    }

    try {
      const updated = await communityService.updateCommunity(communityId, updates);
      setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, ...updated } : c));
      success('Cập nhật thông tin cộng đồng thành công!');
      return updated;
    } catch (err) {
      toastError(err.message || 'Cập nhật thất bại');
      throw err;
    }
  };

  /**
   * Gán Moderator (Owner hoặc Admin)
   */
  const assignModerator = async (communityId, targetUserId) => {
    const currentRole = getUserCommunityRole(communityId);
    if (!permissions.canManageModerators(currentUser, currentRole)) {
      toastError('Chỉ Chủ sở hữu hoặc Admin mới có quyền gán Điều hành viên (Moderator)!');
      return;
    }

    try {
      await communityService.assignModerator(communityId, targetUserId);
      setMemberships(prev => prev.map(m => {
        if (m.communityId === communityId && m.userId === targetUserId) {
          return { ...m, role: COMMUNITY_ROLES.MODERATOR };
        }
        return m;
      }));
      setCommunities(prev => prev.map(c => {
        if (c.id === communityId && !c.moderatorIds.includes(targetUserId)) {
          return { ...c, moderatorIds: [...c.moderatorIds, targetUserId] };
        }
        return c;
      }));
      success('Đã bổ nhiệm thành viên thành Điều hành viên (Moderator)!');
    } catch (err) {
      toastError(err.message || 'Không thể bổ nhiệm Moderator');
    }
  };

  /**
   * Xóa Moderator -> chuyển về MEMBER (Owner hoặc Admin)
   */
  const removeModerator = async (communityId, targetUserId) => {
    const currentRole = getUserCommunityRole(communityId);
    if (!permissions.canManageModerators(currentUser, currentRole)) {
      toastError('Chỉ Chủ sở hữu hoặc Admin mới có quyền thu hồi Moderator!');
      return;
    }

    try {
      await communityService.removeModerator(communityId, targetUserId);
      setMemberships(prev => prev.map(m => {
        if (m.communityId === communityId && m.userId === targetUserId) {
          return { ...m, role: COMMUNITY_ROLES.MEMBER };
        }
        return m;
      }));
      setCommunities(prev => prev.map(c => {
        if (c.id === communityId) {
          return { ...c, moderatorIds: c.moderatorIds.filter(id => id !== targetUserId) };
        }
        return c;
      }));
      success('Đã thu hồi quyền Điều hành viên (Moderator).');
    } catch (err) {
      toastError(err.message || 'Không thể thu hồi quyền');
    }
  };

  /**
   * Kick thành viên (Mod, Owner, Admin)
   */
  const kickMember = async (communityId, targetUserId) => {
    const currentRole = getUserCommunityRole(communityId);
    const targetRole = getUserCommunityRole(communityId, targetUserId);

    if (!permissions.canKickMember(currentUser, currentRole, targetRole)) {
      toastError('Bạn không có quyền kick thành viên này!');
      return;
    }

    try {
      await communityService.kickMember(communityId, targetUserId);
      setMemberships(prev => prev.filter(m => !(m.communityId === communityId && m.userId === targetUserId)));
      setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, memberCount: Math.max(1, c.memberCount - 1) } : c));
      success('Đã mời thành viên rời khỏi cộng đồng (Kick).');
    } catch (err) {
      toastError(err.message || 'Không thể kick thành viên');
    }
  };

  /**
   * Ban thành viên (Mod, Owner, Admin)
   */
  const banMember = async (communityId, targetUserId, reason) => {
    const currentRole = getUserCommunityRole(communityId);
    const targetRole = getUserCommunityRole(communityId, targetUserId);

    if (!permissions.canBanMember(currentUser, currentRole, targetRole)) {
      toastError('Bạn không có quyền cấm (Ban) thành viên này!');
      return;
    }

    try {
      await communityService.banMember(communityId, targetUserId, reason);
      setMemberships(prev => prev.map(m => {
        if (m.communityId === communityId && m.userId === targetUserId) {
          return { ...m, isBanned: true, banReason: reason };
        }
        return m;
      }));
      success('Đã cấm (Ban) thành viên khỏi cộng đồng.');
    } catch (err) {
      toastError(err.message || 'Không thể ban thành viên');
    }
  };

  /**
   * Unban thành viên (Mod, Owner, Admin)
   */
  const unbanMember = async (communityId, targetUserId) => {
    const currentRole = getUserCommunityRole(communityId);
    const targetRole = getUserCommunityRole(communityId, targetUserId);

    if (!permissions.canBanMember(currentUser, currentRole, targetRole)) {
      toastError('Bạn không có quyền gỡ cấm thành viên này!');
      return;
    }

    try {
      await communityService.unbanMember(communityId, targetUserId);
      setMemberships(prev => prev.map(m => {
        if (m.communityId === communityId && m.userId === targetUserId) {
          return { ...m, isBanned: false, banReason: null };
        }
        return m;
      }));
      success('Đã gỡ cấm (Unban) cho thành viên.');
    } catch (err) {
      toastError(err.message || 'Không thể unban thành viên');
    }
  };

  /**
   * Khóa / Mở khóa Community (System Admin)
   */
  const toggleCommunityStatus = async (communityId) => {
    if (!permissions.isAdmin(currentUser)) {
      toastError('Chỉ Quản trị viên hệ thống mới có quyền này!');
      return;
    }

    const comm = communities.find(c => c.id === communityId);
    if (!comm) return;

    try {
      const res = await adminService.toggleCommunityStatus(communityId, comm.status);
      setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, status: res.status } : c));
      success(`Đã ${res.status === 'LOCKED' ? 'khóa' : 'mở khóa'} cộng đồng c/${comm.slug}`);
    } catch (err) {
      toastError(err.message || 'Lỗi khi thay đổi trạng thái');
    }
  };

  return (
    <CommunityContext.Provider
      value={{
        communities,
        memberships,
        getUserCommunityRole,
        getUserMembership,
        getCommunityMembers,
        createCommunity,
        joinCommunity,
        leaveCommunity,
        transferOwnership,
        updateCommunity,
        assignModerator,
        removeModerator,
        kickMember,
        banMember,
        unbanMember,
        toggleCommunityStatus,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
}
