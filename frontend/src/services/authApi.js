const API_BASE = ''; // Same origin

export class AuthApiError extends Error {
  constructor(message, status = 400, data = null) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
    this.data = data;
  }
}

export const authApi = {
  /**
   * 1.1.a Đăng ký tài khoản (Guest)
   * POST /auth/register
   */
  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new AuthApiError(
        body?.message || `Đăng ký thất bại (Mã lỗi ${res.status})`,
        res.status,
        body
      );
    }
    return body;
  },

  /**
   * 1.1.b Xác thực tài khoản (Guest)
   * POST /auth/verify-email
   * Response 200 OK: "Email verified successfully"
   */
  async verifyEmail(data) {
    const res = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const text = await res.text();
    if (!res.ok) {
      let errMsg = text;
      try {
        const parsed = JSON.parse(text);
        if (parsed?.message) errMsg = parsed.message;
      } catch {
        // use text
      }
      throw new AuthApiError(errMsg || 'Xác thực email thất bại', res.status);
    }
    return text.trim();
  },

  /**
   * 1.2 Đăng nhập
   * POST /auth/login
   */
  async login(data) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new AuthApiError(
        body?.message || `Đăng nhập thất bại (Mã lỗi ${res.status})`,
        res.status,
        body
      );
    }
    return body;
  },

  /**
   * 1.3 Đăng xuất
   * POST /auth/logout
   */
  async logout(data) {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new AuthApiError(
        body?.message || 'Đăng xuất thất bại',
        res.status,
        body
      );
    }
    return body;
  },

  /**
   * 1.4 Làm mới token
   * POST /auth/refresh-token
   */
  async refreshToken(data) {
    const res = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new AuthApiError(
        body?.message || 'Làm mới token thất bại',
        res.status,
        body
      );
    }
    return body;
  },

  /**
   * 1.5 Quên mật khẩu
   * POST /auth/forgot-password
   */
  async forgotPassword(data) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new AuthApiError(
        body?.message || 'Yêu cầu quên mật khẩu thất bại',
        res.status,
        body
      );
    }
    return body;
  },

  /**
   * 1.6 Đặt lại mật khẩu
   * POST /auth/reset-password
   */
  async resetPassword(data) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new AuthApiError(
        body?.message || 'Đặt lại mật khẩu thất bại',
        res.status,
        body
      );
    }
    return body;
  },

  /**
   * 1.7 Đăng nhập bằng Google
   * POST /auth/google
   */
  async loginWithGoogle(data) {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new AuthApiError(
        body?.message || 'Đăng nhập Google thất bại',
        res.status,
        body
      );
    }
    return body;
  },
};
