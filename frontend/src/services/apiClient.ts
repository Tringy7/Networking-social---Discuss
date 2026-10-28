const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly errors: unknown = null
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const NO_REFRESH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/resend-otp',
  '/auth/refresh',
  '/auth/social',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/forgot-password/reset',
];

const AUTH_SESSION_KEY = 'discuss_auth_session';

function readPersistedAuthSession(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(AUTH_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

let refreshPromise: Promise<void> | null = null;
let sessionAuthenticated = readPersistedAuthSession();
let refreshGeneration = 0;

export function setApiSessionAuthenticated(authenticated: boolean): void {
  sessionAuthenticated = authenticated;
  if (typeof localStorage === 'undefined') return;

  try {
    if (authenticated) {
      localStorage.setItem(AUTH_SESSION_KEY, 'true');
    } else {
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch {
    // Keep in-memory authentication state when browser storage is unavailable.
  }
}

export function hasPersistedAuthSession(): boolean {
  return readPersistedAuthSession();
}

function isAccessTokenExpired(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    error.status === 401 &&
    (error.code === 'ACCESS_TOKEN_EXPIRED' || error.code === 'API_ERROR')
  );
}

function notifyExpiredSession(error: unknown): void {
  if (!sessionAuthenticated) return;
  sessionAuthenticated = false;
  window.dispatchEvent(new CustomEvent('auth:expired', { detail: error }));
}

async function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    const refresh = async () => {
      await rawRequest('POST', '/auth/refresh');
      refreshGeneration += 1;
    };
    const operation =
      typeof navigator !== 'undefined' && navigator.locks
        ? navigator.locks.request('discuss-auth-refresh', refresh)
        : refresh();
    refreshPromise = operation.finally(() => {
      refreshPromise = null;
    });
  }
  await refreshPromise;
}

async function rawRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = {};
  if (!isFormData && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body: isFormData
        ? body
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
    });
  } catch {
    throw new ApiError('NETWORK_ERROR', 0, 'Không thể kết nối tới máy chủ');
  }

  const responseText = await response.text();
  let payload: Record<string, unknown> | null = null;
  if (responseText) {
    try {
      payload = JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const status = typeof payload?.status === 'number' ? payload.status : response.status;
    let message = typeof payload?.message === 'string' ? payload.message : '';

    if (status === 409) {
      message = 'Tên người dùng đã tồn tại';
    } else if (status === 413) {
      message = 'File vượt giới hạn dung lượng';
    } else if (status === 403) {
      message = 'Bạn không có quyền thực hiện hành động này';
    } else if (status === 404) {
      message = message || 'Không tìm thấy tài nguyên';
    } else if (status === 401) {
      message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
    } else if (status === 400) {
      message = message || 'Thông tin nhập vào không hợp lệ';
    } else if (status >= 500) {
      message = 'Đã có lỗi xảy ra từ máy chủ. Vui lòng thử lại sau';
    } else if (!message) {
      message = 'Đã có lỗi xảy ra';
    }

    throw new ApiError(
      typeof payload?.code === 'string'
        ? payload.code
        : payload?.errors
          ? 'VALIDATION_ERROR'
          : 'API_ERROR',
      status,
      message,
      payload?.errors ?? null
    );
  }

  return payload as T;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const requestGeneration = refreshGeneration;
  try {
    return await rawRequest<T>(method, path, body);
  } catch (error) {
    const canRefresh =
      sessionAuthenticated &&
      isAccessTokenExpired(error) &&
      !NO_REFRESH_PATHS.some((noRefreshPath) => path.startsWith(noRefreshPath));

    if (!canRefresh) {
      throw error;
    }

    if (requestGeneration === refreshGeneration) {
      try {
        await refreshSession();
      } catch (refreshError) {
        if (refreshError instanceof ApiError && refreshError.status === 401) {
          notifyExpiredSession(refreshError);
        }
        throw refreshError;
      }
    }

    try {
      return await rawRequest<T>(method, path, body);
    } catch (retryError) {
      if (retryError instanceof ApiError && retryError.status === 401) {
        notifyExpiredSession(retryError);
      }
      throw retryError;
    }
  }
}

export const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export default apiClient;
