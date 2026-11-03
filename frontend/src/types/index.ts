export type UserRole = 'GUEST' | 'USER' | 'MODERATOR' | 'OWNER' | 'ADMIN';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING' | 'LOCKED' | 'DELETED';

export interface PrivacySettings {
  showDateOfBirth: boolean;
  showLocation: boolean;
  showPostsOnProfile: boolean;
}

export interface AppearanceSettings {
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  density: 'comfortable' | 'compact';
  fontSize: 'small' | 'medium' | 'large';
  animationIntensity: 'full' | 'reduced' | 'off';
  sidebarCollapsed: boolean;
  sidebarHidden: boolean;
  feedLayout: 'card' | 'compact';
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  bannerUrl: string;
  bio: string;
  location?: string;
  dateOfBirth?: string;
  gender?: string;
  privacy: PrivacySettings;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  karma: number;
}

export type CommunityCategory = 
  | 'Lập trình'
  | 'Frontend'
  | 'Backend'
  | 'Công nghệ'
  | 'Thiết kế'
  | 'Giải trí'
  | 'Games'
  | 'Giáo dục';

export type CommunityVisibility = 'PUBLIC' | 'PRIVATE';
export type CommunityMemberRole = 'OWNER' | 'MODERATOR' | 'MEMBER' | 'NONE';

export interface CommunityRule {
  id: string;
  title: string;
  description: string;
}

export interface Community {
  id: string;
  name: string; // url slug e.g. "lap-trinh-viet-nam"
  displayName: string;
  description: string;
  avatarUrl: string;
  bannerUrl: string;
  category: CommunityCategory;
  visibility: CommunityVisibility;
  status: 'ACTIVE' | 'RESTRICTED' | 'BANNED';
  memberCount: number;
  currentUserRole: CommunityMemberRole;
  ownerId: string;
  ownerUsername: string;
  createdAt: string;
  rules: string;
}

export type PostType = 'TEXT' | 'LINK';
export type PostMediaType = 'IMAGE' | 'VIDEO';
export interface PostMediaInput {
  type: PostMediaType;
  objectKey: string;
  caption?: string;
}
export interface PostImage {
  objectKey: string | null;
  url: string;
  position: number;
  inlineImage: boolean;
}
export interface PostMedia extends PostImage {
  type: PostMediaType;
  caption?: string | null;
}
export interface PostInput {
  communityName: string;
  title: string;
  type: 'TEXT';
  content: string;
  tags: string[];
  media: PostMediaInput[];
}
export interface Post {
  id: string;
  communityName: string;
  communityDisplayName: string;
  communityAvatar: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    role?: UserRole;
  };
  title: string;
  content: string;
  type?: PostType;
  media?: PostMedia[];
  linkUrl?: string | null;
  updatedAt?: string;
  tags?: string[];
  mediaUrl?: string;
  mediaType?: 'image' | 'code' | 'link';
  codeSnippet?: {
    language: string;
    code: string;
  };
  heartCount: number;
  commentCount: number;
  isHearted: boolean;
  isSaved: boolean;
  createdAt: string;
  pinned?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    isAuthor?: boolean;
    role?: UserRole;
  };
  content: string;
  parentCommentId: string | null;
  heartCount: number;
  isHearted?: boolean;
  replies?: Comment[];
  createdAt: string;
}

export type ReportContentType = 'POST' | 'COMMENT' | 'COMMUNITY' | 'USER';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';

export interface Report {
  id: string;
  contentType: ReportContentType;
  contentId: string;
  contentTitle?: string;
  contentSnippet?: string;
  communityName?: string;
  reporterUsername: string;
  targetUsername?: string;
  reason: string;
  status: ReportStatus;
  resolutionNote?: string;
  createdAt: string;
}

export interface CommunityMember {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  role: 'OWNER' | 'MODERATOR' | 'MEMBER';
  joinedAt: string;
  status: 'ACTIVE' | 'MUTED' | 'BANNED';
}

export type NotificationType = 'REPLY' | 'MENTION' | 'INVITE' | 'MOD_ACTION' | 'SYSTEM';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  actor: {
    username: string;
    displayName: string;
    avatarUrl: string;
  } | null;
  message: string;
  targetUrl: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}

export interface Conversation {
  id: string;
  participant: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    status: 'online' | 'offline';
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}
