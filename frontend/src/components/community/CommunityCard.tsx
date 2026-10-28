import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Community } from '../../types';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { Users, Check } from 'lucide-react';

interface CommunityCardProps {
  community: Community;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({ community }) => {
  const navigate = useNavigate();
  const { joinCommunity, leaveCommunity } = useCommunityStore();
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();

  const isJoined =
    community.currentUserRole === 'MEMBER' ||
    community.currentUserRole === 'MODERATOR' ||
    community.currentUserRole === 'OWNER';

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      addToast('Vui lòng đăng nhập để tham gia cộng đồng', 'warning');
      navigate('/login');
      return;
    }

    if (isJoined) {
      leaveCommunity(community.name);
      addToast(`Đã rời khỏi cộng đồng ${community.displayName}`, 'info');
    } else {
      joinCommunity(community.name);
      addToast(`Đã tham gia cộng đồng ${community.displayName}!`, 'success');
    }
  };

  return (
    <div
      onClick={() => navigate(`/community/${community.name}`)}
      className="group relative bg-[#161922] hover:bg-[#1C202B] border border-[#262C3A] hover:border-[var(--color-orange-border)] rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between text-left space-y-4"
    >
      <div className="space-y-3">
        {/* Header: Avatar, Name & Category */}
        <div className="flex items-start gap-3">
          <Avatar
            src={community.avatarUrl}
            alt={community.displayName}
            size="lg"
            shape="rounded"
            className="group-hover:scale-105 transition-transform"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[#F1F3F7] group-hover:text-white truncate">
              {community.displayName}
            </h3>
            <span className="text-xs text-[#6C7482] font-mono block">
              community/{community.name}
            </span>
            <div className="mt-1">
              <span className="text-[11px] font-semibold text-[var(--color-orange)] bg-[var(--color-orange-soft)] px-2 py-0.5 rounded-full inline-block">
                {community.category}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-[#959DAA] line-clamp-3 leading-relaxed">
          {community.description}
        </p>
      </div>

      {/* Footer: Member count & Join button */}
      <div className="pt-3 border-t border-[#303235]/60 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-[#70747C]">
          <Users className="w-3.5 h-3.5 text-[#9A9DA3]" />
          <span className="font-semibold text-[#9A9DA3] tabular-nums">
            {community.memberCount.toLocaleString('vi-VN')}
          </span>
          <span>thành viên</span>
        </div>

        <Button
          variant={isJoined ? 'secondary' : 'primary'}
          size="sm"
          onClick={handleJoinClick}
          leftIcon={isJoined ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : undefined}
          className="py-1 px-4 text-xs font-bold"
        >
          {isJoined ? 'Đã tham gia' : 'Tham gia'}
        </Button>
      </div>
    </div>
  );
};

export default CommunityCard;
