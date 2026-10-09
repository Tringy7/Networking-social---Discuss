export type GlobalRole = 'GUEST' | 'USER' | 'ADMIN';
export type CommunityRole = 'MEMBER' | 'MODERATOR' | 'OWNER';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  bio: string;
  globalRole: GlobalRole;
  isLocked: boolean; // Khóa / Mở khóa tài khoản bởi Admin
  createdAt: string;
}

export interface CommunityMember {
  communityId: string;
  userId: string;
  role: CommunityRole;
  isBanned: boolean; // Ban / Unban bởi Mod/Owner/Admin
  joinedAt: string;
}

export interface Community {
  id: string;
  slug: string; // e.g. "java", "react", "gaming"
  name: string; // e.g. "c/Java Developers"
  description: string;
  banner: string;
  icon: string;
  rules: string[];
  ownerId: string;
  isLocked: boolean; // Khóa bởi Admin
  isDeleted: boolean; // Xóa bởi Admin
  createdAt: string;
}

export interface Post {
  id: string;
  communityId: string;
  authorId: string;
  title: string;
  content: string;
  tags?: string[];
  image?: string;
  isPinned: boolean; // Ghim / Bỏ ghim
  isDeleted: boolean; // Xóa bởi tác giả hoặc Mod/Admin
  createdAt: string;
  updatedAt?: string;
}

export interface PostVote {
  postId: string;
  userId: string;
  value: 1 | -1; // Upvote = 1, Downvote = -1
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null; // null = top-level, string = nested reply
  content: string;
  isDeleted: boolean;
  deletedBy?: 'AUTHOR' | 'MODERATOR' | 'ADMIN';
  createdAt: string;
  updatedAt?: string;
}

export type ReportReason = 
  | 'Spam & Quảng cáo'
  | 'Quấy rối & Đả kích'
  | 'Thông tin sai lệch'
  | 'Nội dung không phù hợp'
  | 'Vi phạm nội quy Community';

export interface PostReport {
  id: string;
  postId: string;
  reportedByUserId: string;
  reason: ReportReason;
  details?: string;
  status: 'PENDING' | 'DISMISSED' | 'RESOLVED_DELETED';
  createdAt: string;
  resolvedByUserId?: string;
  resolvedAt?: string;
}

export type SortFilter = 'hot' | 'new' | 'top';
