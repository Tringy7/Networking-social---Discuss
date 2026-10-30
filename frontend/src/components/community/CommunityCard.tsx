import React, { useState } from 'react';
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

  const [isUpdating, setIsUpdating] = useState(false);
  const isJoined =
    community.currentUserRole === 'MEMBER' ||
    community.currentUserRole === 'MODERATOR' ||
    community.currentUserRole === 'OWNER';

  const handleJoinClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      addToast('Vui lòng đăng nhập để tham gia cộng đồng', 'warning');
      navigate('/login');
      return;
    }

    if (isUpdating) return;
    setIsUpdating(true);
    try {
      if (isJoined) { await leaveCommunity(community.name); addToast(`Đã rời ${community.displayName}`, 'info'); }
      else { await joinCommunity(community.name); addToast(`Đã tham gia ${community.displayName}!`, 'success'); }
    } catch (error) { addToast(error instanceof Error ? error.message : 'Không thể cập nhật thành viên.', 'error'); }
    finally { setIsUpdating(false); }

  };

  return (
    <article className="community-directory-row">
      <Link to={`/community/${community.name}`} className="directory-avatar"><Avatar src={community.avatarUrl} alt={community.displayName} size="lg" shape="rounded" /></Link>
      <div className="directory-description"><p className="directory-category">{community.category}</p><h2><Link to={`/community/${community.name}`}>{community.displayName}</Link></h2><p className="line-clamp-2">{community.description}</p><span className="directory-handle">c/{community.name}</span></div>
      <div className="directory-members"><Users size={15} /><span>{community.memberCount.toLocaleString('vi-VN')}</span><span>thành viên</span></div>
      <Button variant={isJoined ? 'secondary' : 'outline'} size="sm" isLoading={isUpdating} onClick={handleJoinClick} leftIcon={isJoined ? <Check size={14} /> : undefined}>{isJoined ? 'Đã tham gia' : 'Tham gia'}</Button>
    </article>
  );
};
export default CommunityCard;
