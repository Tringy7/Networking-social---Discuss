import { SYSTEM_ROLES, COMMUNITY_ROLES } from '../constants/roles';

/**
 * Role & Permission helper functions
 * Corresponds exactly to the specification matrix
 */

export const permissions = {
  // Global Admin check
  isAdmin: (user) => user?.systemRole === SYSTEM_ROLES.ADMIN,

  // Check if logged in
  isAuthenticated: (user) => !!user && user.systemRole !== SYSTEM_ROLES.GUEST,

  // Check if user is active (not locked)
  isActiveUser: (user) => permissions.isAuthenticated(user) && user?.status !== 'LOCKED',

  // Community creation: User or Admin
  canCreateCommunity: (user) => permissions.isActiveUser(user),

  // Community view: Everyone (Guest, User, Admin)
  canViewCommunity: () => true,

  // Join community: Authenticated active user who isn't already a member and isn't banned
  canJoinCommunity: (user, membership) => {
    if (!permissions.isActiveUser(user)) return false;
    return !membership || membership.isBanned === false && !membership.role;
  },

  // Leave community: Member, Moderator can leave.
  // CRITICAL RULE: Owner cannot leave directly! Must transfer ownership first.
  canLeaveCommunity: (user, membership) => {
    if (!permissions.isActiveUser(user) || !membership) return false;
    if (membership.role === COMMUNITY_ROLES.OWNER) {
      return { allowed: false, reason: 'Chủ sở hữu (Owner) không thể rời trực tiếp. Bạn cần chuyển quyền Owner cho thành viên khác trước!' };
    }
    return { allowed: true };
  },

  // Edit community info: Owner of that community OR System Admin
  canEditCommunity: (user, communityRole) => {
    if (!permissions.isActiveUser(user)) return false;
    if (permissions.isAdmin(user)) return true;
    return communityRole === COMMUNITY_ROLES.OWNER;
  },

  // Assign/Remove Moderator: Owner of that community OR System Admin
  canManageModerators: (user, communityRole) => {
    if (!permissions.isActiveUser(user)) return false;
    if (permissions.isAdmin(user)) return true;
    return communityRole === COMMUNITY_ROLES.OWNER;
  },

  // Kick member: Moderator, Owner, OR System Admin
  // (Cannot kick the Owner unless System Admin)
  canKickMember: (user, communityRole, targetMemberRole) => {
    if (!permissions.isActiveUser(user)) return false;
    if (permissions.isAdmin(user)) return true;
    if (targetMemberRole === COMMUNITY_ROLES.OWNER) return false;
    if (communityRole === COMMUNITY_ROLES.OWNER) return true;
    if (communityRole === COMMUNITY_ROLES.MODERATOR && targetMemberRole === COMMUNITY_ROLES.MEMBER) return true;
    return false;
  },

  // Ban / Unban member: Moderator, Owner, OR System Admin
  canBanMember: (user, communityRole, targetMemberRole) => {
    return permissions.canKickMember(user, communityRole, targetMemberRole);
  },

  // Transfer Community Ownership: Current Owner or System Admin
  canTransferOwnership: (user, communityRole) => {
    if (!permissions.isActiveUser(user)) return false;
    if (permissions.isAdmin(user)) return true;
    return communityRole === COMMUNITY_ROLES.OWNER;
  },

  // Post creation: Any registered member of the community, or Admin
  canCreatePost: (user, communityRole) => {
    if (!permissions.isActiveUser(user)) return false;
    if (permissions.isAdmin(user)) return true;
    return !!communityRole; // Must be Member, Moderator, or Owner
  },

  // Edit post: Author only (while active)
  canEditPost: (user, post) => {
    if (!permissions.isActiveUser(user) || !post) return false;
    return user.id === post.authorId;
  },

  // Delete post: Author of post, OR Moderator, Owner, Admin
  canDeletePost: (user, post, communityRole) => {
    if (!permissions.isActiveUser(user) || !post) return false;
    if (user.id === post.authorId) return true;
    if (permissions.isAdmin(user)) return true;
    return communityRole === COMMUNITY_ROLES.OWNER || communityRole === COMMUNITY_ROLES.MODERATOR;
  },

  // Pin/Unpin post: Moderator, Owner, Admin
  canPinPost: (user, communityRole) => {
    if (!permissions.isActiveUser(user)) return false;
    if (permissions.isAdmin(user)) return true;
    return communityRole === COMMUNITY_ROLES.OWNER || communityRole === COMMUNITY_ROLES.MODERATOR;
  },

  // Report post: Any logged in user (not guest)
  canReportPost: (user) => permissions.isActiveUser(user),

  // Handle reports: Moderator, Owner, Admin
  canHandleReports: (user, communityRole) => {
    if (!permissions.isActiveUser(user)) return false;
    if (permissions.isAdmin(user)) return true;
    return communityRole === COMMUNITY_ROLES.OWNER || communityRole === COMMUNITY_ROLES.MODERATOR;
  },

  // Comments: Any logged-in member/user
  canComment: (user) => permissions.isActiveUser(user),

  // Edit comment: Author only
  canEditComment: (user, comment) => {
    if (!permissions.isActiveUser(user) || !comment) return false;
    return user.id === comment.authorId;
  },

  // Delete comment: Author, or Mod/Owner/Admin
  canDeleteComment: (user, comment, communityRole) => {
    if (!permissions.isActiveUser(user) || !comment) return false;
    if (user.id === comment.authorId) return true;
    if (permissions.isAdmin(user)) return true;
    return communityRole === COMMUNITY_ROLES.OWNER || communityRole === COMMUNITY_ROLES.MODERATOR;
  },

  // Vote: Any authenticated user
  canVote: (user) => permissions.isActiveUser(user),

  // System Administration: Global Admin only
  canAccessAdminPanel: (user) => permissions.isAdmin(user),
};
