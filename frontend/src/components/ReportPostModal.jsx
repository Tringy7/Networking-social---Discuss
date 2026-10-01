import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Flag, AlertTriangle, Send } from 'lucide-react';

const REPORT_REASONS = [
  'Spam & Quảng cáo',
  'Quấy rối & Đả kích',
  'Thông tin sai lệch',
  'Nội dung không phù hợp',
  'Vi phạm nội quy Community',
];

export const ReportPostModal = ({ postId, onClose }) => {
  const { reportPost, posts } = useApp();
  const [selectedReason, setSelectedReason] = useState('Spam & Quảng cáo');
  const [details, setDetails] = useState('');

  if (!postId) return null;
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const res = reportPost(postId, selectedReason, details);
    alert(res.message);
    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2 text-red-600">
            <Flag className="w-5 h-5" />
            <h2 className="text-base font-bold text-slate-900">
              Báo cáo bài viết
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs">
          <p className="font-semibold text-slate-800 line-clamp-1">{post.title}</p>
          <p className="text-slate-500 line-clamp-2 mt-0.5">{post.content}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold text-slate-700 mb-2">
              Lý do báo cáo:
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                    selectedReason === reason
                      ? 'border-red-500 bg-red-50/50 text-red-950 font-medium'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Mô tả chi tiết (Tùy chọn):
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Cung cấp thêm chi tiết để Moderator xem xét nhanh hơn..."
              rows={3}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-red-500 focus:outline-hidden text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              id="submit-report-post-btn"
              type="submit"
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi báo cáo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
