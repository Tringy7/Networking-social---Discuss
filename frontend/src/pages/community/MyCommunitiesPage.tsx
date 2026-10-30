import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Users, Plus, Settings, LogOut, Compass } from 'lucide-react';

export const MyCommunitiesPage: React.FC = () => {
  const { communities, leaveCommunity, hydrateMine } = useCommunityStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [tab, setTab] = useState<'all' | 'owned' | 'joined'>('all');

  useEffect(() => {
    if (!user) return;
    hydrateMine().catch((error: unknown) => {
      addToast(error instanceof Error ? error.message : 'Không thể tải cộng đồng của bạn.', 'error');
    });
  }, [addToast, hydrateMine, user]);

  const ownedList = communities.filter(
    (c) => c.ownerUsername === user?.username || c.currentUserRole === 'OWNER'
  );

  const joinedList = communities.filter(
    (c) => c.currentUserRole === 'MEMBER' || c.currentUserRole === 'MODERATOR'
  );

  const displayedList =
    tab === 'owned' ? ownedList : tab === 'joined' ? joinedList : [...ownedList, ...joinedList];

  const handleLeave = async (cName: string, dName: string) => {
    try {
      await leaveCommunity(cName);
      addToast(`Đã rời khỏi cộng đồng ${dName}`, 'info');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể rời cộng đồng.', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#FF5700]" />
            <span>Cộng đồng của tôi</span>
          </h1>
          <p className="text-xs text-[#9A9DA3] mt-0.5">
            Quản lý các cộng đồng bạn đang sở hữu và các nhóm bạn đã tham gia
          </p>
        </div>

        <Link to="/communities/create">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Tạo cộng đồng mới
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#303235] pb-2 text-xs font-semibold">
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${
            tab === 'all'
              ? 'bg-[#FF5700]/15 text-[#FF5700] border border-[#FF5700]/30 font-bold'
              : 'text-[#9A9DA3] hover:text-[#F5F5F5]'
          }`}
        >
          Tất cả ({ownedList.length + joinedList.length})
        </button>
        <button
          onClick={() => setTab('owned')}
          className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${
            tab === 'owned'
              ? 'bg-[#FF5700]/15 text-[#FF5700] border border-[#FF5700]/30 font-bold'
              : 'text-[#9A9DA3] hover:text-[#F5F5F5]'
          }`}
        >
          Đang làm chủ ({ownedList.length})
        </button>
        <button
          onClick={() => setTab('joined')}
          className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${
            tab === 'joined'
              ? 'bg-[#FF5700]/15 text-[#FF5700] border border-[#FF5700]/30 font-bold'
              : 'text-[#9A9DA3] hover:text-[#F5F5F5]'
          }`}
        >
          Đã tham gia ({joinedList.length})
        </button>
      </div>

      {/* Community List */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {displayedList.map((comm) => {
          const isOwner = comm.currentUserRole === 'OWNER' || comm.ownerUsername === user?.username;

          return (
            <div
              key={comm.id}
              className="flex min-w-0 flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 transition-all hover:border-[var(--color-orange-border)]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar src={comm.avatarUrl} alt={comm.displayName} size="md" shape="rounded" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/community/${comm.name}`}
                      className="truncate text-sm font-bold text-[var(--text-primary)] transition-colors hover:text-[var(--color-orange)]"
                    >
                      {comm.displayName}
                    </Link>
                    {isOwner ? (
                      <Badge role="OWNER" size="sm" />
                    ) : comm.currentUserRole === 'MODERATOR' ? (
                      <Badge role="MODERATOR" size="sm" />
                    ) : (
                      <Badge role="MEMBER" size="sm" />
                    )}
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[11px] text-[var(--text-muted)]">community/{comm.name}</div>
                </div>
              </div>

              <p className="mt-3 min-h-10 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">{comm.description || 'Chưa có mô tả cộng đồng.'}</p>
              <div className="mt-3 flex items-center justify-between border-t border-[var(--border-color)] pt-3 text-[11px] text-[var(--text-muted)]">
                <span className="truncate">{comm.category}</span>
                <span className="shrink-0">{comm.memberCount} thành viên</span>
              </div>

              {/* Actions */}
              <div className="mt-3 flex items-center justify-end gap-2 border-t border-[var(--border-color)] pt-3">
                {isOwner ? (
                  <Link to={`/community/${comm.name}/settings`}>
                    <Button variant="secondary" size="sm" leftIcon={<Settings className="w-3.5 h-3.5" />}>
                      Cài đặt nhóm
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLeave(comm.name, comm.displayName)}
                    className="text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                    leftIcon={<LogOut className="w-3.5 h-3.5" />}
                  >
                    Rời nhóm
                  </Button>
                )}

                <Link to={`/community/${comm.name}`}>
                  <Button variant="primary" size="sm">
                    Truy cập
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}

        {displayedList.length === 0 && (
          <div className="py-20 text-center bg-[#191A1C] border border-[#303235] rounded-3xl p-8 space-y-4">
            <Users className="w-10 h-10 text-[#FF5700] mx-auto opacity-60" />
            <h3 className="text-base font-bold text-[#F5F5F5]">Chưa có cộng đồng nào trong mục này</h3>
            <p className="text-xs text-[#9A9DA3]">
              Hãy khám phá các cộng đồng đang hoạt động sôi nổi hoặc tạo nhóm của riêng bạn.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/explore">
                <Button variant="secondary" size="sm" leftIcon={<Compass className="w-4 h-4" />}>
                  Khám phá ngay
                </Button>
              </Link>
              <Link to="/communities/create">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Tạo cộng đồng
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCommunitiesPage;
