import { storage } from '../utils/storage';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * { "code": "AUTH_020", "status": 401, "message": "Invalid username or password" }
 */
export class ApiError extends Error {
  constructor(code, status, message) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.message = message;
  }

  toJSON() {
    return { code: this.code, status: this.status, message: this.message };
  }
}

// Các endpoint không được tự refresh khi gặp 401 (tránh vòng lặp / nhầm với sai mật khẩu)
const NO_REFRESH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/resend-otp',
  '/auth/refresh',
  '/auth/social',
  '/auth/logout',
];

let refreshPromise = null;

async function rawRequest(method, path, body) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('NETWORK_ERROR', 0, 'Không thể kết nối tới máy chủ');
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    console.error('Không thể phân tích dữ liệu phản hồi từ máy chủ');
  }

  if (!res.ok) {
    throw new ApiError(
      payload?.code || 'UNKNOWN_ERROR',
      payload?.status || res.status,
      payload?.message || 'Đã có lỗi xảy ra'
    );
  }
  return payload;
}

async function request(method, path, body) {
  try {
    return await rawRequest(method, path, body);
  } catch (err) {
    const canRefresh =
      err instanceof ApiError &&
      err.status === 401 &&
      !NO_REFRESH_PATHS.some(p => path.startsWith(p));

    if (!canRefresh) throw err;

    try {
      refreshPromise ??= rawRequest('POST', '/auth/refresh').finally(() => {
        refreshPromise = null;
      });
      await refreshPromise;
    } catch (refreshErr) {

      storage.clearAll();
      window.dispatchEvent(new CustomEvent('auth:expired'));
      throw refreshErr;
    }
    return rawRequest(method, path, body);
  }
}

export const apiClient = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? undefined),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),


  getHeaders: () => ({ 'Content-Type': 'application/json' }),
  delay: (ms = 200) => new Promise(resolve => setTimeout(resolve, ms)),
  createError: (code, status, message) => new ApiError(code, status, message),
};