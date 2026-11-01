import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import CommunityCard from '../../components/community/CommunityCard.tsx';
import PageHeader from '../../components/ui/PageHeader';
import EditorialTabs from '../../components/ui/EditorialTabs';
import Button from '../../components/ui/Button';
import { Users, Plus, Compass, Loader2 } from 'lucide-react';

export default function MyCommunitiesPage() {
  const { myCommunities, leaveCommunity, hydrateMine } = useCommunityStore();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const addToast = useToastStore((state) => state.addToast);
  const [tab, setTab] = useState<'all' | 'owned' | 'joined'>('all');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [leaving, setLeaving] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setLoading(true);
    setFailed(false);
    hydrateMine().catch((error: unknown) => {
      if (!active) return;
      setFailed(true);
      addToast(error instanceof Error ? error.message : 'Không thể tải cộng đồng của bạn.', 'error');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [addToast, hydrateMine, userId, retry]);

  const owned = myCommunities.filter((c) => c.currentUserRole === 'OWNER' || c.ownerUsername === user?.username);
  const joined = myCommunities.filter((c) => !owned.some((item) => item.id === c.id) && ['MEMBER', 'MODERATOR'].includes(c.currentUserRole));
  const all = [...owned, ...joined];
  const displayed = tab === 'owned' ? owned : tab === 'joined' ? joined : all;
  const handleLeave = async (name: string, title: string) => {
    if (leaving.includes(name)) return;
    setLeaving((names) => [...names, name]);
    try { await leaveCommunity(name); addToast(`Đã rời khỏi cộng đồng ${title}`, 'info'); }
    catch (error) { addToast(error instanceof Error ? error.message : 'Không thể rời cộng đồng.', 'error'); }
    finally { setLeaving((names) => names.filter((item) => item !== name)); }
  };

  return <div className="my-communities-page pb-8">
    <PageHeader title="Cộng đồng của tôi" description="Quản lý và kết nối với các cộng đồng của bạn." actions={<Link to="/communities/create"><Button size="sm" leftIcon={<Plus size={16} />}>Tạo cộng đồng</Button></Link>} />
    <EditorialTabs label="Lọc cộng đồng của tôi" value={tab} onChange={setTab} options={[{id:'all',label:`Tất cả (${all.length})`},{id:'owned',label:`Đang làm chủ (${owned.length})`},{id:'joined',label:`Đã tham gia (${joined.length})`}]} />
    <div className="my-community-content" aria-busy={loading}>
      {loading ? <div role="status" className="community-empty"><Loader2 size={24} className="animate-spin motion-reduce:animate-none" /><p>Đang tải cộng đồng của bạn…</p></div> : failed ? <div role="alert" className="community-empty"><h2>Không tải được cộng đồng của bạn</h2><p>Kiểm tra kết nối rồi thử lại.</p><Button variant="secondary" size="sm" onClick={() => setRetry((count) => count + 1)}>Thử lại</Button></div> : displayed.length ? <div className="community-directory" key={tab}>{displayed.map((community) => {
        const ownedByUser = owned.some((item) => item.id === community.id);
        return <CommunityCard key={community.id} community={ownedByUser ? {...community, currentUserRole:'OWNER'} : community} variant="mine" leaving={leaving.includes(community.name)} onLeave={() => handleLeave(community.name, community.displayName || community.name)} />;
      })}</div> : <div className="community-empty"><Users size={28} aria-hidden="true" /><h2>{tab === 'owned' ? 'Bạn chưa làm chủ cộng đồng nào.' : 'Bạn chưa tham gia cộng đồng nào.'}</h2><p>Hãy khám phá và tìm những cộng đồng phù hợp với sở thích của bạn.</p><Link to={tab === 'owned' ? '/communities/create' : '/explore'}><Button size="sm" leftIcon={tab === 'owned' ? <Plus size={16} /> : <Compass size={16} />}>{tab === 'owned' ? 'Tạo cộng đồng' : 'Khám phá cộng đồng'}</Button></Link></div>}
    </div>
  </div>;
}
