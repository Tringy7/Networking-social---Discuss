import React from 'react';
import { Link } from 'react-router-dom';
import { useCommunityStore } from '../../store/useCommunityStore';
import { usePostStore } from '../../store/usePostStore';
import CommunityMembershipButton from '../community/CommunityMembershipButton';
import Avatar from '../ui/Avatar';
import { ArrowUpRight } from 'lucide-react';

export default function RightSidebar() {
  const communities = useCommunityStore((state) => state.communities);
  const posts = usePostStore((state) => state.posts);
  const trending = [...posts].sort((a, b) => b.heartCount - a.heartCount).slice(0, 4);
  const suggested = communities.filter((c) => c.currentUserRole === 'NONE').slice(0, 4);
  return <aside className="context-rail" aria-label="Khám phá thêm">
    <section className="context-section">
      <div className="context-title"><h2>Đang được quan tâm</h2><Link to="/?tab=popular" aria-label="Xem thảo luận phổ biến"><ArrowUpRight size={17} /></Link></div>
      {trending.length ? trending.map((post) => <Link key={post.id} to={`/post/${post.id}`} className="context-story">
        <p>{post.communityDisplayName}</p><h3>{post.title}</h3><p>{post.commentCount} bình luận · {post.heartCount} lượt thích</p>
      </Link>) : <p className="text-sm text-[var(--text-secondary)]">Chưa có thảo luận nổi bật.</p>}
    </section>
    <section className="context-section">
      <div className="context-title"><h2>Tìm cộng đồng của bạn</h2><Link to="/explore">Khám phá <span aria-hidden="true">↗</span></Link></div>
      {suggested.map((c) => <div key={c.id} className="context-community">
        <Link to={`/community/${c.name}`}><Avatar src={c.avatarUrl} alt={c.displayName} size="sm" shape="rounded" /></Link>
        <div className="community-info"><Link to={`/community/${c.name}`}>{c.displayName}</Link><p>{c.memberCount.toLocaleString('vi-VN')} thành viên</p></div>
        <CommunityMembershipButton community={c} />
      </div>)}
      {!suggested.length && <Link to="/explore" className="text-sm text-[var(--text-secondary)]">Khám phá những mối quan tâm mới →</Link>}
    </section>
    <div className="context-note"><h2>Cùng xây dựng cộng đồng</h2><p>Bạn có một sở thích muốn chia sẻ? Tạo một nơi để mọi người cùng kết nối.</p><Link to="/communities/create">Tạo cộng đồng <ArrowUpRight size={15} /></Link></div>
    <nav className="context-links" aria-label="Thông tin DISCUSS"><Link to="/terms">Điều khoản</Link><Link to="/settings/privacy">Quyền riêng tư</Link><span>DISCUSS © 2026</span></nav>
  </aside>;
}
