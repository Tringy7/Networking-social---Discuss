import React, { useEffect, useState } from 'react';
import { Conversation } from '../../types';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { MessageSquare, Send, Search } from 'lucide-react';
import { messageService } from '../../services';
import { useToastStore } from '../../store/useToastStore';

export const MessagesPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState('');
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
    try {
      const conversation = await messageService.get(conversationId);
      setConversations((prev) => prev.map((item) => item.id === conversationId ? conversation : item));
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể tải cuộc trò chuyện.', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-[#191A1C] border border-[#303235] rounded-3xl overflow-hidden shadow-2xl text-left">
      <div className="flex-1 flex overflow-hidden">
        {/* CONVERSATION LIST (LEFT) */}
        <div className="w-full md:w-80 border-r border-[#303235] bg-[#141517] flex flex-col shrink-0">
          {/* Header & Search */}
          <div className="p-4 border-b border-[#303235] space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#FF5700]" />
                <span>Tin nhắn</span>
              </h2>
              <span className="text-[10px] text-[#70747C] font-mono">{conversations.length} cuộc trò chuyện</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#70747C]" />
              <input
                type="text"
                value={searchConv}
                onChange={(e) => setSearchConv(e.target.value)}
                placeholder="Tìm hội thoại..."
                className="w-full bg-[#101112] border border-[#303235] focus:border-[#FF5700] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#F5F5F5] outline-none"
              />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => void selectConversation(conv.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer text-left ${
                  activeConvId === conv.id
                    ? 'bg-[#FF5700]/15 border border-[#FF5700]/30'
                    : 'hover:bg-[#1E2023]'
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
                    <span className="text-xs font-bold text-[#F5F5F5] truncate">
                      {conv.participant.displayName}
                    </span>
                    <span className="text-[10px] text-[#70747C] shrink-0">
                      {conv.lastMessageTime}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9A9DA3] truncate">{conv.lastMessage}</p>
                </div>
              </button>
            ))}
            {filteredConversations.length === 0 && (
              <p className="p-4 text-xs text-[#70747C] text-center">Chưa có cuộc trò chuyện nào.</p>
            )}
          </div>
        </div>

        {/* ACTIVE CONVERSATION CHAT (RIGHT) */}
        {activeConv ? (
          <div className="flex-1 flex flex-col bg-[#191A1C] min-w-0">
            {/* Chat header */}
            <div className="p-4 border-b border-[#303235] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  src={activeConv.participant.avatarUrl}
                  alt={activeConv.participant.displayName}
                  size="sm"
                  isOnline={activeConv.participant.status === 'online'}
                />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#F5F5F5]">
                    {activeConv.participant.displayName}
                  </h3>
                  <div className="text-[10px] text-[#70747C]">
                    @{activeConv.participant.username} ·{' '}
                    <span className={activeConv.participant.status === 'online' ? 'text-[#22C55E]' : ''}>
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
                    className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.isMe
                        ? 'bg-[#FF5700] text-white rounded-tr-none'
                        : 'bg-[#222426] border border-[#303235] text-[#F5F5F5] rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-[#70747C] mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}
            </div>

            {/* Composer */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-[#303235] flex items-center gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-[#101112] border border-[#303235] focus:border-[#FF5700] rounded-xl px-4 py-2 text-xs text-[#F5F5F5] outline-none"
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
          <div className="flex-1 flex items-center justify-center text-xs text-[#70747C]">
            Chọn một cuộc hội thoại từ danh sách bên trái.
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
