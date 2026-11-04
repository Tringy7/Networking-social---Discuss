import React, { useState } from 'react';
import Modal from '../common/Modal';
import { usePost } from '../../context/PostContext';
import { useCommunity } from '../../context/CommunityContext';
import { useAuth } from '../../context/AuthContext';
import { permissions } from '../../utils/permissions';
import { Send, Loader2 } from 'lucide-react';

export default function CreatePostModal({ isOpen, onClose, defaultCommunityId, onCreated }) {
  const { createPost } = usePost();
  const { communities, getUserCommunityRole } = useCommunity();
  const { currentUser } = useAuth();

  const [communityId, setCommunityId] = useState(defaultCommunityId || (communities[0]?.id || ''));
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const roleInSelected = getUserCommunityRole(communityId);
  const canPostInSelected = permissions.canCreatePost(currentUser, roleInSelected);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !communityId) return;

    setLoading(true);
    try {
      const newPost = await createPost({
        communityId,
        title: title.trim(),
        content: content.trim(),
      });

      if (newPost) {
        setTitle('');
        setContent('');
        if (onCreated) onCreated(newPost);
        onClose();
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo bài viết thảo luận mới" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Select Community */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Chọn Cộng đồng đăng bài <span className="text-rose-500">*</span>
          </label>
          <select
            value={communityId}
            onChange={(e) => setCommunityId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {communities.map((c) => (
              <option key={c.id} value={c.id}>
                community/{c.slug} - {c.name}
              </option>
            ))}
          </select>

          {!canPostInSelected && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-lg mt-1.5 font-medium">
              ⚠️ Bạn chưa tham gia cộng đồng này! Vui lòng tham gia cộng đồng trước khi đăng bài.
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Tiêu đề bài viết <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nêu rõ chủ đề cần chia sẻ hoặc câu hỏi thảo luận..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Nội dung chi tiết <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Cung cấp đầy đủ ngữ cảnh, thông tin hoặc mã nguồn nếu có..."
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
          />
        </div>


        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading || !canPostInSelected}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-medium rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Đăng bài</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
