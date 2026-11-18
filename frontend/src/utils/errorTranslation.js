const messagesByCode = {
  // Authentication
  INVALID_CREDENTIALS: 'Tài khoản hoặc mật khẩu không đúng.',
  ACCOUNT_LOCKED: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.',
  ACCOUNT_NOT_VERIFIED: 'Vui lòng xác minh email trước khi đăng nhập.',
  USER_NOT_FOUND: 'Không tìm thấy người dùng.',
  USERNAME_ALREADY_EXISTS: 'Tên người dùng đã được sử dụng.',
  EMAIL_ALREADY_EXISTS: 'Email đã được sử dụng.',
  ACCOUNT_ALREADY_EXISTS: 'Tài khoản đã tồn tại.',
  INVALID_VERIFICATION_CODE: 'Mã xác minh không chính xác hoặc đã hết hạn.',
  PASSWORD_RESET_NOT_SUPPORTED: 'Tài khoản này sử dụng Google để đăng nhập. Vui lòng đăng nhập bằng Google.',
  UNSUPPORTED_PROVIDER: 'Nhà cung cấp đăng nhập không được hỗ trợ.',
  PASSWORD_UNCHANGED: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
  INVALID_REFRESH_TOKEN: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  INVALID_RESET_TOKEN: 'Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
  REFRESH_TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  REFRESH_TOKEN_REUSED: 'Phiên đăng nhập đã bị thu hồi vì lý do bảo mật. Vui lòng đăng nhập lại.',
  REFRESH_TOKEN_MISSING: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  SOCIAL_VERIFICATION_FAILED: 'Không thể xác minh thông tin đăng nhập mạng xã hội. Vui lòng thử lại.',
  OTP_COOLDOWN: 'Vui lòng chờ trước khi yêu cầu gửi mã mới.',
  OTP_TOO_MANY_ATTEMPTS: 'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.',
  SESSION_NOT_FOUND: 'Không tìm thấy phiên đăng nhập.',

  // Users and permissions
  INVALID_USER_STATUS: 'Trạng thái tài khoản không hợp lệ.',
  INVALID_USER_ROLE: 'Quyền tài khoản không hợp lệ.',
  USER_PROFILE_NOT_FOUND: 'Không tìm thấy hồ sơ người dùng.',
  ROLE_REQUIRED: 'Bạn không có quyền cần thiết để thực hiện thao tác này.',

  // Communities
  COMMUNITY_NAME_RESERVED: 'Tên cộng đồng này đã được dành riêng.',
  OWNER_CANNOT_LEAVE: 'Chủ sở hữu cần chuyển quyền sở hữu trước khi rời cộng đồng.',
  INVALID_ROLE_CHANGE: 'Không thể thay đổi vai trò theo yêu cầu này.',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  ACTIVE_MEMBERSHIP_REQUIRED: 'Bạn cần là thành viên đang hoạt động của cộng đồng.',
  COMMENT_PERMISSION_DENIED: 'Bạn không có quyền bình luận trong cộng đồng này.',
  MODERATOR_OR_OWNER_REQUIRED: 'Thao tác này yêu cầu quyền Điều hành viên hoặc Chủ sở hữu.',
  OWNER_REQUIRED: 'Thao tác này yêu cầu quyền Chủ sở hữu.',
  COMMUNITY_PRIVATE: 'Cộng đồng này đang ở chế độ riêng tư.',
  MEMBER_BANNED: 'Bạn đã bị cấm khỏi cộng đồng này.',
  MEMBER_KICKED: 'Bạn đã bị mời khỏi cộng đồng này và không thể tham gia lại.',
  COMMUNITY_NOT_FOUND: 'Không tìm thấy cộng đồng.',
  COMMUNITY_INFORMATION_NOT_FOUND: 'Không tìm thấy thông tin cộng đồng.',
  CATEGORY_NOT_FOUND: 'Không tìm thấy danh mục.',
  MEMBER_NOT_FOUND: 'Không tìm thấy thành viên trong cộng đồng này.',
  COMMUNITY_NAME_TAKEN: 'Tên cộng đồng đã được sử dụng.',
  MODERATOR_NOT_FOUND: 'Người dùng này không phải là Điều hành viên của cộng đồng.',
  ALREADY_MEMBER: 'Bạn đã là thành viên của cộng đồng này.',
  NOT_A_MEMBER: 'Bạn hiện không phải là thành viên của cộng đồng này.',
  COMMUNITY_LIMIT_REACHED: 'Bạn đã đạt giới hạn số cộng đồng có thể tạo.',

  // Posts and comments
  INVALID_MEDIA: 'Ảnh đính kèm hoặc thông tin tải ảnh lên không hợp lệ.',
  EMPTY_POST: 'Bài viết cần có nội dung hoặc ảnh.',
  UNSUPPORTED_POST_TYPE: 'Loại bài viết này hiện chưa được hỗ trợ.',
  COMMUNITY_CHANGE_NOT_ALLOWED: 'Không thể chuyển bài viết sang cộng đồng khác.',
  DUPLICATE_MEDIA: 'Ảnh đính kèm bị trùng lặp.',
  MARKDOWN_MEDIA_MISSING: 'Mỗi ảnh trong nội dung bài viết cần có trong danh sách ảnh đính kèm.',
  TOO_MANY_MEDIA: 'Mỗi bài viết chỉ được đính kèm tối đa 20 ảnh.',
  POST_EDIT_FORBIDDEN: 'Chỉ tác giả mới có thể chỉnh sửa bài viết này.',
  POST_NOT_FOUND: 'Không tìm thấy bài viết.',
  UNSUPPORTED_MEDIA_TYPE: 'Hiện chưa hỗ trợ tải video lên.',
  EMPTY_COMMENT: 'Bình luận cần có nội dung hoặc ảnh.',
  CONTENT_TOO_LONG: 'Nội dung bình luận vượt quá 10.000 ký tự.',
  PARENT_POST_MISMATCH: 'Bình luận trả lời phải thuộc cùng bài viết.',
  COMMENT_EDIT_FORBIDDEN: 'Chỉ tác giả mới có thể chỉnh sửa bình luận này.',
  COMMENT_NOT_FOUND: 'Không tìm thấy bình luận.',
  ATTACHMENT_NOT_FOUND: 'Không tìm thấy ảnh đính kèm.',

  // Media
  EMPTY_FILE: 'Tệp tải lên đang trống.',
  INVALID_IMAGE: 'Tệp không phải ảnh hợp lệ hoặc không thể đọc được.',
  UNSUPPORTED_IMAGE_FORMAT: 'Chỉ hỗ trợ ảnh JPEG, PNG và WebP.',
  TOO_MANY_FILES: 'Số lượng tệp trong một lần tải lên vượt quá giới hạn.',
  INVALID_OBJECT_KEY: 'Đường dẫn tệp không hợp lệ.',
  FILE_TOO_LARGE: 'Tệp vượt quá dung lượng cho phép.',
  IMAGE_RESOLUTION_TOO_LARGE: 'Độ phân giải ảnh vượt quá giới hạn cho phép.',
  MEDIA_ACCESS_DENIED: 'Bạn không có quyền truy cập tệp này.',
  MEDIA_NOT_FOUND: 'Không tìm thấy tệp.',
  IMAGE_PROCESSING_FAILED: 'Không thể xử lý ảnh. Vui lòng thử lại.',
  STORAGE_UPLOAD_FAILED: 'Không thể tải tệp lên. Vui lòng thử lại.',
  STORAGE_DELETE_FAILED: 'Không thể xóa tệp. Vui lòng thử lại.',
  STORAGE_READ_FAILED: 'Không thể đọc tệp. Vui lòng thử lại.',

  // Reports
  INVALID_COMMUNITY_REPORT_TYPE: 'Chỉ hỗ trợ báo cáo bài viết hoặc bình luận trong mục kiểm duyệt cộng đồng.',
  ADMIN_REQUIRED: 'Chỉ quản trị viên mới có thể xem tất cả báo cáo.',
  TARGET_NOT_FOUND: 'Không tìm thấy nội dung cần báo cáo hoặc nội dung không còn khả dụng.',
  DUPLICATE_PENDING_REPORT: 'Bạn đã gửi báo cáo đang chờ xử lý cho nội dung này.',
};

