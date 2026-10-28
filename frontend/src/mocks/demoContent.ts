import { Comment, Conversation, NotificationItem, Post } from '../types';

const now = Date.now();

export const demoPosts: Post[] = [
  {
    id: 'demo-post-react-query',
    communityName: 'lap-trinh-viet-nam',
    communityDisplayName: 'Lập trình Việt Nam',
    communityAvatar: '',
    author: {
      id: 'demo-user-linh',
      username: 'linhnguyen',
      displayName: 'Linh Nguyễn',
      avatarUrl: '',
      role: 'MODERATOR',
    },
    title: 'Mọi người tổ chức state trong React app lớn như thế nào?',
    content:
      'Mình đang refactor một ứng dụng React có nhiều màn hình và muốn tìm cách chia state hợp lý. Phần nào nên để trong server state, phần nào giữ ở local state hoặc Zustand? Mọi người chia sẻ kinh nghiệm thực tế nhé.',
    tags: ['React', 'Frontend', 'State Management'],
    heartCount: 48,
    commentCount: 12,
    isHearted: false,
    isSaved: true,
    createdAt: new Date(now - 1000 * 60 * 18).toISOString(),
    pinned: true,
  },
  {
    id: 'demo-post-api-design',
    communityName: 'backend-viet-nam',
    communityDisplayName: 'Backend Việt Nam',
    communityAvatar: '',
    author: {
      id: 'demo-user-minh',
      username: 'minhtran',
      displayName: 'Minh Trần',
      avatarUrl: '',
    },
    title: 'REST API phân trang: offset hay cursor cho bảng tin?',
    content:
      'Với danh sách có thể tăng nhanh và người dùng liên tục tải thêm, cursor pagination thường cho kết quả ổn định hơn. Nhưng offset lại đơn giản khi cần nhảy đến một trang cụ thể. Dự án của bạn đang dùng cách nào?',
    tags: ['Backend', 'API', 'Database'],
    heartCount: 31,
    commentCount: 8,
    isHearted: true,
    isSaved: false,
    createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'demo-post-typescript',
    communityName: 'lap-trinh-viet-nam',
    communityDisplayName: 'Lập trình Việt Nam',
    communityAvatar: '',
    author: {
      id: 'demo-user-an',
      username: 'anpham',
      displayName: 'An Phạm',
      avatarUrl: '',
    },
    title: 'Một mẹo nhỏ để thu hẹp union type an toàn hơn',
    content:
      'Type guard giúp TypeScript hiểu chính xác nhánh dữ liệu đang xử lý thay vì phải ép kiểu. Đây là một ví dụ đơn giản:',
    codeSnippet: {
      language: 'TypeScript',
      code: "type Result = { ok: true; value: string } | { ok: false; error: string };\n\nfunction printResult(result: Result) {\n  if (result.ok) return result.value;\n  return result.error;\n}",
    },
    tags: ['TypeScript', 'Tips'],
    heartCount: 25,
    commentCount: 5,
    isHearted: false,
    isSaved: false,
    createdAt: new Date(now - 1000 * 60 * 60 * 7).toISOString(),
  },
  {
    id: 'demo-post-ui',
    communityName: 'thiet-ke-giao-dien',
    communityDisplayName: 'Thiết kế giao diện',
    communityAvatar: '',
    author: {
      id: 'demo-user-ha',
      username: 'hadesign',
      displayName: 'Hà Design',
      avatarUrl: '',
    },
    title: 'Checklist nhỏ trước khi bàn giao một màn hình UI',
    content:
      'Mình thường kiểm tra trạng thái loading, empty, error, responsive ở các breakpoint, focus keyboard và độ tương phản trước khi bàn giao. Bạn còn bổ sung mục nào không?',
    tags: ['UI', 'UX', 'Checklist'],
    heartCount: 19,
    commentCount: 4,
    isHearted: false,
    isSaved: false,
    createdAt: new Date(now - 1000 * 60 * 60 * 14).toISOString(),
  },
];

