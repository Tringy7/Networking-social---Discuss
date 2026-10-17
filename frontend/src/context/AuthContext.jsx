import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SYSTEM_ROLES } from '../constants/roles';
import { authService } from '../api/authService';
import { userService } from '../api/userService';
import { adminService } from '../api/adminService';
import { storage } from '../utils/storage';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { success, error: toastError, info } = useToast();

  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('discuss_users');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return storage.getSavedUser() || null;
    } catch {
      return null;
    }
  });

  const [authLoading, setAuthLoading] = useState(true);
  const [pendingEmail, setPendingEmail] = useState('');

  // Hàm gọi GET /users/me để làm mới hoặc đồng bộ thông tin user từ server
  const fetchCurrentUser = useCallback(async () => {
    try {
      const userData = await userService.getMe();
      if (userData && (userData.username || userData.email)) {
        setCurrentUser(userData);
        return userData;
      }
    } catch {
      // Nếu 401 hoặc chưa đăng nhập, giữ nguyên hoặc bỏ qua
    }
    return null;
  }, []);

  // Tự động kiểm tra phiên và gọi GET /users/me khi load trang
  useEffect(() => {
    const initAuth = async () => {
      try {
        await fetchCurrentUser();
      } finally {
        setAuthLoading(false);
      }
    };
    initAuth();
  }, [fetchCurrentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('discuss_users', JSON.stringify(users));
    } catch {
      // safe fallback
    }
  }, [users]);

  useEffect(() => {
    const handleExpired = (e) => {
      setCurrentUser(null);
      storage.clearAll();
      if (e?.detail?.message) {
        toastError(e.detail.message);
      }
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [toastError]);

  const currentRole = currentUser?.role || (currentUser ? SYSTEM_ROLES.USER : SYSTEM_ROLES.GUEST);
  const isAuthenticated = !!currentUser && currentRole !== SYSTEM_ROLES.GUEST;

  const register = async (formData) => {
    try {
      const res = await authService.register(formData);
      setPendingEmail(res?.data?.email || formData.email);
      if (res?.message) {
        success(res.message);
      }
      return res;
    } catch (err) {
      if (err?.message) {
        toastError(err.message);
      }
      throw err;
    }
  };

  const verifyEmail = async ({ email, code }) => {
    try {
      const res = await authService.verifyEmail({ email, code });
      if (res?.data) {
        setCurrentUser(res.data);
      }
      // Đồng bộ thông tin đầy đủ từ GET /users/me
      await fetchCurrentUser().catch(() => {});
      if (res?.message) {
        success(res.message);
      }
      setPendingEmail('');
      return res;
    } catch (err) {
      if (err?.message) {
        toastError(err.message);
      }
      throw err;
    }
  };

  const resendOtp = async ({ email }) => {
    try {
      const res = await authService.resendOtp({ email });
      if (res?.message) {
        success(res.message);
      }
      return res;
    } catch (err) {
      if (err?.message) {
        toastError(err.message);
      }
      throw err;
    }
  };

  const login = async (credentials) => {
    try {
      const res = await authService.login(credentials);
      if (res?.data) {
        setCurrentUser(res.data);
      }
      // Lấy ngay thông tin người dùng đầy đủ từ GET /users/me
      await fetchCurrentUser().catch(() => {});
      if (res?.message) {
        success(res.message);
      }
      return res;
    } catch (err) {
      if (err.code === 'AUTH_021' && err.email) {
        setPendingEmail(err.email);
      }
      if (err?.message) {
        toastError(err.message);
      }
      throw err;
    }
  };

  const refreshToken = async () => {
    try {
      const res = await authService.refresh();
      if (res?.message) {
        info(res.message);
      }
      return res;
    } catch (err) {
      if (err?.message) {
        toastError(err.message);
      }
      throw err;
    }
  };

  const loginSocial = async (provider = 'google', tokenPayload) => {
    try {
      const res = await authService.loginSocial(provider, tokenPayload);
      if (res?.data) {
        setCurrentUser(res.data);
      }
      // Lấy profile đầy đủ từ GET /users/me
      await fetchCurrentUser().catch(() => {});
      if (res?.message) {
        success(res.message);
      }
      return res;
    } catch (err) {
      if (err?.message) {
        toastError(err.message);
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      const res = await authService.logout();
      setCurrentUser(null);
      if (res?.message) {
        info(res.message);
      }
      return res;
    } catch (err) {
      setCurrentUser(null);
      if (err?.message) {
        toastError(err.message);
      }
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await authService.forgotPassword(email);
      if (res?.message) {
        success(res.message);
      }
      return res;
    } catch (err) {
      if (err?.message) {
        toastError(err.message);
      }
      throw err;
    }
  };

  const verifyForgotPasswordOtp = async ({ email, code }) => {
    try {
      const res = await authService.verifyForgotPasswordOtp({ email, code });
      if (res?.message) {
        success(res.message);
      }
      return res;
    } catch (err) {
      if (err?.message) {
        toastError(err.message);
      }
      throw err;
    }
  };

  const resetPassword = async ({ password, confirmPassword }) => {
    try {
      const res = await authService.resetPassword({ password, confirmPassword });
      if (res?.message) {
        success(res.message);
      }
      return res;
    } catch (err) {
      if (err?.message) {
        toastError(err.message);
      }
      throw err;
    }
  };

  const changePassword = async ({ oldPassword, password, confirmPassword }) => {
    try {
      const res = await authService.changePassword({ oldPassword, password, confirmPassword });
      if (res?.message) {
        success(res.message);
      } else {
        success('Đổi mật khẩu thành công!');
      }
      return res;
    } catch (err) {
      if (err?.message) {
        toastError(err.message);
      }
      throw err;
    }
  };

  const updateProfile = async (updates) => {
    if (!currentUser) return;
    try {
      let serverUpdated = null;
      try {
        serverUpdated = await userService.updateMe(updates);
      } catch {
        // Nếu backend chưa có endpoint PUT /users/me, fallback cập nhật cục bộ
      }
      const updatedUser = serverUpdated || { ...currentUser, ...updates };
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      storage.setSavedUser(updatedUser);
      success('Cập nhật hồ sơ cá nhân thành công!');
      return updatedUser;
    } catch (err) {
      toastError(err?.message || 'Cập nhật thất bại');
      throw err;
    }
  };

  const lockUserAccount = async (userId, reason) => {
    try {
      const result = await adminService.lockUser(userId, reason);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'LOCKED' } : u));
      if (currentUser?.id === userId) {
        logout();
      }
      success('Đã khóa tài khoản thành công!');
      return result;
    } catch (err) {
      toastError(err.message || 'Không thể khóa tài khoản');
      throw err;
    }
  };

  const unlockUserAccount = async (userId) => {
    try {
      await adminService.unlockUser(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'ACTIVE' } : u));
      success('Đã mở khóa tài khoản thành công!');
    } catch (err) {
      toastError(err.message || 'Không thể mở khóa tài khoản');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated,
        authLoading,
        fetchCurrentUser,
        allUsers: users,
        pendingEmail,
        setPendingEmail,
        login,
        register,
        verifyEmail,
        resendOtp,
        loginSocial,
        refreshToken,
        logout,
        forgotPassword,
        verifyForgotPasswordOtp,
        resetPassword,
        changePassword,
        updateProfile,
        lockUserAccount,
        unlockUserAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
