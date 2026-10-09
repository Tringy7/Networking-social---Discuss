import { User, Community, CommunityMember, Post, Comment, PostVote, PostReport } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    username: 'admin',
    displayName: 'Quản Trị Viên (Admin)',
    email: 'admin@discuss.vn',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Quản trị viên toàn hệ thống Discuss. Giám sát an toàn và quy định toàn sàn.',
    globalRole: 'ADMIN',
    isLocked: false,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-a',
    username: 'user_a',
    displayName: 'Nguyễn Văn A',
    email: 'user_a@discuss.vn',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    bio: 'Lập trình viên đam mê Java Spring Boot và ReactJS. Thích chia sẻ kiến thức công nghệ.',
    globalRole: 'USER',
    isLocked: false,
    createdAt: '2026-02-10T08:30:00Z',
  },
  {
    id: 'user-b',
    username: 'user_b',
    displayName: 'Trần Thị B',
    email: 'tranb@discuss.vn',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Frontend enthusiast & Gaming streamer lúc rảnh rỗi.',
    globalRole: 'USER',
    isLocked: false,
    createdAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 'user-c',
    username: 'user_c',
    displayName: 'Lê Hoàng C',
    email: 'lehoangc@discuss.vn',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    bio: 'Thành viên yêu thích công nghệ phần cứng và game thủ PC.',
    globalRole: 'USER',
    isLocked: false,
    createdAt: '2026-02-20T14:15:00Z',
  },
  {
    id: 'user-locked',
    username: 'spammer99',
    displayName: 'Spam Bot Test',
    email: 'spambot@tempmail.com',
    avatar: 'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?w=150&auto=format&fit=crop&q=80',
    bio: 'Tài khoản đã bị Quản trị viên khóa do phát tán spam quảng cáo trái phép.',
    globalRole: 'USER',
    isLocked: true,
    createdAt: '2026-03-01T09:00:00Z',
  }
];

export const INITIAL_COMMUNITIES: Community[] = [
  {
    id: 'comm-java',
    slug: 'java',
    name: 'c/Java',
    description: 'Cộng đồng lập trình viên Java Việt Nam: Spring Boot, Microservices, JVM optimization, kiến trúc hệ thống và đồ án tốt nghiệp.',
    banner: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
    icon: '☕',
    rules: [
      'Tôn trọng thành viên, không công kích cá nhân',
      'Đăng mã nguồn rõ ràng trong code block hoặc gist',
      'Không quảng cáo khóa học rác, spam link affiliate',
      'Tìm kiếm trước khi hỏi các lỗi cơ bản (NullPointerException, etc.)'
    ],
    ownerId: 'user-a', // User A is OWNER
    isLocked: false,
    isDeleted: false,
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'comm-react',
    slug: 'react',
    name: 'c/React',
    description: 'Nơi thảo luận về hệ sinh thái React, Next.js, Vite, Tailwind CSS, State Management và các mẹo tối ưu hiệu năng frontend.',
    banner: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&auto=format&fit=crop&q=80',
    icon: '⚛️',
    rules: [
      'Chỉ thảo luận liên quan đến React và công nghệ Frontend web',
      'Cung cấp bản demo tái hiện lỗi (CodeSandbox/StackBlitz) nếu hỏi debug',
      'Không war giữa các framework vô ích'
    ],
    ownerId: 'user-b', // User B is Owner
    isLocked: false,
    isDeleted: false,
    createdAt: '2026-01-12T00:00:00Z',
  },
  {
    id: 'comm-gaming',
    slug: 'gaming',
    name: 'c/Gaming',
    description: 'Cộng đồng game thủ: Tin tức Esports, thảo luận PC Master Race, game AAA, indie games và đánh giá phần cứng.',
    banner: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&auto=format&fit=crop&q=80',
    icon: '🎮',
    rules: [
      'Gắn thẻ Spoiler nếu bàn luận cốt truyện game mới phát hành',
      'Nghiêm cấm chia sẻ phần mềm gian lận (cheat, hack)',
      'Giữ văn hóa ứng xử lành mạnh, không toxic'
    ],
    ownerId: 'user-c', // User C is Owner
    isLocked: false,
    isDeleted: false,
    createdAt: '2026-01-15T00:00:00Z',
  }
];

