import React from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { useAuth } from '../../context/AuthContext';
import RoleBadge from '../common/RoleBadge';
import { formatNumber } from '../../utils/formatters';
import { Users, FileText, Check, Plus, ShieldCheck, Award } from 'lucide-react';

export default function CommunityCard({ community, onSelectCommunity }) {
  const { getUserCommunityRole, joinCommunity, leaveCommunity } = useCommunity();
  const { currentUser } = useAuth();

  const role = getUserCommunityRole(community.id);
  const isJoined = !!role;

  const handleJoinLeave = (e) => {
    e.stopPropagation();
    if (isJoined) {
      leaveCommunity(community.id);
    } else {
      joinCommunity(community.id);
    }
  };

  return (
    <div
      onClick={() => onSelectCommunity(community.id)}
      className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer flex flex-col group"
    >
      {/* Banner */}
      <div className="h-20 bg-gradient-to-r from-indigo-500 to-purple-600 relative overflow-hidden">
        {community.banner && (
          <img
            src={community.banner}
            alt={community.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-slate-800 backdrop-blur-xs shadow-xs">
          {community.category || 'Chung'}
        </span>
      </div>

      {/* Info */}
      <div className="p-4 pt-0 flex-1 flex flex-col relative">
        {/* Avatar */}
        <div className="-mt-7 mb-2 flex items-end justify-between">
          <img
            src={community.avatar}
            alt={community.name}
            className="w-14 h-14 rounded-2xl border-4 border-white shadow-md object-cover bg-white shrink-0"
          />

          {role && (
            <div className="mb-1">
              <RoleBadge role={role} size="xs" />
            </div>
          )}
        </div>

        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 text-base">
          c/{community.slug}
        </h3>
        <p className="text-xs font-medium text-slate-500 mb-2">
          {community.name}
        </p>
        <p className="text-xs text-slate-600 line-clamp-2 mb-4 flex-1">
          {community.description}
        </p>

        {/* Stats and button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium" title="Thành viên">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              {formatNumber(community.memberCount)}
            </span>
            <span className="flex items-center gap-1 font-medium" title="Bài viết">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              {formatNumber(community.postCount)}
            </span>
          </div>

          <button
            onClick={handleJoinLeave}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              isJoined
                ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
            }`}
          >
            {isJoined ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Đã tham gia</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Tham gia</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
