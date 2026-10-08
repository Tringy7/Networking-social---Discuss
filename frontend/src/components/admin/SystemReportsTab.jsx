import React, { useState } from 'react';
import { usePost } from '../../context/PostContext';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { formatDate } from '../../utils/formatters';
import { Flag, Trash2, Check, ShieldAlert, AlertTriangle, Eye } from 'lucide-react';

export default function SystemReportsTab({ onOpenPostDetail }) {
  const { reports, posts, resolveReport } = usePost();
  const { allUsers, lockUserAccount } = useAuth();
  const { communities } = useCommunity();
  const [filterStatus, setFilterStatus] = useState('PENDING'); // PENDING | ALL

  const getUser = (userId) => allUsers.find(u => u.id === userId) || { name: 'Người dùng', username: userId };
  const getPost = (postId) => posts.find(p => p.id === postId);

  const filteredReports = reports.filter(r => filterStatus === 'ALL' || r.status === filterStatus);

  const handleDismiss = async (reportId) => {
    await resolveReport(reportId, 'DISMISS', 'Nội dung không vi phạm');
  };

  const handleDeletePost = async (reportId) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài viết vi phạm này?')) {
      await resolveReport(reportId, 'DELETE_POST', 'Bài viết đã bị xóa do vi phạm quy tắc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterStatus === 'PENDING'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Chờ xử lý ({reports.filter(r => r.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Tất cả báo cáo ({reports.length})
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            Không có báo cáo vi phạm nào trong danh sách.
          </div>
        ) : (
          filteredReports.map((report) => {
            const reporter = getUser(report.reporterId);
            const post = getPost(report.postId);
            const comm = communities.find(c => c.id === report.communityId);
            const isPending = report.status === 'PENDING';

            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="p-1 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
                      <Flag className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-bold text-slate-800">
                      Lý do: <span className="text-rose-600">{report.reason}</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">
                      Báo cáo bởi <strong>{reporter.name}</strong> (@{reporter.username})
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400">{formatDate(report.createdAt)}</span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isPending
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : report.status === 'DISMISSED'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isPending ? 'Đang chờ xử lý' : report.status === 'DISMISSED' ? 'Đã bỏ qua' : 'Đã xử lý xóa'}
                  </span>
                </div>

                {report.note && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                    Ghi chú từ người báo cáo: "{report.note}"
                  </p>
                )}

                {/* Target Post summary */}
                {post ? (
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 mb-0.5">
                        Bài viết tại c/{comm?.slug || 'cộng đồng'}:
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                        {post.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                        {post.content}
                      </p>
                    </div>

                    <button
                      onClick={() => onOpenPostDetail(post)}
                      className="px-2.5 py-1 text-xs bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-100 rounded-xl text-xs text-slate-500 italic">
                    Bài viết gốc đã bị xóa hoặc không còn tồn tại trên hệ thống.
                  </div>
                )}

                {/* Actions */}
                {isPending && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleDismiss(report.id)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Bỏ qua (Hợp lệ)</span>
                    </button>

                    {post && (
                      <button
                        onClick={() => handleDeletePost(report.id)}
                        className="px-3 py-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa bài viết vi phạm</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
