import React, { useState } from 'react';
import Modal from '../common/Modal';
import { usePost } from '../../context/PostContext';
import { REPORT_REASONS } from '../../constants/roles';
import { Flag, AlertTriangle, Loader2 } from 'lucide-react';

export default function ReportPostModal({ isOpen, onClose, post }) {
  const { reportPost } = usePost();
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!post) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await reportPost({
        postId: post.id,
        reason: selectedReason,
        note: note.trim(),
      });
      onClose();
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Báo cáo bài viết vi phạm" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            Báo cáo của bạn sẽ được gửi trực tiếp đến <strong>Điều hành viên (Moderator)</strong> của cộng đồng và <strong>Quản trị viên hệ thống (Admin)</strong> để kiểm tra xử lý.
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700">
          <span className="font-semibold text-slate-500 block mb-1">Bài viết bị báo cáo:</span>
          <p className="font-bold text-slate-900 line-clamp-1">{post.title}</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Lý do vi phạm <span className="text-rose-500">*</span>
          </label>
          <div className="space-y-2">
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                  selectedReason === reason
                    ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Ghi chú thêm (Tùy chọn)
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Mô tả cụ thể hành vi vi phạm hoặc đoạn văn bản vi phạm..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
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
            disabled={loading}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
            <span>Gửi báo cáo</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
