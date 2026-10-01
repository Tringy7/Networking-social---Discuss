import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/authApi';
import {
  INITIAL_USERS,
  INITIAL_COMMUNITIES,
  INITIAL_MEMBERS,
  INITIAL_POSTS,
  INITIAL_COMMENTS,
  INITIAL_VOTES,
  INITIAL_REPORTS,
  GOOGLE_DEMO_ACCOUNTS,
} from '../data/initialData';

const AppContext = createContext(null);

const STORAGE_KEY_PREFIX = 'discuss_social_v1_';

function getStored(key, fallback) {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStored(key, value) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

export const AppProvider = ({ children }) => {
  const [users, setUsers] = useState(() => getStored('users', INITIAL_USERS));
  const [currentUserId, setCurrentUserId] = useState(() => getStored('currentUserId', 'user-a'));
  const [communities, setCommunities] = useState(() => getStored('communities', INITIAL_COMMUNITIES));
  const [members, setMembers] = useState(() => getStored('members', INITIAL_MEMBERS));
  const [posts, setPosts] = useState(() => getStored('posts', INITIAL_POSTS));
  const [comments, setComments] = useState(() => getStored('comments', INITIAL_COMMENTS));
  const [votes, setVotes] = useState(() => getStored('votes', INITIAL_VOTES));
  const [reports, setReports] = useState(() => getStored('reports', INITIAL_REPORTS));

  // Navigation & Filter states
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortFilter, setSortFilter] = useState('hot');
  const [activePostId, setActivePostId] = useState(null);

  // Modals state
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Auth tokens & verification states
  const [tokens, setTokens] = useState(() => getStored('tokens', null));
  const [pendingEmailForVerification, setPendingEmailForVerification] = useState(() =>
    getStored('pendingVerificationEmail', '23110350@student.hcmute.edu.vn')
  );
  const [pendingResetToken, setPendingResetToken] = useState('reset-token-xyz');

  // Sync to storage
  useEffect(() => setStored('tokens', tokens), [tokens]);
  useEffect(() => setStored('pendingVerificationEmail', pendingEmailForVerification), [pendingEmailForVerification]);

  // Sync to storage
  useEffect(() => setStored('users', users), [users]);
  useEffect(() => setStored('currentUserId', currentUserId), [currentUserId]);
  useEffect(() => setStored('communities', communities), [communities]);
  useEffect(() => setStored('members', members), [members]);
  useEffect(() => setStored('posts', posts), [posts]);
  useEffect(() => setStored('comments', comments), [comments]);
  useEffect(() => setStored('votes', votes), [votes]);
  useEffect(() => setStored('reports', reports), [reports]);

  // Current user resolution
  const currentUser = currentUserId ? users.find((u) => u.id === currentUserId) || null : null;
  const isGuest = !currentUser;

  // Auth methods
  const loginAs = (userId) => {
    if (userId === null) {
      setCurrentUserId(null);
      return;
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    if (target.isLocked) {
      alert(`Tài khoản "${target.displayName}" đã bị Quản trị viên (Admin) khóa! Vui lòng liên hệ hỗ trợ.`);
      return;
    }
    setCurrentUserId(userId);
  };

  const register = (username, displayName, email) => {
    const trimmedUser = username.trim().toLowerCase();
    if (!trimmedUser || !displayName.trim()) {
      return { success: false, message: 'Vui lòng nhập tên đăng nhập và tên hiển thị hợp lệ.' };
    }
    if (users.some((u) => u.username.toLowerCase() === trimmedUser)) {
      return { success: false, message: 'Tên đăng nhập đã tồn tại trong hệ thống.' };
    }
    const newUser = {
      id: `user-${Date.now()}`,
      username: trimmedUser,
      displayName: displayName.trim(),
      email: email.trim() || `${trimmedUser}@example.com`,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      bio: 'Thành viên mới của Discuss.',
      globalRole: 'USER',
      isLocked: false,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    return { success: true, message: `Đăng ký thành công! Chào mừng ${newUser.displayName}.` };
  };

  const logout = () => {
    if (tokens?.refreshToken) {
      authApi.logout({ refreshToken: tokens.refreshToken }).catch(() => {});
    }
    setTokens(null);
    setCurrentUserId(null);
  };

  // 1. Auth & Account API Methods
  const registerWithApi = async (req) => {
    try {
      const res = await authApi.register(req);
      const existing = users.find((u) => u.username.toLowerCase() === req.username.toLowerCase());
      if (existing) {
        setUsers((prev) =>
          prev.map((u) => (u.id === existing.id ? { ...u, status: 'PENDING', email: req.email } : u))
        );
      } else {
        const newUser = {
          id: res.id,
          username: res.username,
          displayName: res.username,
          email: res.email,
          avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
          bio: 'Thành viên mới của Discuss.',
          globalRole: res.role,
          isLocked: false,
          status: 'PENDING',
          createdAt: res.createdAt,
        };
        setUsers((prev) => [...prev, newUser]);
      }
      setPendingEmailForVerification(req.email);
      return {
        success: true,
        message: 'Đăng ký tài khoản thành công! Mã xác thực đã được gửi về email của bạn.',
        data: res,
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Đăng ký tài khoản thất bại',
      };
    }
  };

  const verifyEmailWithApi = async (req) => {
    try {
      const res = await authApi.verifyEmail(req);
      setUsers((prev) =>
        prev.map((u) => (u.email.toLowerCase() === req.email.toLowerCase() ? { ...u, status: 'ACTIVE' } : u))
      );
      return {
        success: true,
        message: res || 'Email verified successfully',
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Xác thực email thất bại',
      };
    }
  };

  const loginWithApi = async (req) => {
    try {
      const res = await authApi.login(req);
      const authSession = {
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        expiresIn: res.expiresIn,
        user: res.user,
      };
      setTokens(authSession);

      let user = users.find(
        (u) => u.id === res.user.id || u.username.toLowerCase() === res.user.username.toLowerCase()
      );
      if (!user) {
        user = {
          id: res.user.id,
          username: res.user.username,
          displayName: res.user.username,
          email: `${res.user.username}@discuss.vn`,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          bio: 'Thành viên Discuss.',
          globalRole: res.user.role,
          isLocked: false,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        };
        setUsers((prev) => [...prev, user]);
      } else {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: 'ACTIVE' } : u))
        );
      }

      setCurrentUserId(user.id);
      return {
        success: true,
        message: 'Đăng nhập thành công!',
        data: res,
      };
    } catch (err) {
      const isPending = err.data?.status === 'PENDING' || err.data?.needsVerification;
      return {
        success: false,
        message: err.message || 'Đăng nhập thất bại',
        needsVerification: isPending,
        email: err.data?.email,
      };
    }
  };

  const loginWithGoogle = async (googleUser) => {
    try {
      const res = await authApi.loginWithGoogle(googleUser);
      setTokens({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        expiresIn: res.expiresIn,
        user: res.user,
      });

      // Update or insert user in context state
      setUsers((prev) => {
        const existingIdx = prev.findIndex(
          (u) => u.id === res.user.id || u.email.toLowerCase() === res.user.email.toLowerCase()
        );
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = {
            ...next[existingIdx],
            ...res.user,
            globalRole: res.user.globalRole || res.user.role || next[existingIdx].globalRole,
            status: 'ACTIVE',
          };
          return next;
        } else {
          return [
            ...prev,
            {
              id: res.user.id,
              username: res.user.username,
              displayName: res.user.displayName || res.user.username,
              email: res.user.email,
              avatar: res.user.avatar,
              bio: 'Thành viên gia nhập Discuss qua Google.',
              globalRole: res.user.globalRole || res.user.role || 'USER',
              isLocked: false,
              status: 'ACTIVE',
              provider: 'GOOGLE',
              createdAt: new Date().toISOString(),
            },
          ];
        }
      });

      setCurrentUserId(res.user.id);
      setIsAuthModalOpen(false);
      return {
        success: true,
        message: res.message || 'Đăng nhập bằng Google thành công!',
        user: res.user,
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Đăng nhập Google thất bại',
      };
    }
  };

  const logoutWithApi = async () => {
    try {
      const token = tokens?.refreshToken || '8f14e45fceea167a5a36dedd4bea2543';
      const res = await authApi.logout({ refreshToken: token });
      setTokens(null);
      setCurrentUserId(null);
      return {
        success: true,
        message: res.message || 'Đăng xuất thành công',
      };
    } catch (err) {
      setTokens(null);
      setCurrentUserId(null);
      return {
        success: true,
        message: 'Đăng xuất thành công',
      };
    }
  };

  const refreshTokenWithApi = async () => {
    try {
      const token = tokens?.refreshToken || '8f14e45fceea167a5a36dedd4bea2543';
      const res = await authApi.refreshToken({ refreshToken: token });
      if (tokens) {
        setTokens({
          ...tokens,
          accessToken: res.accessToken,
          expiresIn: res.expiresIn,
        });
      }
      return {
        success: true,
        message: 'Làm mới token thành công!',
        data: res,
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Làm mới token thất bại',
      };
    }
  };

  const forgotPasswordWithApi = async (req) => {
    try {
      const res = await authApi.forgotPassword(req);
      setPendingResetToken('reset-token-xyz');
      return {
        success: true,
        message: res.message || 'Đã gửi email đặt lại mật khẩu',
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Gửi yêu cầu quên mật khẩu thất bại',
      };
    }
  };

  const resetPasswordWithApi = async (req) => {
    try {
      const res = await authApi.resetPassword(req);
      return {
        success: true,
        message: res.message || 'Đặt lại mật khẩu thành công',
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Đặt lại mật khẩu thất bại',
      };
    }
  };

  const forgotPassword = (email) => {
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return { success: false, message: 'Không tìm thấy tài khoản với email này trong hệ thống.' };
    }
    return {
      success: true,
      message: `Đã xác thực email ${email}. Hệ thống đã đặt lại mật khẩu tạm thời thành "123456" cho tài khoản ${user.username}.`,
    };
  };

  const updateProfile = (data) => {
    if (!currentUser) return { success: false, message: 'Bạn chưa đăng nhập.' };
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...data } : u))
    );
    return { success: true, message: 'Cập nhật thông tin cá nhân thành công!' };
  };

  // Community Role helpers
  const getUserCommunityRole = (communityId, userId = currentUser?.id) => {
    if (!userId) return null;
    const member = members.find((m) => m.communityId === communityId && m.userId === userId);
    return member ? member.role : null;
  };

  const isUserBannedInCommunity = (communityId, userId = currentUser?.id) => {
    if (!userId) return false;
    const member = members.find((m) => m.communityId === communityId && m.userId === userId);
    return member ? member.isBanned : false;
  };

  const isMemberOfCommunity = (communityId, userId = currentUser?.id) => {
    if (!userId) return false;
    return members.some((m) => m.communityId === communityId && m.userId === userId);
  };

  // Community Actions
  const joinCommunity = (communityId) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return { success: false, message: 'Vui lòng đăng nhập để tham gia cộng đồng.' };
    }
    if (currentUser.isLocked) {
      return { success: false, message: 'Tài khoản của bạn đang bị khóa bởi Admin.' };
    }
    const comm = communities.find((c) => c.id === communityId);
    if (!comm || comm.isDeleted || comm.isLocked) {
      return { success: false, message: 'Cộng đồng này không khả dụng hoặc đã bị hạn chế.' };
    }

    const existing = members.find((m) => m.communityId === communityId && m.userId === currentUser.id);
    if (existing) {
      if (existing.isBanned) {
        return { success: false, message: 'Bạn đã bị cấm (Banned) khỏi cộng đồng này.' };
      }
      return { success: false, message: 'Bạn đã là thành viên của cộng đồng này.' };
    }

    const newMember = {
      communityId,
      userId: currentUser.id,
      role: 'MEMBER',
      isBanned: false,
      joinedAt: new Date().toISOString(),
    };
    setMembers((prev) => [...prev, newMember]);
    return { success: true, message: `Bạn đã tham gia thành công ${comm.name} với vai trò Member.` };
  };

  const leaveCommunity = (communityId) => {
    if (!currentUser) return { success: false, message: 'Bạn chưa đăng nhập.' };
    const member = members.find((m) => m.communityId === communityId && m.userId === currentUser.id);
    if (!member) return { success: false, message: 'Bạn chưa tham gia cộng đồng này.' };

    if (member.role === 'OWNER') {
      return {
        success: false,
        message: 'Owner không thể rời trực tiếp! Vui lòng chuyển giao quyền Owner cho thành viên khác trước, sau đó bạn sẽ trở thành Member và có thể rời.',
      };
    }

    setMembers((prev) => prev.filter((m) => !(m.communityId === communityId && m.userId === currentUser.id)));
    return { success: true, message: 'Bạn đã rời cộng đồng thành công.' };
  };

  const createCommunity = (name, slug, description, icon, banner, rules) => {
    if (!currentUser) return { success: false, message: 'Vui lòng đăng nhập để tạo cộng đồng.' };
    if (currentUser.isLocked) return { success: false, message: 'Tài khoản của bạn đã bị khóa.' };

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanSlug) return { success: false, message: 'Đường dẫn slug cộng đồng không hợp lệ.' };

    if (communities.some((c) => c.slug === cleanSlug && !c.isDeleted)) {
      return { success: false, message: `Tên đường dẫn c/${cleanSlug} đã tồn tại. Vui lòng chọn tên khác.` };
    }

    const newCommId = `comm-${Date.now()}`;
    const newCommunity = {
      id: newCommId,
      slug: cleanSlug,
      name: name.trim().startsWith('c/') ? name.trim() : `c/${name.trim()}`,
      description: description.trim(),
      icon: icon || '👥',
      banner: banner || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
      rules: rules.filter((r) => r.trim().length > 0),
      ownerId: currentUser.id,
      isLocked: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };

    const newMembership = {
      communityId: newCommId,
      userId: currentUser.id,
      role: 'OWNER',
      isBanned: false,
      joinedAt: new Date().toISOString(),
    };

    setCommunities((prev) => [...prev, newCommunity]);
    setMembers((prev) => [...prev, newMembership]);
    setSelectedCommunityId(newCommId);

    return { success: true, message: `Đã tạo cộng đồng ${newCommunity.name}! Bạn hiện là OWNER.`, communityId: newCommId };
  };

  const updateCommunity = (communityId, data) => {
    if (!currentUser) return { success: false, message: 'Bạn chưa đăng nhập.' };
    const role = getUserCommunityRole(communityId, currentUser.id);
    const isAdmin = currentUser.globalRole === 'ADMIN';

    if (role !== 'OWNER' && !isAdmin) {
      return { success: false, message: 'Chỉ Owner của cộng đồng hoặc Quản trị viên hệ thống (Admin) mới có quyền chỉnh sửa thông tin Community.' };
    }

    setCommunities((prev) =>
      prev.map((c) => (c.id === communityId ? { ...c, ...data } : c))
    );
    return { success: true, message: 'Cập nhật thông tin cộng đồng thành công!' };
  };

  const transferOwnership = (communityId, newOwnerId) => {
    if (!currentUser) return { success: false, message: 'Bạn chưa đăng nhập.' };
    const role = getUserCommunityRole(communityId, currentUser.id);
    const isAdmin = currentUser.globalRole === 'ADMIN';

    if (role !== 'OWNER' && !isAdmin) {
      return { success: false, message: 'Chỉ Owner hiện tại mới có quyền chuyển giao quyền sở hữu.' };
    }

    if (newOwnerId === currentUser.id && !isAdmin) {
      return { success: false, message: 'Bạn đã là Owner của cộng đồng này.' };
    }

    const newOwnerMember = members.find((m) => m.communityId === communityId && m.userId === newOwnerId);
    if (!newOwnerMember) {
      return { success: false, message: 'Người nhận chuyển quyền phải là thành viên trong cộng đồng này.' };
    }

    setCommunities((prev) =>
      prev.map((c) => (c.id === communityId ? { ...c, ownerId: newOwnerId } : c))
    );

    setMembers((prev) =>
      prev.map((m) => {
        if (m.communityId === communityId) {
          if (m.userId === currentUser.id && !isAdmin) {
            return { ...m, role: 'MEMBER' };
          }
          if (m.userId === newOwnerId) {
            return { ...m, role: 'OWNER' };
          }
        }
        return m;
      })
    );

    return {
      success: true,
      message: 'Chuyển quyền Owner thành công! Vai trò của bạn đã chuyển thành Member (bây giờ bạn đã có thể rời cộng đồng nếu muốn).',
    };
  };

  const setModeratorRole = (communityId, targetUserId, makeModerator) => {
    if (!currentUser) return { success: false, message: 'Bạn chưa đăng nhập.' };
    const role = getUserCommunityRole(communityId, currentUser.id);
    const isAdmin = currentUser.globalRole === 'ADMIN';

    if (role !== 'OWNER' && !isAdmin) {
      return { success: false, message: 'Chỉ Owner hoặc Admin mới có quyền Gán / Xóa Moderator.' };
    }

    const targetMember = members.find((m) => m.communityId === communityId && m.userId === targetUserId);
    if (!targetMember) return { success: false, message: 'Người dùng không phải thành viên cộng đồng.' };
    if (targetMember.role === 'OWNER') return { success: false, message: 'Không thể thay đổi vai trò của Owner.' };

    const newRole = makeModerator ? 'MODERATOR' : 'MEMBER';
    setMembers((prev) =>
      prev.map((m) =>
        m.communityId === communityId && m.userId === targetUserId ? { ...m, role: newRole } : m
      )
    );

    return {
      success: true,
      message: makeModerator
        ? 'Đã thăng cấp thành viên lên Moderator thành công!'
        : 'Đã hủy quyền Moderator, chuyển về Member thường.',
    };
  };

  const kickMember = (communityId, targetUserId) => {
    if (!currentUser) return { success: false, message: 'Bạn chưa đăng nhập.' };
    const role = getUserCommunityRole(communityId, currentUser.id);
    const isAdmin = currentUser.globalRole === 'ADMIN';

    if (role !== 'MODERATOR' && role !== 'OWNER' && !isAdmin) {
      return { success: false, message: 'Bạn không có quyền kick thành viên trong cộng đồng này.' };
    }

    const targetMember = members.find((m) => m.communityId === communityId && m.userId === targetUserId);
    if (!targetMember) return { success: false, message: 'Thành viên không tồn tại trong cộng đồng.' };

    if (targetMember.role === 'OWNER') {
      return { success: false, message: 'Không thể kick Owner của cộng đồng.' };
    }
    if (role === 'MODERATOR' && targetMember.role === 'MODERATOR') {
      return { success: false, message: 'Moderator không thể kick Moderator khác.' };
    }

    setMembers((prev) => prev.filter((m) => !(m.communityId === communityId && m.userId === targetUserId)));
    return { success: true, message: 'Đã kick thành viên khỏi cộng đồng.' };
  };

  const toggleBanMember = (communityId, targetUserId) => {
    if (!currentUser) return { success: false, message: 'Bạn chưa đăng nhập.' };
    const role = getUserCommunityRole(communityId, currentUser.id);
    const isAdmin = currentUser.globalRole === 'ADMIN';

    if (role !== 'MODERATOR' && role !== 'OWNER' && !isAdmin) {
      return { success: false, message: 'Chỉ Moderator, Owner hoặc Admin mới có quyền Ban/Unban thành viên.' };
    }

    const targetMember = members.find((m) => m.communityId === communityId && m.userId === targetUserId);
    if (!targetMember) return { success: false, message: 'Thành viên không thuộc cộng đồng.' };

    if (targetMember.role === 'OWNER') {
      return { success: false, message: 'Không thể cấm (Ban) Owner của cộng đồng.' };
    }
    if (role === 'MODERATOR' && targetMember.role === 'MODERATOR') {
      return { success: false, message: 'Moderator không thể Ban Moderator khác.' };
    }

    const newBanStatus = !targetMember.isBanned;
    setMembers((prev) =>
      prev.map((m) =>
        m.communityId === communityId && m.userId === targetUserId
          ? { ...m, isBanned: newBanStatus }
          : m
      )
    );

    return {
      success: true,
      message: newBanStatus
        ? 'Đã cấm (Ban) thành viên này khỏi các hoạt động trong cộng đồng.'
        : 'Đã gỡ cấm (Unban) cho thành viên.',
    };
  };

  // Post Actions
  const createPost = (communityId, title, content, image) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return { success: false, message: 'Vui lòng đăng nhập để đăng bài viết.' };
    }
    if (currentUser.isLocked) {
      return { success: false, message: 'Tài khoản của bạn đã bị Admin khóa.' };
    }

    const role = getUserCommunityRole(communityId, currentUser.id);
    const isBanned = isUserBannedInCommunity(communityId, currentUser.id);

    if (isBanned) {
      return { success: false, message: 'Bạn đã bị cấm (Banned) đăng bài trong cộng đồng này.' };
    }

    if (!role && currentUser.globalRole !== 'ADMIN') {
      return { success: false, message: 'Bạn cần tham gia cộng đồng này trước khi đăng bài viết.' };
    }

    if (!title.trim() || !content.trim()) {
      return { success: false, message: 'Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.' };
    }

    const newPost = {
      id: `post-${Date.now()}`,
      communityId,
      authorId: currentUser.id,
      title: title.trim(),
      content: content.trim(),
      image,
      isPinned: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) => [newPost, ...prev]);
    setVotes((prev) => [...prev, { postId: newPost.id, userId: currentUser.id, value: 1 }]);

    return { success: true, message: 'Đăng bài viết thành công!', postId: newPost.id };
  };

  const updatePost = (postId, title, content) => {
    if (!currentUser) return { success: false, message: 'Bạn chưa đăng nhập.' };
    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return { success: false, message: 'Bài viết không tồn tại.' };

    if (targetPost.authorId !== currentUser.id) {
      return { success: false, message: 'Bạn chỉ có quyền chỉnh sửa bài viết của chính mình.' };
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, title: title.trim(), content: content.trim(), updatedAt: new Date().toISOString() } : p
      )
    );
    return { success: true, message: 'Chỉnh sửa bài viết thành công!' };
  };

  const deletePost = (postId) => {
    if (!currentUser) return { success: false, message: 'Bạn chưa đăng nhập.' };
    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return { success: false, message: 'Bài viết không tồn tại.' };

    const role = getUserCommunityRole(targetPost.communityId, currentUser.id);
    const isAdmin = currentUser.globalRole === 'ADMIN';
    const isAuthor = targetPost.authorId === currentUser.id;
    const isModOrOwner = role === 'MODERATOR' || role === 'OWNER';

    if (!isAuthor && !isModOrOwner && !isAdmin) {
      return { success: false, message: 'Bạn không có quyền xóa bài viết này.' };
    }

    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isDeleted: true } : p)));
    if (activePostId === postId) setActivePostId(null);
    return { success: true, message: 'Bài viết đã được xóa.' };
  };

  const togglePinPost = (postId) => {
    if (!currentUser) return { success: false, message: 'Bạn chưa đăng nhập.' };
    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return { success: false, message: 'Bài viết không tồn tại.' };

    const role = getUserCommunityRole(targetPost.communityId, currentUser.id);
    const isAdmin = currentUser.globalRole === 'ADMIN';

    if (role !== 'MODERATOR' && role !== 'OWNER' && !isAdmin) {
      return { success: false, message: 'Chỉ Moderator, Owner hoặc Admin mới có quyền Ghim / Bỏ ghim bài viết.' };
    }

    const newPinned = !targetPost.isPinned;
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isPinned: newPinned } : p))
    );

    return {
      success: true,
      message: newPinned ? 'Đã ghim bài viết lên đầu cộng đồng!' : 'Đã bỏ ghim bài viết.',
    };
  };

  const votePost = (postId, value) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setVotes((prev) => {
      const existing = prev.find((v) => v.postId === postId && v.userId === currentUser.id);
      if (!existing) {
        return [...prev, { postId, userId: currentUser.id, value }];
      }
      if (existing.value === value) {
        return prev.filter((v) => !(v.postId === postId && v.userId === currentUser.id));
      }
      return prev.map((v) =>
        v.postId === postId && v.userId === currentUser.id ? { ...v, value } : v
      );
    });
  };

  const getPostScore = (postId) => {
    return votes
      .filter((v) => v.postId === postId)
      .reduce((acc, v) => acc + v.value, 0);
  };

  const getUserVote = (postId) => {
    if (!currentUser) return 0;
    const vote = votes.find((v) => v.postId === postId && v.userId === currentUser.id);
    return vote ? vote.value : 0;
  };

  // Comment Actions
  const addComment = (postId, content, parentId = null) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return { success: false, message: 'Vui lòng đăng nhập để bình luận.' };
    }
    if (currentUser.isLocked) {
      return { success: false, message: 'Tài khoản của bạn đã bị khóa.' };
    }
    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost || targetPost.isDeleted) {
      return { success: false, message: 'Bài viết không tồn tại hoặc đã bị xóa.' };
    }

    const isBanned = isUserBannedInCommunity(targetPost.communityId, currentUser.id);
    if (isBanned) {
      return { success: false, message: 'Bạn đã bị cấm tương tác trong cộng đồng này.' };
    }

    if (!content.trim()) {
      return { success: false, message: 'Vui lòng nhập nội dung bình luận.' };
    }

    const newComment = {
      id: `comment-${Date.now()}`,
      postId,
      authorId: currentUser.id,
      parentId,
      content: content.trim(),
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, newComment]);
    return { success: true, message: parentId ? 'Đã trả lời bình luận!' : 'Đã đăng bình luận thành công!' };
  };

  const updateComment = (commentId, content) => {
    if (!currentUser) return { success: false, message: 'Bạn chưa đăng nhập.' };
    const target = comments.find((c) => c.id === commentId);
    if (!target || target.isDeleted) return { success: false, message: 'Bình luận không tồn tại.' };

    if (target.authorId !== currentUser.id) {
      return { success: false, message: 'Bạn chỉ có quyền chỉnh sửa bình luận của chính mình.' };
    }

    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, content: content.trim(), updatedAt: new Date().toISOString() } : c
      )
    );
    return { success: true, message: 'Đã cập nhật bình luận.' };
  };

  const deleteComment = (commentId) => {
    if (!currentUser) return { success: false, message: 'Bạn chưa đăng nhập.' };
    const target = comments.find((c) => c.id === commentId);
    if (!target) return { success: false, message: 'Bình luận không tồn tại.' };

    const targetPost = posts.find((p) => p.id === target.postId);
    const commId = targetPost?.communityId || '';
    const role = getUserCommunityRole(commId, currentUser.id);
    const isAdmin = currentUser.globalRole === 'ADMIN';
    const isAuthor = target.authorId === currentUser.id;
    const isModOrOwner = role === 'MODERATOR' || role === 'OWNER';

    if (!isAuthor && !isModOrOwner && !isAdmin) {
      return { success: false, message: 'Bạn không có quyền xóa bình luận này.' };
    }

    const deletedBy = isAuthor ? 'AUTHOR' : isAdmin ? 'ADMIN' : 'MODERATOR';

    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, isDeleted: true, deletedBy } : c))
    );
    return { success: true, message: 'Đã xóa bình luận.' };
  };

  // Report & Moderation
  const reportPost = (postId, reason, details) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return { success: false, message: 'Vui lòng đăng nhập để báo cáo bài viết.' };
    }

    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return { success: false, message: 'Bài viết không tồn tại.' };

    const newReport = {
      id: `report-${Date.now()}`,
      postId,
      reportedByUserId: currentUser.id,
      reason,
      details: details?.trim(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    setReports((prev) => [newReport, ...prev]);
    return { success: true, message: 'Đã gửi báo cáo đến ban điều hành cộng đồng. Cảm ơn bạn!' };
  };

  const resolveReport = (reportId, action) => {
    if (!currentUser) return { success: false, message: 'Bạn chưa đăng nhập.' };
    const report = reports.find((r) => r.id === reportId);
    if (!report) return { success: false, message: 'Báo cáo không tồn tại.' };

    const targetPost = posts.find((p) => p.id === report.postId);
    const commId = targetPost?.communityId;
    const role = commId ? getUserCommunityRole(commId, currentUser.id) : null;
    const isAdmin = currentUser.globalRole === 'ADMIN';

    if (role !== 'MODERATOR' && role !== 'OWNER' && !isAdmin) {
      return { success: false, message: 'Chỉ Moderator, Owner hoặc Admin mới có quyền xử lý báo cáo.' };
    }

    if (action === 'DISMISS') {
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: 'DISMISSED', resolvedByUserId: currentUser.id, resolvedAt: new Date().toISOString() }
            : r
        )
      );
      return { success: true, message: 'Đã bác bỏ báo cáo (Bài viết hợp lệ).' };
    }

    if (action === 'DELETE_POST' && targetPost) {
      setPosts((prev) => prev.map((p) => (p.id === targetPost.id ? { ...p, isDeleted: true } : p)));
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: 'RESOLVED_DELETED', resolvedByUserId: currentUser.id, resolvedAt: new Date().toISOString() }
            : r
        )
      );
      return { success: true, message: 'Đã xóa bài viết vi phạm và đóng báo cáo.' };
    }

    if (action === 'BAN_USER' && targetPost && commId) {
      setPosts((prev) => prev.map((p) => (p.id === targetPost.id ? { ...p, isDeleted: true } : p)));
      toggleBanMember(commId, targetPost.authorId);
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: 'RESOLVED_DELETED', resolvedByUserId: currentUser.id, resolvedAt: new Date().toISOString() }
            : r
        )
      );
      return { success: true, message: 'Đã xóa bài viết và Ban tác giả khỏi cộng đồng.' };
    }

    return { success: false, message: 'Hành động không hợp lệ.' };
  };

  // System Administration
  const toggleLockUser = (userId) => {
    if (currentUser?.globalRole !== 'ADMIN') {
      return { success: false, message: 'Chỉ Quản trị viên (Admin) mới có quyền khóa/mở khóa tài khoản.' };
    }
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return { success: false, message: 'Người dùng không tồn tại.' };
    if (targetUser.globalRole === 'ADMIN') {
      return { success: false, message: 'Không thể khóa tài khoản của Quản trị viên hệ thống.' };
    }

    const newLocked = !targetUser.isLocked;
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isLocked: newLocked } : u))
    );

    return {
      success: true,
      message: newLocked
        ? `Đã khóa tài khoản "${targetUser.displayName}". Người dùng này không thể đăng nhập hoặc tương tác.`
        : `Đã mở khóa tài khoản "${targetUser.displayName}".`,
    };
  };

  const adminToggleLockCommunity = (communityId) => {
    if (currentUser?.globalRole !== 'ADMIN') {
      return { success: false, message: 'Chỉ Quản trị viên (Admin) mới có quyền khóa Community.' };
    }
    const comm = communities.find((c) => c.id === communityId);
    if (!comm) return { success: false, message: 'Cộng đồng không tồn tại.' };

    const newLocked = !comm.isLocked;
    setCommunities((prev) =>
      prev.map((c) => (c.id === communityId ? { ...c, isLocked: newLocked } : c))
    );

    return {
      success: true,
      message: newLocked
        ? `Đã khóa cộng đồng "${comm.name}". Không thể đăng bài viết mới.`
        : `Đã mở khóa cộng đồng "${comm.name}".`,
    };
  };

  const adminDeleteCommunity = (communityId) => {
    if (currentUser?.globalRole !== 'ADMIN') {
      return { success: false, message: 'Chỉ Quản trị viên (Admin) mới có quyền xóa Community.' };
    }
    const comm = communities.find((c) => c.id === communityId);
    if (!comm) return { success: false, message: 'Cộng đồng không tồn tại.' };

    setCommunities((prev) =>
      prev.map((c) => (c.id === communityId ? { ...c, isDeleted: true } : c))
    );

    if (selectedCommunityId === communityId) {
      setSelectedCommunityId(null);
    }

    return { success: true, message: `Đã xóa cộng đồng "${comm.name}".` };
  };

  const resetAllData = () => {
    setUsers(INITIAL_USERS);
    setCurrentUserId('user-a');
    setCommunities(INITIAL_COMMUNITIES);
    setMembers(INITIAL_MEMBERS);
    setPosts(INITIAL_POSTS);
    setComments(INITIAL_COMMENTS);
    setVotes(INITIAL_VOTES);
    setReports(INITIAL_REPORTS);
    setSelectedCommunityId(null);
    setActivePostId(null);
    setSearchQuery('');
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isGuest,
        loginAs,
        register,
        logout,
        forgotPassword,
        updateProfile,
        users,
        communities,
        members,
        posts,
        comments,
        votes,
        reports,
        selectedCommunityId,
        setSelectedCommunityId,
        searchQuery,
        setSearchQuery,
        sortFilter,
        setSortFilter,
        activePostId,
        setActivePostId,
        isCreatePostOpen,
        setIsCreatePostOpen,
        isCreateCommunityOpen,
        setIsCreateCommunityOpen,
        isAdminDashboardOpen,
        setIsAdminDashboardOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        isProfileModalOpen,
        setIsProfileModalOpen,
        tokens,
        pendingEmailForVerification,
        setPendingEmailForVerification,
        pendingResetToken,
        setPendingResetToken,
        registerWithApi,
        verifyEmailWithApi,
        loginWithApi,
        loginWithGoogle,
        googleDemoAccounts: GOOGLE_DEMO_ACCOUNTS,
        logoutWithApi,
        refreshTokenWithApi,
        forgotPasswordWithApi,
        resetPasswordWithApi,
        getUserCommunityRole,
        isUserBannedInCommunity,
        isMemberOfCommunity,
        joinCommunity,
        leaveCommunity,
        createCommunity,
        updateCommunity,
        transferOwnership,
        setModeratorRole,
        kickMember,
        toggleBanMember,
        createPost,
        updatePost,
        deletePost,
        togglePinPost,
        votePost,
        getPostScore,
        getUserVote,
        addComment,
        updateComment,
        deleteComment,
        reportPost,
        resolveReport,
        toggleLockUser,
        adminToggleLockCommunity,
        adminDeleteCommunity,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