const messagesByEnglishText = {
  'Invalid username or password': messagesByCode.INVALID_CREDENTIALS,
  'This account has been locked': messagesByCode.ACCOUNT_LOCKED,
  'This account uses Google Sign-In. Please sign in with Google.': messagesByCode.PASSWORD_RESET_NOT_SUPPORTED,
  'Please verify your email before logging in': messagesByCode.ACCOUNT_NOT_VERIFIED,
  'The verification code is incorrect or has expired': messagesByCode.INVALID_VERIFICATION_CODE,
  'Email already exists': messagesByCode.EMAIL_ALREADY_EXISTS,
  'Username already exists': messagesByCode.USERNAME_ALREADY_EXISTS,
  'Account already exists': messagesByCode.ACCOUNT_ALREADY_EXISTS,
  'User not found': messagesByCode.USER_NOT_FOUND,
  'Invalid user status': messagesByCode.INVALID_USER_STATUS,
  'Invalid user role': messagesByCode.INVALID_USER_ROLE,
  'User profile not found': messagesByCode.USER_PROFILE_NOT_FOUND,
  'You do not have the required role': messagesByCode.ROLE_REQUIRED,
  'This community name is reserved': messagesByCode.COMMUNITY_NAME_RESERVED,
  'The owner must transfer ownership before leaving the community': messagesByCode.OWNER_CANNOT_LEAVE,
  'This role change is not allowed': messagesByCode.INVALID_ROLE_CHANGE,
  'You do not have permission to perform this action': messagesByCode.FORBIDDEN,
  'You are not an active member': messagesByCode.ACTIVE_MEMBERSHIP_REQUIRED,
  'Commenting is not allowed': messagesByCode.COMMENT_PERMISSION_DENIED,
  'Moderator or Owner permission required': messagesByCode.MODERATOR_OR_OWNER_REQUIRED,
  'Owner permission required': messagesByCode.OWNER_REQUIRED,
  'This community is private': messagesByCode.COMMUNITY_PRIVATE,
  'You are banned from this community': messagesByCode.MEMBER_BANNED,
  'You were removed from this community and cannot rejoin': messagesByCode.MEMBER_KICKED,
  'Community not found': messagesByCode.COMMUNITY_NOT_FOUND,
  'Community information not found': messagesByCode.COMMUNITY_INFORMATION_NOT_FOUND,
  'Category not found': messagesByCode.CATEGORY_NOT_FOUND,
  'Member not found in this community': messagesByCode.MEMBER_NOT_FOUND,
  'Community name already exists': messagesByCode.COMMUNITY_NAME_TAKEN,
  'User is not a moderator of this community': messagesByCode.MODERATOR_NOT_FOUND,
  'You are already a member of this community': messagesByCode.ALREADY_MEMBER,
  'You are not a member of this community': messagesByCode.NOT_A_MEMBER,
  'You have reached the maximum number of communities you can create': messagesByCode.COMMUNITY_LIMIT_REACHED,
  'Invalid post image references or upload indexes': messagesByCode.INVALID_MEDIA,
  'Post content or media is required': messagesByCode.EMPTY_POST,
  'Only TEXT posts can be created or updated': messagesByCode.UNSUPPORTED_POST_TYPE,
  'A post cannot be moved to another community': messagesByCode.COMMUNITY_CHANGE_NOT_ALLOWED,
  'Duplicate media objectKey': messagesByCode.DUPLICATE_MEDIA,
  'Every Markdown image must be included in media': messagesByCode.MARKDOWN_MEDIA_MISSING,
  'At most 20 media items per post': messagesByCode.TOO_MANY_MEDIA,
  'Only the author can edit this post': messagesByCode.POST_EDIT_FORBIDDEN,
  'Post not found': messagesByCode.POST_NOT_FOUND,
  'Video upload is not available yet': messagesByCode.UNSUPPORTED_MEDIA_TYPE,
  'Comment content or image is required': messagesByCode.EMPTY_COMMENT,
  'Comment content exceeds 10000 characters': messagesByCode.CONTENT_TOO_LONG,
  'Parent comment must belong to the same post': messagesByCode.PARENT_POST_MISMATCH,
  'Only the author can edit this comment': messagesByCode.COMMENT_EDIT_FORBIDDEN,
  'Comment not found': messagesByCode.COMMENT_NOT_FOUND,
  'Image not found': messagesByCode.ATTACHMENT_NOT_FOUND,
  'The uploaded file is empty': messagesByCode.EMPTY_FILE,
  'The file is not a valid or readable image': messagesByCode.INVALID_IMAGE,
  'Only JPEG, PNG and WebP images are supported': messagesByCode.UNSUPPORTED_IMAGE_FORMAT,
  'Too many files in a single request': messagesByCode.TOO_MANY_FILES,
  'Invalid media object key': messagesByCode.INVALID_OBJECT_KEY,
  'The file exceeds the maximum allowed size': messagesByCode.FILE_TOO_LARGE,
  'The image resolution is too large': messagesByCode.IMAGE_RESOLUTION_TOO_LARGE,
  'You do not have permission to access this media': messagesByCode.MEDIA_ACCESS_DENIED,
  'Media not found': messagesByCode.MEDIA_NOT_FOUND,
  'Failed to process the image': messagesByCode.IMAGE_PROCESSING_FAILED,
  'Failed to upload the file to storage': messagesByCode.STORAGE_UPLOAD_FAILED,
  'Failed to delete the file from storage': messagesByCode.STORAGE_DELETE_FAILED,
  'Failed to read the file from storage': messagesByCode.STORAGE_READ_FAILED,
  'Community moderation only supports POST and COMMENT reports': messagesByCode.INVALID_COMMUNITY_REPORT_TYPE,
  'Only admins can view all reports': messagesByCode.ADMIN_REQUIRED,
  'Report target not found or unavailable': messagesByCode.TARGET_NOT_FOUND,
  'You already have a pending report for this target': messagesByCode.DUPLICATE_PENDING_REPORT,
  'Please wait before requesting a new code': messagesByCode.OTP_COOLDOWN,
  'Too many incorrect attempts. Please request a new code': messagesByCode.OTP_TOO_MANY_ATTEMPTS,
  'New password must be different from the current password': messagesByCode.PASSWORD_UNCHANGED,
  'The new password must be different from the current password': messagesByCode.PASSWORD_UNCHANGED,
};