// Exact prompt mapping:
// User A:
// ├── Community Java    → OWNER
// ├── Community React   → MODERATOR
// └── Community Gaming  → MEMBER
export const INITIAL_MEMBERS: CommunityMember[] = [
  // Community Java
  { communityId: 'comm-java', userId: 'user-a', role: 'OWNER', isBanned: false, joinedAt: '2026-01-10T00:00:00Z' },
  { communityId: 'comm-java', userId: 'user-b', role: 'MEMBER', isBanned: false, joinedAt: '2026-01-11T10:00:00Z' },
  { communityId: 'comm-java', userId: 'user-c', role: 'MEMBER', isBanned: false, joinedAt: '2026-01-12T15:00:00Z' },

  // Community React
  { communityId: 'comm-react', userId: 'user-b', role: 'OWNER', isBanned: false, joinedAt: '2026-01-12T00:00:00Z' },
  { communityId: 'comm-react', userId: 'user-a', role: 'MODERATOR', isBanned: false, joinedAt: '2026-01-13T09:00:00Z' },
  { communityId: 'comm-react', userId: 'user-c', role: 'MEMBER', isBanned: false, joinedAt: '2026-01-14T11:00:00Z' },

  // Community Gaming
  { communityId: 'comm-gaming', userId: 'user-c', role: 'OWNER', isBanned: false, joinedAt: '2026-01-15T00:00:00Z' },
  { communityId: 'comm-gaming', userId: 'user-a', role: 'MEMBER', isBanned: false, joinedAt: '2026-01-16T14:00:00Z' },
  { communityId: 'comm-gaming', userId: 'user-b', role: 'MODERATOR', isBanned: false, joinedAt: '2026-01-16T15:00:00Z' },
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post-1',
    communityId: 'comm-java',
    authorId: 'user-a',
    title: '📌 Hướng dẫn thiết kế phân quyền RBAC 2 tầng (Global & Community) trong hệ sinh thái Discuss',
    content: `Chào mọi người trong c/Java! Khi xây dựng mạng xã hội thảo luận như Discuss, điểm khác biệt then chốt là vai trò Community Role (Owner, Moderator, Member) chỉ có hiệu lực cục bộ trong từng sub-community cụ thể.

Các bạn cần lưu ý:
1. Global Role chỉ gồm: Guest, User, Admin.
2. Community Role gồm: Member, Moderator, Owner.
3. Không để Owner hay Moderator thành Global Role vì 1 User có thể là Owner của c/Java nhưng chỉ là Member ở c/Gaming.

Hãy xem kỹ sơ đồ kiến trúc và cùng thảo luận bên dưới nhé!`,
    isPinned: true, // Ghim bài viết
    isDeleted: false,
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'post-2',
    communityId: 'comm-react',
    authorId: 'user-b',
    title: 'Cách render Nested Comment Tree đệ quy hiệu quả trong React 19',
    content: `Trong mô hình diễn đàn thảo luận, chức năng bình luận nhiều cấp (Threaded/Nested Comments) rất phổ biến. Mình vừa áp dụng cấu trúc đệ quy (Recursive Component) với state quản lý reply trực tiếp. 

Mỗi comment giữ parentId, component con tự gọi lại chính nó với indent phân tầng và thanh line vertical thu gọn cực đẹp. Mọi người có kinh nghiệm tối ưu re-render khi cây comment sâu không?`,
    isPinned: false,
    isDeleted: false,
    createdAt: '2026-02-05T14:20:00Z',
  },
  {
    id: 'post-3',
    communityId: 'comm-gaming',
    authorId: 'user-c',
    title: 'Đánh giá cấu hình PC tối ưu cho sinh viên IT vừa lập trình vừa chơi game 2026',
    content: `Với tầm giá 20-25 triệu hiện tại, lựa chọn CPU nào đa nhân chạy Docker/IDE tốt mà vẫn kéo mượt Black Myth Wukong hay GTA 6? Mình đang phân vân giữa Core i5 thế hệ mới và Ryzen 5 7600X.`,
    isPinned: false,
    isDeleted: false,
    createdAt: '2026-02-10T19:00:00Z',
  },
  {
    id: 'post-4',
    communityId: 'comm-java',
    authorId: 'user-c',
    title: 'Quảng cáo bán tài khoản game giá rẻ bất ngờ! (Nội dung vi phạm quy tắc)',
    content: `Truy cập ngay web này nhận 100k xu miễn phí không cần nạp! (Đây là bài viết mẫu vi phạm để minh họa quy trình Báo cáo & Kiểm duyệt của Moderator/Owner/Admin).`,
    isPinned: false,
    isDeleted: false,
    createdAt: '2026-02-18T08:00:00Z',
  }
];

