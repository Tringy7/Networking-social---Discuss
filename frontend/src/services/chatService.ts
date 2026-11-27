import apiClient, { API_BASE_URL } from './apiClient';

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
export interface ChatThread {
  id: number;
  peer: string;
  status: RequestStatus;
  incoming: boolean;
  blocked: boolean;
  blockedByMe: boolean;
  online: boolean;
  unread: number;
  pinned: boolean;
  hidden: boolean;
  muted: boolean;
  peerReadThrough?: number;
  preview?: { mine: boolean; text: string | null; recalled: boolean; createdAt: string } | null;
}
export interface ChatEntry {
  id: number;
  mine: boolean;
  text: string | null;
  createdAt: string;
  replyToId: number | null;
  editedAt: string | null;
  recalled: boolean;
  read: boolean;
  attachments: { id: number; filename: string; contentType: string }[];
  reactions: { emoji: string; mine: boolean }[];
}

export const chatService = {
  subscribeToChatEvents: () => new EventSource(API_BASE_URL.replace(/\/$/, '') + '/chat/events', { withCredentials: true }),
  listConversations: () => apiClient.get<ChatThread[]>('/chat'),
  getConversation: (id: number) => apiClient.get<ChatThread>(`/chat/${id}`),
  getMessageHistory: (id: number, before?: number) => apiClient.get<ChatEntry[]>(`/chat/${id}/messages${before ? `?before=${before}` : ''}`),
  openConversationAndSendMessage: (username: string, text: string, clientId: number) =>
    apiClient.post<ChatThread>('/chat/requests', { username, text, clientId }),
  sendMessage: (id: number, text: string, clientId: number, replyToId?: number, files: File[] = []) => {
    const endpoint = `/chat/${id}/messages`;
    if (!files.length) return apiClient.post<ChatEntry>(endpoint, { text, clientId, replyToId });
    const body = new FormData();
    body.set('text', text);
    body.set('clientId', String(clientId));
    if (replyToId) body.set('replyToId', String(replyToId));
    files.forEach(file => body.append('files', file));
    return apiClient.post<ChatEntry>(endpoint, body);
  },
  getMessageAttachmentUrl: (id: number, messageId: number, attachmentId: number) =>
    `${API_BASE_URL.replace(/\/$/, '')}/chat/${id}/messages/${messageId}/attachments/${attachmentId}`,
  setMessageReaction: (id: number, messageId: number, code: string) =>
    apiClient.put<void>(`/chat/${id}/messages/${messageId}/reaction`, { emoji: code }),
  removeMessageReaction: (id: number, messageId: number) => apiClient.delete<void>(`/chat/${id}/messages/${messageId}/reaction`),
  editMessage: (id: number, messageId: number, text: string) =>
    apiClient.patch<void>(`/chat/${id}/messages/${messageId}`, { text }),
  hideMessageForCurrentUser: (id: number, messageId: number) => apiClient.delete<void>(`/chat/${id}/messages/${messageId}`),
  recallMessageForEveryone: (id: number, messageId: number) => apiClient.delete<void>(`/chat/${id}/messages/${messageId}/content`),
  markConversationAsRead: (id: number, through: number) => apiClient.put<void>(`/chat/${id}/read`, { through }),
  updateConversationPreferences: (id: number, patch: Partial<Pick<ChatThread, 'pinned' | 'hidden' | 'muted'>>) =>
    apiClient.patch<ChatThread>(`/chat/${id}/preferences`, patch),
  blockUserForChat: (username: string) => apiClient.put<void>(`/chat/blocks/${encodeURIComponent(username)}`),
  unblockUserForChat: (username: string) => apiClient.delete<void>(`/chat/blocks/${encodeURIComponent(username)}`),
  getChatPrivacySettings: () => apiClient.get<{ allowRequests: boolean }>('/chat/privacy'),
  updateChatPrivacySettings: (allowRequests: boolean) => apiClient.put<void>('/chat/privacy', { allowRequests }),
};
