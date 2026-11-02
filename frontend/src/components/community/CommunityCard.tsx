import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Settings, ShieldCheck, LogOut } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useSettingsStore } from '../../store/useSettingsStore';
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
  const reduced = useReducedMotion();
  const intensity = useSettingsStore((state) => state.settings.animationIntensity);
  const quiet = reduced || intensity !== 'full';
  const title = community.displayName?.trim() || community.name;
  const role = community.currentUserRole;
  const joined = ['OWNER', 'MODERATOR', 'MEMBER'].includes(role);
  const manager = role === 'OWNER' || role === 'MODERATOR';
  const href = `/c/${community.name}`;
  return <motion.article className="community-directory-row"
    initial={quiet ? false : { opacity: 0.85, y: 3 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: quiet ? 0 : 0.18, ease: 'easeOut' }}>
    <div className="directory-card-header">
      <Link to={href} className="directory-avatar" aria-label={`Truy cập ${title}`}><Avatar src={community.avatarUrl} alt={title} size="md" shape="rounded" /></Link>
      <div className="directory-identity"><h2><Link to={href} title={title}>{title}</Link></h2><span className="directory-handle" title={`c/${community.name}`}>c/{community.name}</span></div>
      <div className="directory-primary-action">
        {variant === 'mine' || joined ? <Link to={href} className="directory-visit">Truy cập</Link> : <CommunityMembershipButton community={community} />}
      </div>
    </div>
    <div className="directory-description">
      <div className="directory-description-meta"><span className="directory-category" title={community.category}>{community.category || 'Chưa phân loại'}</span>{manager && <Badge role={role} />}</div>
      <p className="line-clamp-2">{community.description || 'Chưa có mô tả cộng đồng.'}</p>
    </div>
    <div className="directory-card-footer">
      <div className="directory-members"><Users size={15} aria-hidden="true" /><span>{community.memberCount.toLocaleString('vi-VN')} thành viên</span></div>
      <div className="directory-actions">
        {variant === 'mine' && manager && <Link to={`${href}/${role === 'OWNER' ? 'settings' : 'moderation'}`} className="icon-button directory-secondary" aria-label={`Quản lý ${title}`} title="Quản lý">{role === 'OWNER' ? <Settings size={17} /> : <ShieldCheck size={17} />}</Link>}
        {variant === 'mine' && role !== 'OWNER' && onLeave && <Button variant="ghost" size="sm" className="directory-leave" onClick={onLeave} isLoading={leaving} aria-label={`Rời cộng đồng ${title}`} title="Rời cộng đồng"><LogOut size={16} /></Button>}
      </div>
    </div>
  </motion.article>;
}
