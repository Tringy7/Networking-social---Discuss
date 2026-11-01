import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Settings, ShieldCheck, LogOut } from 'lucide-react';
import type { Community } from '../../types';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import CommunityMembershipButton from './CommunityMembershipButton';

interface Props {
  community: Community;
  variant?: 'explore' | 'mine';
  onLeave?: () => void;
  leaving?: boolean;
}

export default function CommunityCard({ community, variant = 'explore', onLeave, leaving }: Props) {
  const title = community.displayName?.trim() || community.name;
  const role = community.currentUserRole;
  const joined = ['OWNER', 'MODERATOR', 'MEMBER'].includes(role);
  const manager = role === 'OWNER' || role === 'MODERATOR';
  const href = `/community/${community.name}`;
  return <article className="community-directory-row">
    <div className="directory-card-header">
      <Link to={href} className="directory-avatar" aria-label={`Truy cập ${title}`}><Avatar src={community.avatarUrl} alt={title} size="lg" shape="rounded" /></Link>
      <div className="directory-identity"><h2><Link to={href} title={title}>{title}</Link></h2><span className="directory-handle" title={`c/${community.name}`}>c/{community.name}</span></div>
    </div>
    <div className="directory-role">{manager && <Badge role={role} />}</div>
    <div className="directory-description"><span className="directory-category" title={community.category}>{community.category || 'Chưa phân loại'}</span><p className="line-clamp-2">{community.description || 'Chưa có mô tả cộng đồng.'}</p></div>
    <div className="directory-card-footer">
      <div className="directory-members"><Users size={15} aria-hidden="true" /><span>{community.memberCount.toLocaleString('vi-VN')} thành viên</span></div>
      <div className="directory-actions">
        {variant === 'mine' && manager && <Link to={`${href}/${role === 'OWNER' ? 'settings' : 'moderation'}`} className="icon-button directory-secondary" aria-label={`Quản lý ${title}`} title="Quản lý">{role === 'OWNER' ? <Settings size={17} /> : <ShieldCheck size={17} />}</Link>}
        {variant === 'mine' && role !== 'OWNER' && onLeave && <Button variant="ghost" size="sm" className="directory-leave" onClick={onLeave} isLoading={leaving} aria-label={`Rời cộng đồng ${title}`} title="Rời cộng đồng"><LogOut size={16} /></Button>}
        {variant === 'mine' || joined ? <Link to={href} className="directory-visit">Truy cập</Link> : <CommunityMembershipButton community={community} />}
      </div>
    </div>
  </article>;
}