export const INITIAL_VOTES: PostVote[] = [
  { postId: 'post-1', userId: 'user-a', value: 1 },
  { postId: 'post-1', userId: 'user-b', value: 1 },
  { postId: 'post-1', userId: 'user-c', value: 1 },
  { postId: 'post-2', userId: 'user-a', value: 1 },
  { postId: 'post-2', userId: 'user-b', value: 1 },
  { postId: 'post-3', userId: 'user-a', value: 1 },
  { postId: 'post-4', userId: 'user-a', value: -1 },
];

export const INITIAL_COMMENTS: Comment[] = [
  {
    id: 'comment-1',
    postId: 'post-1',
    authorId: 'user-b',
    parentId: null,
    content: 'Bài viết rất chi tiết và giải thích đúng trọng tâm! Mình trước đây cũng bị nhầm lẫn khi coi Owner là Global Role.',
    isDeleted: false,
    createdAt: '2026-02-01T11:00:00Z',
  },
  {
    id: 'comment-2',
    postId: 'post-1',
    authorId: 'user-a',
    parentId: 'comment-1', // Nested reply
    content: 'Cảm ơn bạn! Đúng vậy, khi phân tách rõ 2 tầng quyền thì code logic kiểm duyệt trong Community sẽ rất chặt chẽ và không bị xung đột.',
    isDeleted: false,
    createdAt: '2026-02-01T11:30:00Z',
  },
  {
    id: 'comment-3',
    postId: 'post-1',
    authorId: 'user-c',
    parentId: 'comment-2', // Level 3 nested reply
    content: 'Cho mình hỏi nếu Owner muốn rời Community thì theo quy định bắt buộc phải chuyển quyền Owner trước đúng không?',
    isDeleted: false,
    createdAt: '2026-02-01T12:00:00Z',
  },
  {
    id: 'comment-4',
    postId: 'post-1',
    authorId: 'user-a',
    parentId: 'comment-3', // Level 4 reply
    content: 'Chính xác! Trong hệ thống này Owner không được rời trực tiếp để tránh cộng đồng bị mồ côi (orphaned). Cần gán Owner mới, lúc đó Owner cũ hạ xuống Member rồi mới được rời.',
    isDeleted: false,
    createdAt: '2026-02-01T12:15:00Z',
  },
  {
    id: 'comment-5',
    postId: 'post-2',
    authorId: 'user-a',
    parentId: null,
    content: 'Nên dùng memoization cho từng nhánh comment item để tránh re-render cả cây khi người dùng gõ phím reply.',
    isDeleted: false,
    createdAt: '2026-02-05T15:00:00Z',
  }
];

export const INITIAL_REPORTS: PostReport[] = [
  {
    id: 'report-1',
    postId: 'post-4',
    reportedByUserId: 'user-b',
    reason: 'Spam & Quảng cáo',
    details: 'Nội dung spam quảng cáo game không liên quan đến lập trình Java trong cộng đồng.',
    status: 'PENDING',
    createdAt: '2026-02-18T09:00:00Z',
  }
];
