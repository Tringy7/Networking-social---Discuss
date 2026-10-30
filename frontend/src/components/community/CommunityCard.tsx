import React from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Community } from '../../types';
import Avatar from '../ui/Avatar';
import CommunityMembershipButton from './CommunityMembershipButton';

export default function CommunityCard({ community }: { community: Community }) {
  return <article className="community-directory-row">
    <div className="directory-card-header"><Link to={`/community/${community.name}`} className="directory-avatar"><Avatar src={community.avatarUrl} alt={community.displayName} size="lg" shape="rounded" /></Link></div>
    <div className="directory-description"><h2><Link to={`/community/${community.name}`} title={community.displayName}>{community.displayName}</Link></h2><span className="directory-handle" title={`c/${community.name}`}>c/{community.name} · {community.category}</span><p className="line-clamp-2">{community.description}</p></div>
    <div className="directory-card-footer"><div className="directory-members"><Users size={16} /><span>{community.memberCount.toLocaleString('vi-VN')}</span><span>thành viên</span></div><CommunityMembershipButton community={community} /></div>
  </article>;
}
