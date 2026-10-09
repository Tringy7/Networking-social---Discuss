import React, { createContext, useContext, useState, useEffect } from 'react';
import { SYSTEM_ROLES } from '../constants/roles';
import { authService } from '../api/authService';
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

  const [pendingEmail, setPendingEmail] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('discuss_users', JSON.stringify(users));
    } catch {
      // safe fallback
    }
  }, [users]);

  const currentRole = currentUser?.systemRole || SYSTEM_ROLES.GUEST;
  const isAuthenticated = !!currentUser && currentUser.systemRole !== SYSTEM_ROLES.GUEST;

  const register = async (formData) => {
    try {
      const res = await authService.register(formData, users);
      setUsers(prev => [res._fullUser, ...prev.filter(u => u.email !== res._fullUser.email)]);
      setPendingEmail(res.data.email);
      success(res.message || 'Registration successful. Please verify your email.');
      return res;
    } catch (err) {
      const msg = err.message || 'Đăng ký thất bại';
      toastError(err.code ? `[${err.code}] ${msg}` : msg);
      throw err;
    }
  };

  const verifyEmail = async ({ email, code }) => {
    try {
      const res = await authService.verifyEmail({ email, code }, users);
      setUsers(prev => prev.map(u => u.email.toLowerCase() === email.toLowerCase() ? { ...u, status: 'ACTIVE' } : u));
      success(res.message || 'Email verified successfully');
      setPendingEmail('');
      return res;
    } catch (err) {
      const msg = err.message || 'Xác thực email thất bại';
      toastError(err.code ? `[${err.code}] ${msg}` : msg);
      throw err;
    }
  };

  const resendOtp = async ({ email }) => {
    try {
      const res = await authService.resendOtp({ email }, users);
      success(res.message || 'Verification code has been sent');
      return res;
    } catch (err) {
      const msg = err.message || 'Không thể gửi lại OTP';
      toastError(err.code ? `[${err.code}] ${msg}` : msg);
      throw err;
    }
  };

  const login = async (credentials) => {
    try {
      const res = await authService.login(credentials, users);
      const userObj = users.find(u => u.id === res.data.id) || {
        ...res.data,
        name: res.data.username,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
        systemRole: res.data.role === 'ADMIN' ? SYSTEM_ROLES.ADMIN : SYSTEM_ROLES.USER,
      };

      setCurrentUser(userObj);
      success(res.message || 'Login successfully');
      return res;
    } catch (err) {
      if (err.code === 'AUTH_021' && err.email) {
        setPendingEmail(err.email);
      }
      const msg = err.message || 'Đăng nhập thất bại';
      toastError(err.code ? `[${err.code}] ${msg}` : msg);
      throw err;
    }
  };

  const refreshToken = async () => {
    try {
      const res = await authService.refresh();
      info(res.message || 'Token refreshed successfully');
      return res;
    } catch (err) {
      toastError(err.message || 'Không thể làm mới token');
      throw err;
    }
  };

  const loginSocial = async (provider = 'google', tokenPayload) => {
    try {
      const res = await authService.loginSocial(provider, tokenPayload, users);
      const userObj = res.user;
      setUsers(prev => {
        if (!prev.some(u => u.id === userObj.id)) {
          return [userObj, ...prev];
        }
        return prev;
      });
      setCurrentUser(userObj);
      success(res.message || 'Login with google successful');
      return res;
    } catch (err) {
      const msg = err.message || 'Đăng nhập Google thất bại';
      toastError(err.code ? `[${err.code}] ${msg}` : msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      const res = await authService.logout();
      setCurrentUser(null);
      info(res.message || 'Logout successfully');
      return res;
    } catch (err) {
      toastError(err.message || 'Đăng xuất thất bại');
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await authService.forgotPassword(email, users);
      success(res.message);
      return res;
    } catch (err) {
      const msg = err.message || 'Yêu cầu thất bại';
      toastError(err.code ? `[${err.code}] ${msg}` : msg);
      throw err;
    }
  };

  const updateProfile = async (updates) => {
    if (!currentUser) return;
    try {
      const updatedUser = { ...currentUser, ...updates };
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      storage.setSavedUser(updatedUser);
      success('Cập nhật hồ sơ cá nhân thành công!');
      return updatedUser;
    } catch (err) {
      toastError(err.message || 'Cập nhật thất bại');
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
