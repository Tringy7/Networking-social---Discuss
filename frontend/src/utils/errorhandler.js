import { translateApiErrorMessage } from './errorTranslation';

/**
 * Quy ước xử lý lỗi cho FE theo HTTP status code
 * 
 * | HTTP status | FE xử lý |
 * | --- | --- |
 * | 400 | Lỗi nhập liệu hoặc file không hợp lệ |
 * | 401 | Phiên đăng nhập hết hạn |
 * | 403 | Không có quyền thực hiện thao tác |
 * | 404 | Không tìm thấy người dùng hoặc tài nguyên |
 * | 409 | Tên người dùng (username) đã tồn tại |
 * | 413 | File vượt giới hạn dung lượng |
 * | 500 | Lỗi hệ thống, cho phép thử lại |
 */

export function getErrorMessageByStatus(status, defaultMessage = null) {
  switch (Number(status)) {
    case 400:
      return defaultMessage || 'Dữ liệu nhập vào hoặc file không hợp lệ';
    case 401:
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
    case 403:
      return 'Bạn không có quyền thực hiện hành động này';
    case 404:
      return 'Không tìm thấy người dùng hoặc tài nguyên được yêu cầu';
    case 409:
      return 'Tên người dùng (username) đã tồn tại';
    case 413:
      return 'File vượt giới hạn dung lượng cho phép';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Lỗi hệ thống máy chủ. Vui lòng thử lại sau';
    default:
      return defaultMessage || 'Đã có lỗi xảy ra. Vui lòng thử lại';
  }
}

/**
 * Trích xuất thông báo lỗi tối ưu từ error object / ApiError
 */
export function getFriendlyErrorMessage(err, fallback = null) {
  if (!err) return fallback || 'Đã có lỗi xảy ra';

  const status = err.status || err.response?.status;
  return translateApiErrorMessage(err.message, err.code, status, fallback);
}
import { translateApiErrorMessage } from './errorTranslation';
