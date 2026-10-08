import { storage } from '../utils/storage';

/**
 * Custom API Error adhering to Discuss API specifications:
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
    return {
      code: this.code,
      status: this.status,
      message: this.message,
    };
  }
}

/**
 * Discuss API Client
 * 
 * Simulates standard Axios/Fetch HTTP client architecture with:
 * - JWT Authorization Bearer header injection
 * - Cookie-based refresh token handling
 * - Standardized error responses: { code, status, message }
 * - Stateless structure ready for direct Backend swap:
 *   e.g. export const apiClient = axios.create({ baseURL: '/api/v1', withCredentials: true });
 */
export const apiClient = {
  // Simulates an HTTP request interceptor that attaches JWT token
  getHeaders: () => {
    const token = storage.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  },

  // Mock network delay helper for realistic UX (loaders, disabled buttons)
  delay: (ms = 200) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to format or throw an ApiError
  createError: (code, status, message) => new ApiError(code, status, message),
};
