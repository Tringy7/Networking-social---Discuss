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

  // Nếu backend trả message cụ thể và hợp lệ (không phải chuỗi lỗi chung chung của server)
  // Nhưng đối với các mã chuẩn như 409, 413, 403, 404, 401, ưu tiên đúng thông điệp quy ước
  if (status === 409) {
    return 'Tên người dùng (username) đã tồn tại';
  }

  if (status === 413) {
    return 'File tải lên vượt quá dung lượng cho phép';
  }

  if (status === 404) {
    return err.message && !err.message.includes('API_ERROR') 
      ? err.message 
      : 'Không tìm thấy người dùng hoặc tài nguyên';
  }

  if (status === 403) {
    return 'Bạn không có quyền thực hiện hành động này';
  }

  if (status === 401) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
  }

  if (status === 500) {
    return 'Lỗi máy chủ (500). Vui lòng thử lại sau';
  }

  if (status === 400) {
    return err.message || 'Dữ liệu không hợp lệ hoặc file không đúng định dạng';
  }

  return err.message || getErrorMessageByStatus(status, fallback);
}
