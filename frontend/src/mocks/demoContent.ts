import type { Conversation } from '../types';

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