const statusMessages = {
  400: 'Thông tin nhập vào không hợp lệ. Vui lòng kiểm tra lại.',
  401: 'Tài khoản hoặc mật khẩu không đúng.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy nội dung yêu cầu.',
  409: 'Dữ liệu bị trùng hoặc đã được sử dụng. Vui lòng kiểm tra lại.',
  413: 'Tệp tải lên vượt quá giới hạn cho phép.',
  415: 'Định dạng tệp không được hỗ trợ.',
  429: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.',
  500: 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.',
  502: 'Máy chủ tạm thời không khả dụng. Vui lòng thử lại sau.',
  503: 'Máy chủ tạm thời không khả dụng. Vui lòng thử lại sau.',
  504: 'Máy chủ phản hồi quá lâu. Vui lòng thử lại sau.',
};

function looksEnglish(message) {
  return /^[\x00-\x7F]*$/.test(message) && /[a-z]/i.test(message);
}

export function translateValidationMessage(message) {
  if (typeof message !== 'string') return message;
  const value = message.trim();
  if (!value || !looksEnglish(value)) return value;

  const exactTranslations = {
    'must not be blank': 'Không được để trống.',
    'must not be null': 'Vui lòng chọn thông tin này.',
    'must not be empty': 'Không được để trống.',
    'must be a well-formed email address': 'Email không đúng định dạng.',
    'must be a valid email address': 'Email không đúng định dạng.',
    'must be a valid email': 'Email không đúng định dạng.',
    'must be a valid URL': 'Đường dẫn không đúng định dạng.',
    'must be a valid URL address': 'Đường dẫn không đúng định dạng.',
    'must be a number': 'Vui lòng nhập số hợp lệ.',
    'must be true': 'Thông tin này phải được xác nhận.',
  };
  if (exactTranslations[value]) return exactTranslations[value];
  const translateField = (field) => ({
    username: 'Tên đăng nhập',
    email: 'Email',
    password: 'Mật khẩu',
    displayname: 'Tên hiển thị',
    bio: 'Tiểu sử',
  }[field.replace(/[ _-]/g, '').toLowerCase()] || field);

  let match = value.match(/^(.+?) must be at least (\d+) characters?$/i);
  if (match) return `${translateField(match[1])} phải có ít nhất ${match[2]} ký tự.`;

  match = value.match(/^(.+?) must be at most (\d+) characters?$/i);
  if (match) return `${translateField(match[1])} chỉ được dài tối đa ${match[2]} ký tự.`;

  match = value.match(/^must be at least (\d+) characters?$/i);
  if (match) return `Phải có ít nhất ${match[1]} ký tự.`;

  match = value.match(/^must be at most (\d+) characters?$/i);
  if (match) return `Chỉ được dài tối đa ${match[1]} ký tự.`;

  match = value.match(/^(?:size )?must be between (\d+) and (\d+)(?: characters?)?$/i);
  if (match) return `Độ dài phải từ ${match[1]} đến ${match[2]} ký tự.`;

  match = value.match(/^must be between (\d+) and (\d+)$/i);
  if (match) return `Giá trị phải từ ${match[1]} đến ${match[2]}.`;

  match = value.match(/^must be greater than or equal to (.+)$/i);
  if (match) return `Giá trị phải lớn hơn hoặc bằng ${match[1]}.`;

  match = value.match(/^must be less than or equal to (.+)$/i);
  if (match) return `Giá trị phải nhỏ hơn hoặc bằng ${match[1]}.`;

  match = value.match(/^must be greater than (.+)$/i);
  if (match) return `Giá trị phải lớn hơn ${match[1]}.`;

  match = value.match(/^must be less than (.+)$/i);
  if (match) return `Giá trị phải nhỏ hơn ${match[1]}.`;

  if (/^request validation failed$/i.test(value)) {
    return 'Một số thông tin chưa hợp lệ. Vui lòng kiểm tra lại.';
  }

  return 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.';
}

export function translateApiFieldErrors(errors) {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return errors;
  return Object.fromEntries(
    Object.entries(errors).map(([field, message]) => [
      field,
      typeof message === 'string' ? translateValidationMessage(message) : message,
    ])
  );
}

export function translateApiErrorMessage(message, code, status, fallback = null) {
  if (code && messagesByCode[code]) return messagesByCode[code];

  const normalizedMessage = typeof message === 'string' ? message.trim() : '';
  if (normalizedMessage) {
    const exactTranslation = messagesByEnglishText[normalizedMessage];
    if (exactTranslation) return exactTranslation;
    if (!looksEnglish(normalizedMessage)) return normalizedMessage;
  }

  if (fallback) return fallback;
  return statusMessages[Number(status)] || 'Đã xảy ra lỗi. Vui lòng thử lại.';
}
