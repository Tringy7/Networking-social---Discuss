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
      className="bg-[#1a1a1b] rounded-2xl border border-[#343536] hover:border-[#545759] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer flex flex-col group"
    >
      {/* Banner */}
      <div className="h-20 bg-gradient-to-r from-[#2a2a2b] via-[#343536] to-[#222425] relative overflow-hidden">
        {community.banner && (
          <img
            src={community.banner}
            alt={community.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1a1a1b]/90 text-orange-400 border border-[#343536] backdrop-blur-xs shadow-xs">
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
            className="w-14 h-14 rounded-2xl border-4 border-[#1a1a1b] shadow-md object-cover bg-[#272729] shrink-0"
          />

          {role && (
            <div className="mb-1">
              <RoleBadge role={role} size="xs" />
            </div>
          )}
        </div>

        <h3 className="font-bold text-[#d7dadc] group-hover:text-orange-400 transition-colors line-clamp-1 text-base">
          c/{community.slug}
        </h3>
        <p className="text-xs font-medium text-[#818384] mb-2">
          {community.name}
        </p>
        <p className="text-xs text-[#818384] line-clamp-2 mb-4 flex-1 leading-relaxed">
          {community.description}
        </p>

        {/* Stats and button */}
        <div className="pt-3 border-t border-[#272729] flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3 text-xs text-[#818384]">
            <span className="flex items-center gap-1 font-medium" title="Thành viên">
              <Users className="w-3.5 h-3.5 text-[#818384]" />
              {formatNumber(community.memberCount)}
            </span>
            <span className="flex items-center gap-1 font-medium" title="Bài viết">
              <FileText className="w-3.5 h-3.5 text-[#818384]" />
              {formatNumber(community.postCount)}
            </span>
          </div>

          <button
            onClick={handleJoinLeave}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              isJoined
                ? 'bg-[#272729] hover:bg-[#343536] text-[#818384] hover:text-rose-400 hover:border-rose-900/50 border border-[#343536]'
                : 'bg-[#ff4500] hover:bg-[#ff5722] text-white shadow-xs font-bold'
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
