import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ArrowLeft, Users, Search, Shield, UserX, Crown, ShieldPlus, ShieldMinus } from 'lucide-react';

export const CommunityMembersPage: React.FC = () => {
  const { communityName } = useParams<{ communityName: string }>();
  const navigate = useNavigate();

  const { communities, members, updateMemberRole, kickMember, transferOwnership, hydrateMembers, hydrateCommunity } = useCommunityStore();
  const { activeRole } = useAuthStore();
  const { addToast } = useToastStore();

  const [searchMember, setSearchMember] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'OWNER' | 'MODERATOR' | 'MEMBER'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!communityName) return;
    let active = true;
    setIsLoading(true);
    setLoadFailed(false);
    hydrateCommunity(communityName).catch((error: unknown) => {
      if (!active) return;
      setLoadFailed(true);
      addToast(error instanceof Error ? error.message : 'Không thể tải cộng đồng.', 'error');
    });
    hydrateMembers(communityName)
      .catch((error: unknown) => {
        if (!active) return;
        setLoadFailed(true);
        addToast(error instanceof Error ? error.message : 'Không thể tải danh sách thành viên.', 'error');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [addToast, communityName, hydrateMembers, hydrateCommunity]);

  const community = communities.find((c) => c.name === communityName);
  const memberList = members[communityName || ''] || members['lap-trinh-viet-nam'] || [];

  if (!community) {
    return (
      <section className="mx-auto flex min-h-64 max-w-xl flex-col items-center justify-center gap-4 px-4 py-16 text-center" aria-live="polite">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
          {loadFailed ? 'Không tải được danh sách thành viên' : isLoading ? 'Đang tải cộng đồng' : 'Không tìm thấy cộng đồng'}
        </h1>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          {loadFailed ? 'Hãy thử tải lại hoặc quay về trang cộng đồng.' : `community/${communityName || ''}`}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {loadFailed && communityName && <Button variant="secondary" size="sm" onClick={() => {
            setIsLoading(true);
            setLoadFailed(false);
            Promise.all([hydrateCommunity(communityName), hydrateMembers(communityName)])
              .catch((error: unknown) => {
                setLoadFailed(true);
                addToast(error instanceof Error ? error.message : 'Không thể tải danh sách thành viên.', 'error');
              })
              .finally(() => setIsLoading(false));
          }}>Thử lại</Button>}
          <Link to={communityName ? `/community/${communityName}` : '/explore'}>
            <Button variant="primary" size="sm">Quay lại cộng đồng</Button>
          </Link>
        </div>
      </section>
    );
  }

  const isOwner = community.currentUserRole === 'OWNER' || activeRole === 'ADMIN';

  const filteredMembers = memberList.filter((m) => {
    const matchesSearch =
      m.displayName.toLowerCase().includes(searchMember.toLowerCase()) ||
      m.username.toLowerCase().includes(searchMember.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handlePromoteMod = async (username: string) => {
    try {
      await updateMemberRole(community.name, username, 'MODERATOR');
      addToast(`Đã bổ nhiệm @${username} làm Kiểm duyệt viên (Mod)!`, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể cập nhật quyền thành viên.', 'error');
    }
  };

  const handleDemoteMod = async (username: string) => {
    try {
      await updateMemberRole(community.name, username, 'MEMBER');
      addToast(`Đã gỡ quyền Kiểm duyệt viên của @${username}.`, 'info');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể cập nhật quyền thành viên.', 'error');
    }
  };

  const handleKickMember = async (username: string) => {
    try {
      await kickMember(community.name, username);
      addToast(`Đã xóa @${username} khỏi cộng đồng.`, 'warning');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể xóa thành viên.', 'error');
    }
  };

  const handleTransferOwnership = async (username: string) => {
    if (!window.confirm(`Chuyển quyền chủ cộng đồng cho @${username}?`)) return;
    try {
      await transferOwnership(community.name, username);
      addToast(`Đã chuyển quyền chủ cho @${username}.`, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể chuyển quyền sở hữu.', 'error');
    }
  };

  return (
    <div className="utility-page space-y-5 text-left pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/community/${community.name}`)}
            aria-label="Quay lại cộng đồng"
            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-sm font-medium text-[var(--text-muted)]">community/{community.name}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--color-orange-ink)]" />
              <span>Thành viên</span>
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Danh sách thành viên, ban kiểm duyệt và quản lý quyền hạn
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 w-full">
          <Input
            value={searchMember}
            onChange={(e) => setSearchMember(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            placeholder="Tìm theo tên hiển thị hoặc @username..."
            className="bg-[var(--bg-main)]"
          />
        </div>

        {/* Role filter chips */}
        <div className="flex max-w-full shrink-0 items-center gap-1.5 overflow-x-auto pb-1">
          {(['ALL', 'OWNER', 'MODERATOR', 'MEMBER'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                roleFilter === r
                  ? 'bg-[var(--color-orange-soft)] text-[var(--color-orange-ink)] font-semibold'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              {r === 'ALL' ? 'Tất cả' : r === 'OWNER' ? 'Chủ nhóm' : r === 'MODERATOR' ? 'Mod' : 'Thành viên'}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table / List */}
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-color)] bg-[var(--bg-surface)]">
        <div className="divide-y divide-[var(--border-color)]">
          {isLoading ? (
            <div role="status" className="px-5 py-12 text-center text-sm text-[var(--text-secondary)]">Đang tải danh sách thành viên…</div>
          ) : loadFailed ? (
            <div role="alert" className="flex flex-col items-center gap-3 px-5 py-12 text-center">
              <p className="text-sm text-[var(--text-secondary)]">Không thể tải danh sách thành viên.</p>
              <Button variant="secondary" size="sm" onClick={() => {
                setIsLoading(true);
                setLoadFailed(false);
                Promise.all([hydrateCommunity(community.name), hydrateMembers(community.name)])
                  .catch((error: unknown) => {
                    setLoadFailed(true);
                    addToast(error instanceof Error ? error.message : 'Không thể tải danh sách thành viên.', 'error');
                  })
                  .finally(() => setIsLoading(false));
              }}>Thử lại</Button>
            </div>
          ) : filteredMembers.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-3 p-4 transition-colors hover:bg-[var(--bg-hover)] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5"
            >
              <div className="flex items-center gap-3.5">
                <Avatar src={member.avatarUrl} alt={member.displayName} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/user/${member.username}`}
                      className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--color-orange-ink)] transition-colors"
                    >
                      {member.displayName}
                    </Link>
                    <Badge role={member.role} size="sm" />
                    {member.status === 'BANNED' && (
                      <span className="rounded-md bg-[var(--color-danger)]/10 px-2 py-1 text-xs font-semibold text-[var(--color-danger)]">
                        ĐÃ BỊ CHẶN
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    @{member.username} · Tham gia {member.joinedAt}
                  </div>
                </div>
              </div>

              {/* Owner actions */}
              {isOwner && member.role !== 'OWNER' && (
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {member.role === 'MEMBER' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePromoteMod(member.username)}
                      leftIcon={<ShieldPlus className="w-3.5 h-3.5 text-[var(--color-orange-ink)]" />}
                    >
                      Bổ nhiệm Mod
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDemoteMod(member.username)}
                      leftIcon={<ShieldMinus className="w-3.5 h-3.5 text-[var(--color-warning)]" />}
                    >
                      Gỡ Mod
                    </Button>
                  )}

                  {member.status !== 'BANNED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleKickMember(member.username)}
                      className="text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                      title="Xóa khỏi cộng đồng"
                    >
                      <UserX className="w-4 h-4" />
                    </Button>
                  )}
                  {isOwner && <Button variant="ghost" size="sm" onClick={() => handleTransferOwnership(member.username)} title="Chuyển quyền chủ"><Crown className="w-4 h-4" /></Button>}
                </div>
              )}
            </div>
          ))}

          {!isLoading && !loadFailed && filteredMembers.length === 0 && (
            <div className="py-16 px-5 text-center text-sm text-[var(--text-secondary)]">
              {searchMember || roleFilter !== 'ALL' ? 'Không tìm thấy thành viên phù hợp với bộ lọc.' : 'Chưa có thành viên để hiển thị.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityMembersPage;
