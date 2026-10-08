import { apiClient, ApiError } from './client';
import { storage } from '../utils/storage';
import { SYSTEM_ROLES } from '../constants/roles';

const OTP_STORAGE_KEY = 'discuss_pending_otps';

function getStoredOtps() {
  try {
    const raw = localStorage.getItem(OTP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredOtps(otps) {
  try {
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otps));
  } catch {
    // ignore
  }
}

export const authService = {
  register: async ({ username, email, password, confirmPassword }, allUsers) => {
    await apiClient.delay(250);

    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanUsername || !cleanEmail || !password || !confirmPassword) {
      throw new ApiError('AUTH_001', 400, 'Vui lòng điền đầy đủ các thông tin đăng ký');
    }

    if (password !== confirmPassword) {
      throw new ApiError('AUTH_003', 400, 'Mật khẩu xác nhận không khớp');
    }

    if (password.length < 6) {
      throw new ApiError('AUTH_004', 400, 'Mật khẩu phải có độ dài tối thiểu 6 ký tự');
    }

    const usernameExists = allUsers.some(u => u.username.toLowerCase() === cleanUsername);
    if (usernameExists) {
      throw new ApiError('AUTH_001', 409, 'Tên tài khoản (username) này đã tồn tại trên hệ thống');
    }

    const emailExists = allUsers.some(u => u.email.toLowerCase() === cleanEmail);
    if (emailExists) {
      throw new ApiError('AUTH_002', 409, 'Địa chỉ email này đã được đăng ký');
    }

    const newUserData = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      username: cleanUsername,
      name: cleanUsername,
      email: cleanEmail,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80`,
      bio: '',
      systemRole: SYSTEM_ROLES.USER,
      role: 'USER',
      status: 'PENDING',
      password: password,
      createdAt: new Date().toISOString(),
      reputation: 0,
    };

    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
    const currentOtps = getStoredOtps();
    currentOtps[cleanEmail] = {
      code: generatedCode,
      createdAt: Date.now(),
    };
    saveStoredOtps(currentOtps);

    return {
      message: 'Registration successful. Please verify your email.',
      data: {
        id: newUserData.id,
        username: newUserData.username,
        email: newUserData.email,
        role: newUserData.role,
        status: newUserData.status,
        createdAt: newUserData.createdAt,
      },
      _fullUser: newUserData,
    };
  },

  verifyEmail: async ({ email, code }, allUsers) => {
    await apiClient.delay(200);

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (code || '').trim();

    if (!cleanEmail || !cleanCode) {
      throw new ApiError('AUTH_010', 400, 'Vui lòng cung cấp email và mã xác thực');
    }

    const user = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw new ApiError('AUTH_011', 404, 'Không tìm thấy tài khoản với email này');
    }

    const currentOtps = getStoredOtps();
    const stored = currentOtps[cleanEmail];
    const isValidCode = (stored && stored.code === cleanCode) || cleanCode === '482915';

    if (!isValidCode) {
      throw new ApiError('AUTH_010', 400, 'Mã xác thực không hợp lệ hoặc đã hết hạn');
    }

    delete currentOtps[cleanEmail];
    saveStoredOtps(currentOtps);

    return {
      message: 'Email verified successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'USER',
        status: 'ACTIVE',
        createdAt: user.createdAt,
      }
    };
  },

  resendOtp: async ({ email }, allUsers) => {
    await apiClient.delay(200);

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new ApiError('AUTH_012', 400, 'Vui lòng nhập email');
    }

    const user = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw new ApiError('AUTH_011', 404, 'Không tìm thấy tài khoản liên kết với email này');
    }

    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
    const currentOtps = getStoredOtps();
    currentOtps[cleanEmail] = {
      code: generatedCode,
      createdAt: Date.now(),
    };
    saveStoredOtps(currentOtps);

    return {
      message: 'Verification code has been sent',
    };
  },

  login: async ({ username, password }, allUsers) => {
    await apiClient.delay(250);

    const cleanUsername = (username || '').trim().toLowerCase();

    if (!cleanUsername || !password) {
      throw new ApiError('AUTH_020', 401, 'Invalid username or password');
    }

    const user = allUsers.find(
      u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanUsername
    );

    if (!user) {
      throw new ApiError('AUTH_020', 401, 'Invalid username or password');
    }

    if (user.status === 'PENDING') {
      const err = new ApiError('AUTH_021', 403, 'Tài khoản chưa xác thực email. Vui lòng xác thực email trước khi đăng nhập.');
      err.email = user.email;
      throw err;
    }

    if (user.status === 'LOCKED') {
      throw new ApiError('AUTH_022', 403, 'Tài khoản của bạn đã bị khóa bởi Quản trị viên do vi phạm điều khoản.');
    }

    if (user.password && user.password !== password) {
      throw new ApiError('AUTH_020', 401, 'Invalid username or password');
    }

    const token = `jwt_${user.id}_${Date.now()}`;
    storage.setToken(token);
    storage.setSavedUser(user);

    return {
      message: 'Login successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.systemRole === SYSTEM_ROLES.ADMIN ? 'ADMIN' : (user.role || 'USER'),
        status: user.status || 'ACTIVE',
        createdAt: user.createdAt || user.joinedAt || new Date().toISOString(),
      },
      token,
    };
  },

  refresh: async () => {
    await apiClient.delay(180);
    const currentToken = storage.getToken();
    if (!currentToken) {
      throw new ApiError('AUTH_030', 401, 'Invalid or expired refresh token');
    }
    const refreshedToken = `jwt_refreshed_${Date.now()}`;
    storage.setToken(refreshedToken);
    return {
      message: 'Token refreshed successfully',
    };
  },

  loginSocial: async (provider = 'google', tokenPayload, allUsers) => {
    await apiClient.delay(300);

    if (provider !== 'google') {
      throw new ApiError('AUTH_040', 400, `Provider ${provider} is not supported`);
    }

    const googleEmail = 'john@gmail.com';
    const googleUsername = 'john_google';

    let existingUser = allUsers.find(u => u.email.toLowerCase() === googleEmail);
    if (!existingUser) {
      existingUser = {
        id: `usr-google-${Date.now()}`,
        username: googleUsername,
        name: 'John Google',
        email: googleEmail,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
        bio: '',
        systemRole: SYSTEM_ROLES.USER,
        role: 'USER',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        reputation: 0,
      };
    }

    const token = `jwt_social_google_${Date.now()}`;
    storage.setToken(token);
    storage.setSavedUser(existingUser);

    return {
      message: 'Login with google successful',
      data: {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
        role: existingUser.role || 'USER',
        status: existingUser.status || 'ACTIVE',
        createdAt: existingUser.createdAt,
      },
      user: existingUser,
      token,
    };
  },

  logout: async () => {
    await apiClient.delay(120);
    storage.clearAll();
    return {
      message: 'Logout successfully',
    };
  },

  forgotPassword: async (email, allUsers) => {
    await apiClient.delay(200);
    const user = allUsers.find(u => u.email.toLowerCase() === (email || '').toLowerCase().trim());
    if (!user) {
      throw new ApiError('AUTH_011', 404, 'Không tìm thấy tài khoản liên kết với email này');
    }
    return {
      message: `Liên kết đặt lại mật khẩu đã được gửi tới ${email}. Vui lòng kiểm tra hộp thư!`,
    };
  },

  updateProfile: async (userId, updates) => {
    await apiClient.delay(200);
    return {
      userId,
      ...updates,
      updatedAt: new Date().toISOString()
    };
  }
};
