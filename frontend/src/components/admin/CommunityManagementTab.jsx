import React, { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatNumber } from '../../utils/formatters';
import { Search, Lock, Unlock, Users, FileText, CheckCircle } from 'lucide-react';

export default function CommunityManagementTab({ onSelectCommunity }) {
  const { communities, toggleCommunityStatus } = useCommunity();
  const { allUsers } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const getOwner = (ownerId) => allUsers.find(u => u.id === ownerId) || { name: 'Admin', username: 'admin' };

  const filteredCommunities = communities.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên cộng đồng, slug..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
          />
        </div>
      </div>

      {/* Communities Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Cộng đồng</th>
                <th className="py-3 px-4">Chủ sở hữu (Owner)</th>
                <th className="py-3 px-4">Thành viên</th>
                <th className="py-3 px-4">Bài viết</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCommunities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Không tìm thấy cộng đồng nào.
                  </td>
                </tr>
              ) : (
                filteredCommunities.map((c) => {
                  const owner = getOwner(c.ownerId);
                  const isLocked = c.status === 'LOCKED';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <div
                          onClick={() => onSelectCommunity(c.id)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <img
                            src={c.avatar}
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition">
                              c/{c.slug}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {c.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700">{owner.name}</span>
                        <div className="text-[11px] text-slate-400 font-mono">@{owner.username}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {formatNumber(c.memberCount)}
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {formatNumber(c.postCount)}
                      </td>

                      <td className="py-3 px-4">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <Lock className="w-3 h-3" /> Đã khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> Hoạt động
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => toggleCommunityStatus(c.id)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition inline-flex items-center gap-1 cursor-pointer ${
                            isLocked
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                              : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200'
                          }`}
                        >
                          {isLocked ? (
                            <>
                              <Unlock className="w-3 h-3" />
                              <span>Mở khóa</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3" />
                              <span>Khóa</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
