import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Crown, Search, ShieldMinus, ShieldPlus, UserX } from 'lucide-react';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import type { Community, CommunityMember } from '../../types';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ConfirmDialog from '../ui/ConfirmDialog';

const roles = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'OWNER', label: 'Chủ nhóm' },
  { value: 'MODERATOR', label: 'Kiểm duyệt viên' },
  { value: 'MEMBER', label: 'Thành viên' },
] as const;

function joinedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
}

export default function CommunityMembersPanel({ community }: { community: Community }) {
  const memberList = useCommunityStore((state) => state.members[community.name]) || [];
  const hydrateMembers = useCommunityStore((state) => state.hydrateMembers);
  const user = useAuthStore((state) => state.user);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const notify = useToastStore((state) => state.addToast);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<typeof roles[number]['value']>('ALL');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const navigate = useNavigate();
  const [transferTarget, setTransferTarget] = useState<CommunityMember | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true); setFailed(false);
    hydrateMembers(community.name).catch(() => { if (active) setFailed(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [community.name, hydrateMembers, attempt]);

  const ownMembership = memberList.find((member) => member.username === user?.username);
  const isOwner = authenticated && ownMembership?.role === 'OWNER';
  const search = query.trim().toLocaleLowerCase('vi-VN').replace(/^@/, '');
  const filtered = memberList.filter((member) => (roleFilter === 'ALL' || member.role === roleFilter)
    && `${member.displayName} ${member.username}`.toLocaleLowerCase('vi-VN').includes(search));

  const act = async (member: CommunityMember, action: 'promote' | 'demote' | 'kick' | 'transfer') => {
    if (!isOwner || pending.current) return;
    pending.current = true; setBusy(true);
    const store = useCommunityStore.getState();
    try {
      if (action === 'promote' || action === 'demote') {
        await store.updateMemberRole(community.name, member.username, action === 'promote' ? 'MODERATOR' : 'MEMBER');
        notify(action === 'promote' ? `Đã bổ nhiệm @${member.username} làm kiểm duyệt viên.` : `Đã gỡ quyền kiểm duyệt viên của @${member.username}.`, 'success');
      } else if (action === 'kick') {
        await store.kickMember(community.name, member.username);
        await store.hydrateCommunity(community.name);
        notify(`Đã xóa @${member.username} khỏi cộng đồng.`, 'success');
      } else {
        await store.transferOwnership(community.name, member.username);
        setTransferTarget(null);
        notify(`Đã chuyển quyền chủ cộng đồng cho @${member.username}. Bạn hiện là moderator.`, 'success');
        navigate(`/c/${community.name}`, { replace: true });
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể cập nhật thành viên. Hãy thử lại.', 'error');
    } finally { pending.current = false; setBusy(false); }
  };

  return <div className="community-settings-members">
    <div className="community-members-toolbar">
      <Input aria-label="Tìm thành viên" value={query} onChange={(event) => setQuery(event.target.value)}
        leftIcon={<Search size={16} />} placeholder="Tìm tên hoặc @username…" />
      <div className="community-members-filters" aria-label="Lọc vai trò thành viên">
        {roles.map(({ value, label }) => <button key={value} type="button" aria-pressed={roleFilter === value}
          onClick={() => setRoleFilter(value)}>{label}</button>)}
      </div>
    </div>
    {!loading && !failed && <div className="community-members-summary"><span>{filtered.length.toLocaleString('vi-VN')} / {memberList.length.toLocaleString('vi-VN')} thành viên</span><span>{isOwner ? 'Thay đổi thành viên được áp dụng ngay.' : 'Chỉ chủ cộng đồng được quản lý quyền thành viên.'}</span></div>}
    <div className="community-members-list" aria-busy={loading || busy}>
      {loading ? <p className="community-members-empty" role="status">Đang tải danh sách thành viên…</p>
        : failed ? <div className="community-members-empty" role="alert"><p>Không thể tải danh sách thành viên.</p><Button type="button" variant="secondary" size="sm" onClick={() => setAttempt((value) => value + 1)}>Thử lại</Button></div>
        : !filtered.length ? <p className="community-members-empty">{query || roleFilter !== 'ALL' ? 'Không tìm thấy thành viên phù hợp.' : 'Cộng đồng chưa có thành viên để hiển thị.'}</p>
        : filtered.map((member) => <div key={member.id} className="community-members-row">
          <div className="community-members-person"><Avatar src={member.avatarUrl} alt={member.displayName} size="md" /><div>
            <div className="community-members-person-name"><Link to={`/u/${member.username}`}>{member.displayName}</Link><Badge role={member.role} size="sm" /></div>
            <p>@{member.username} · Tham gia {joinedDate(member.joinedAt)}</p>
          </div></div>
          {isOwner && member.role !== 'OWNER' && <div className="community-members-actions">
            <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void act(member, member.role === 'MEMBER' ? 'promote' : 'demote')}
              leftIcon={member.role === 'MEMBER' ? <ShieldPlus size={14} /> : <ShieldMinus size={14} />}>{member.role === 'MEMBER' ? 'Bổ nhiệm Mod' : 'Gỡ Mod'}</Button>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void act(member, 'kick')} aria-label={`Xóa @${member.username} khỏi cộng đồng`} title="Xóa khỏi cộng đồng" className="community-members-kick"><UserX size={16} /></Button>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setTransferTarget(member)} aria-label={`Chuyển quyền chủ cho @${member.username}`} title="Chuyển quyền chủ"><Crown size={16} /></Button>
          </div>}
        </div>)}
    </div>
    {createPortal(<ConfirmDialog
      isOpen={transferTarget !== null}
      onClose={() => { if (!pending.current) setTransferTarget(null); }}
      onConfirm={() => { if (transferTarget) void act(transferTarget, 'transfer'); }}
      title="Chuyển quyền chủ cộng đồng?"
      message={`Bạn sẽ chuyển quyền chủ cộng đồng cho @${transferTarget?.username ?? ''} và trở thành kiểm duyệt viên. Sau khi chuyển thành công, bạn sẽ trở về trang cộng đồng.`}
      confirmLabel="Xác nhận chuyển quyền"
      variant="primary"
      isLoading={busy}
    />, document.body)}
  </div>;
}
