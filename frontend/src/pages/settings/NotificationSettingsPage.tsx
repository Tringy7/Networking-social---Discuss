import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CommunityNotificationToggle from '../../components/community/CommunityNotificationToggle';
import Button from '../../components/ui/Button';
import { communityService } from '../../services';
import { useAuthStore } from '../../store/useAuthStore';
import type { Community } from '../../types';

export default function NotificationSettingsPage() {
  const username = useAuthStore((state) => state.user?.username);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!username) return;
    let active = true;
    setLoading(true);
    setError('');
    communityService.mine()
      .then((items) => {
        if (active) setCommunities([...new Map(items.map((item) => [item.name, item])).values()]);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Không thể tải cộng đồng của bạn.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [username, attempt]);

  return (
    <section className="space-y-4 text-left" aria-busy={loading}>
      <h2 className="text-lg font-semibold">Thông báo bài mới</h2>
      <p className="text-sm text-[var(--text-secondary)]">Chọn cộng đồng bạn muốn nhận thông báo khi có bài viết mới.</p>

      {loading ? <p role="status" className="text-sm">Đang tải cộng đồng…</p> : error ? (
        <div className="space-y-2">
          <p role="alert" className="text-sm">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => setAttempt((value) => value + 1)}>Thử lại</Button>
        </div>
      ) : communities.length === 0 ? (
        <p className="text-sm">Bạn chưa tham gia cộng đồng nào. <Link to="/explore" className="underline">Khám phá cộng đồng</Link></p>
      ) : (
        <ul className="space-y-2">
          {communities.map((community) => (
            <li key={community.name} className="setting-group flex flex-wrap items-center justify-between gap-3">
              <Link to={'/c/' + encodeURIComponent(community.name)} className="break-all text-sm font-semibold hover:underline">
                {community.displayName || 'c/' + community.name}
              </Link>
              <CommunityNotificationToggle name={community.name} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
