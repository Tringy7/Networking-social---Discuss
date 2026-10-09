import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Send, AlertTriangle } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    communities,
    selectedCommunityId,
    createPost,
    isMemberOfCommunity,
    isUserBannedInCommunity,
    setActivePostId,
  } = useApp();

  const [communityId, setCommunityId] = useState<string>(selectedCommunityId || communities[0]?.id || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetComm = communities.find((c) => c.id === communityId);
  const isBanned = currentUser ? isUserBannedInCommunity(communityId, currentUser.id) : false;
  const isMember = currentUser ? isMemberOfCommunity(communityId, currentUser.id) : false;
  const isGlobalAdmin = currentUser?.globalRole === 'ADMIN';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!communityId) {
      setError('Vui lòng chọn một cộng đồng để đăng bài.');
      return;
    }

    if (targetComm?.isLocked && !isGlobalAdmin) {
      setError('Cộng đồng này đã bị Admin khóa, không thể đăng bài mới.');
      return;
    }

    if (isBanned) {
      setError('Bạn đã bị cấm (Banned) trong cộng đồng này.');
      return;
    }

    if (!isMember && !isGlobalAdmin) {
      setError('Bạn cần tham gia cộng đồng này trước khi đăng bài.');
      return;
    }

    const res = createPost(communityId, title, content);
    if (!res.success) {
      setError(res.message);
    } else {
      setTitle('');
      setContent('');
      onClose();
      if (res.postId) setActivePostId(res.postId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Đăng bài viết mới
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Chọn Community muốn đăng:
            </label>
            <select
              id="create-post-community-select"
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden text-slate-800"
              required
            >
              {communities
                .filter((c) => !c.isDeleted)
                .map((comm) => (
                  <option key={comm.id} value={comm.id}>
                    {comm.icon} {comm.name} ({comm.slug}) {comm.isLocked ? '[ĐANG KHÓA]' : ''}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tiêu đề bài viết:</label>
            <input
              id="create-post-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề thảo luận rõ ràng..."
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden font-semibold text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nội dung bài viết:</label>
            <textarea
              id="create-post-content-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Chia sẻ quan điểm, mã nguồn, câu hỏi hoặc ý tưởng của bạn..."
              rows={5}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden text-slate-800"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              id="submit-create-post-btn"
              type="submit"
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Đăng bài</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
