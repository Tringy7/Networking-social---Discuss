/**
 * Discuss Platform - Role Definitions
 * 
 * 1. Global / System Roles:
 *    - GUEST: Người dùng chưa đăng nhập, chỉ xem và tìm kiếm công khai
 *    - USER: Người dùng đăng ký thông thường
 *    - ADMIN: Quản trị viên hệ thống Discuss
 * 
 * 2. Community Roles (theo từng cộng đồng):
 *    - MEMBER: Thành viên thông thường
 *    - MODERATOR: Điều hành viên của cộng đồng đó
 *    - OWNER: Chủ sở hữu cộng đồng đó
 */

export const SYSTEM_ROLES = {
  GUEST: 'GUEST',
  USER: 'USER',
  ADMIN: 'ADMIN',
};

export const COMMUNITY_ROLES = {
  MEMBER: 'MEMBER',
  MODERATOR: 'MODERATOR',
  OWNER: 'OWNER',
};

export const REPORT_REASONS = [
  'Nội dung spam hoặc quảng cáo',
  'Ngôn từ thù địch, xúc phạm thành viên',
  'Thông tin sai lệch hoặc gây hiểu lầm',
  'Vi phạm quy tắc cộng đồng',
  'Nội dung nhạy cảm / không phù hợp',
  'Khác',
];

export const SORT_OPTIONS = {
  HOT: 'hot',
  NEW: 'new',
  TOP: 'top',
};
