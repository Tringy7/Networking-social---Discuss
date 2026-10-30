import React, { useEffect, useState } from 'react';
import { Conversation } from '../../types';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { MessageSquare, Send, Search, ArrowLeft } from 'lucide-react';
import { MESSAGES_AVAILABLE, messageService } from '../../services';
import { useToastStore } from '../../store/useToastStore';

export const MessagesPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState('');
  const [showConversation, setShowConversation] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [searchConv, setSearchConv] = useState('');
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    messageService.list().then((items) => {
      setConversations(items);
      setActiveConvId(items[0]?.id || '');
    }).catch((error: unknown) => {
      addToast(error instanceof Error ? error.message : 'Không thể tải tin nhắn.', 'error');
    });
  }, [addToast]);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const filteredConversations = conversations.filter(
    (c) =>
      c.participant.displayName.toLowerCase().includes(searchConv.toLowerCase()) ||
      c.participant.username.toLowerCase().includes(searchConv.toLowerCase())
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConv) return;

    try {
      const newMsg = await messageService.send(activeConv.id, messageText.trim());
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === activeConv.id
            ? {
                ...conversation,
                lastMessage: newMsg.text,
                lastMessageTime: newMsg.timestamp,
                messages: [...conversation.messages, newMsg],
              }
            : conversation
        )
      );
      setMessageText('');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể gửi tin nhắn.', 'error');
    }
  };

  const selectConversation = async (conversationId: string) => {
    setActiveConvId(conversationId);
    setShowConversation(true);
    try {
      const conversation = await messageService.get(conversationId);
      setConversations((prev) => prev.map((item) => item.id === conversationId ? conversation : item));
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể tải cuộc trò chuyện.', 'error');
    }
  };

  return (
    <div className="inbox-page flex flex-col overflow-hidden text-left">
      {!MESSAGES_AVAILABLE && (
        <div className="feed-notice">
          Đang dùng hội thoại mẫu; tin nhắn chỉ được lưu trong phiên hiện tại.
        </div>
      )}
      <div className="flex-1 flex overflow-hidden">
        {/* CONVERSATION LIST (LEFT) */}
        <div className={`inbox-list w-full md:w-80 border-r border-[var(--border-color)] bg-[var(--bg-surface)] flex-col shrink-0 ${showConversation ? 'hidden md:flex' : 'flex'}`}>
          {/* Header & Search */}
          <div className="p-4 border-b border-[var(--border-color)] space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--color-orange)]" />
                <span>Tin nhắn</span>
              </h1>
              <span className="text-xs text-[var(--text-muted)] tabular-nums">{conversations.length} cuộc trò chuyện</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchConv}
                onChange={(e) => setSearchConv(e.target.value)}
                aria-label="Tìm hội thoại"
                placeholder="Tìm hội thoại..."
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[var(--color-orange)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] outline-none"
              />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => void selectConversation(conv.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-[var(--radius-card)] transition-[background-color,border-color,color,opacity,transform] cursor-pointer text-left ${
                  activeConvId === conv.id
                    ? 'bg-[var(--bg-elevated)]'
                    : 'hover:bg-[var(--bg-hover)]'
                }`}
              >
                <Avatar
                  src={conv.participant.avatarUrl}
                  alt={conv.participant.displayName}
                  size="md"
                  isOnline={conv.participant.status === 'online'}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {conv.participant.displayName}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] shrink-0">
                      {conv.lastMessageTime}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] truncate">{conv.lastMessage}</p>
                </div>
              </button>
            ))}
            {filteredConversations.length === 0 && (
              <p className="p-4 text-xs text-[var(--text-muted)] text-center">Chưa có cuộc trò chuyện nào.</p>
            )}
          </div>
        </div>

        {/* ACTIVE CONVERSATION CHAT (RIGHT) */}
        {activeConv ? (
          <div className={`flex-1 flex-col bg-[var(--bg-surface)] min-w-0 ${showConversation ? 'flex' : 'hidden md:flex'}`}>
            {/* Chat header */}
            <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-2">
              <button type="button" className="icon-button md:hidden" aria-label="Quay lại danh sách hội thoại" onClick={() => setShowConversation(false)}><ArrowLeft size={18} /></button>
              <div className="flex items-center gap-3">
                <Avatar
                  src={activeConv.participant.avatarUrl}
                  alt={activeConv.participant.displayName}
                  size="sm"
                  isOnline={activeConv.participant.status === 'online'}
                />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                    {activeConv.participant.displayName}
                  </h3>
                  <div className="text-xs text-[var(--text-muted)]">
                    @{activeConv.participant.username} ·{' '}
                    <span className={activeConv.participant.status === 'online' ? 'text-[var(--color-success)]' : ''}>
                      {activeConv.participant.status === 'online' ? 'Đang hoạt động' : 'Ngoại tuyến'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message history */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {activeConv.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-md p-3.5 rounded-[var(--radius-card)] text-xs sm:text-sm leading-relaxed ${
                      msg.isMe
                        ? 'bg-[var(--action-bg)] text-[var(--action-ink)] rounded-tr-none'
                        : 'bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-xs text-[var(--text-muted)] mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}
            </div>

            {/* Composer */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--border-color)] flex items-center gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                aria-label="Nội dung tin nhắn"
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[var(--color-orange)] rounded-xl px-4 py-2 text-xs text-[var(--text-primary)] outline-none"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                rightIcon={<Send className="w-3.5 h-3.5" />}
                disabled={!messageText.trim()}
              >
                Gửi
              </Button>
            </form>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-xs text-[var(--text-muted)]">
            Chọn một cuộc hội thoại từ danh sách bên trái.
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