export const demoComments: Comment[] = [
  {
    id: 'demo-comment-1',
    postId: 'demo-post-react-query',
    author: {
      id: 'demo-user-khoa',
      username: 'khoale',
      displayName: 'Khoa Lê',
      avatarUrl: '',
    },
    content:
      'Mình thường dùng query library cho dữ liệu từ server, còn state tương tác ngắn hạn thì để trong component. Zustand phù hợp với state cần chia sẻ giữa nhiều màn hình.',
    parentCommentId: null,
    heartCount: 6,
    isHearted: false,
    createdAt: new Date(now - 1000 * 60 * 12).toISOString(),
    replies: [
      {
        id: 'demo-reply-1',
        postId: 'demo-post-react-query',
        author: {
          id: 'demo-user-linh',
          username: 'linhnguyen',
          displayName: 'Linh Nguyễn',
          avatarUrl: '',
        },
        content: 'Cảm ơn bạn, cách chia theo nguồn dữ liệu nghe rất dễ áp dụng.',
        parentCommentId: 'demo-comment-1',
        heartCount: 2,
        isHearted: false,
        createdAt: new Date(now - 1000 * 60 * 8).toISOString(),
      },
    ],
  },
  {
    id: 'demo-comment-2',
    postId: 'demo-post-react-query',
    author: {
      id: 'demo-user-mai',
      username: 'maivo',
      displayName: 'Mai Võ',
      avatarUrl: '',
    },
    content:
      'Nên tránh đưa mọi thứ vào global store. Form state và trạng thái mở modal mình vẫn để gần component sử dụng.',
    parentCommentId: null,
    heartCount: 3,
    isHearted: false,
    createdAt: new Date(now - 1000 * 60 * 5).toISOString(),
  },
];

export const demoNotifications: NotificationItem[] = [
  {
    id: 'demo-notification-reply',
    type: 'REPLY',
    actor: {
      username: 'khoale',
      displayName: 'Khoa Lê',
      avatarUrl: '',
    },
    message: 'đã trả lời trong cuộc thảo luận React của bạn.',
    targetUrl: '/post/demo-post-react-query',
    isRead: false,
    createdAt: new Date(now - 1000 * 60 * 6).toISOString(),
  },
  {
    id: 'demo-notification-mention',
    type: 'MENTION',
    actor: {
      username: 'maivo',
      displayName: 'Mai Võ',
      avatarUrl: '',
    },
    message: 'đã nhắc đến bạn trong một bình luận.',
    targetUrl: '/post/demo-post-react-query',
    isRead: false,
    createdAt: new Date(now - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'demo-notification-system',
    type: 'SYSTEM',
    actor: null,
    message: 'Chào mừng bạn đến với cộng đồng DISCUSS!',
    targetUrl: '/explore',
    isRead: true,
    createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
  },
];

export const demoConversations: Conversation[] = [
  {
    id: 'demo-conversation-khoa',
    participant: {
      id: 'demo-user-khoa',
      username: 'khoale',
      displayName: 'Khoa Lê',
      avatarUrl: '',
      status: 'online',
    },
    lastMessage: 'Mình đã gửi ví dụ về cách tách server state rồi nhé.',
    lastMessageTime: '10:24',
    unreadCount: 1,
    messages: [
      {
        id: 'demo-message-khoa-1',
        senderId: 'demo-user-khoa',
        senderUsername: 'khoale',
        text: 'Chào bạn, mình thấy câu hỏi về quản lý state trên DISCUSS.',
        timestamp: '10:18',
        isMe: false,
      },
      {
        id: 'demo-message-me-1',
        senderId: 'demo-current-user',
        senderUsername: 'ban',
        text: 'Bạn thường chia server state và local state như thế nào?',
        timestamp: '10:20',
        isMe: true,
      },
      {
        id: 'demo-message-khoa-2',
        senderId: 'demo-user-khoa',
        senderUsername: 'khoale',
        text: 'Mình đã gửi ví dụ về cách tách server state rồi nhé.',
        timestamp: '10:24',
        isMe: false,
      },
    ],
  },
  {
    id: 'demo-conversation-mai',
    participant: {
      id: 'demo-user-mai',
      username: 'maivo',
      displayName: 'Mai Võ',
      avatarUrl: '',
      status: 'offline',
    },
    lastMessage: 'Cảm ơn bạn đã chia sẻ checklist UI!',
    lastMessageTime: 'Hôm qua',
    unreadCount: 0,
    messages: [
      {
        id: 'demo-message-mai-1',
        senderId: 'demo-user-mai',
        senderUsername: 'maivo',
        text: 'Cảm ơn bạn đã chia sẻ checklist UI!',
        timestamp: 'Hôm qua',
        isMe: false,
      },
    ],
  },
];
