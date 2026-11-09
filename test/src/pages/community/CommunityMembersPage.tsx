import React, { useState } from 'react';
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

  const { communities, members, updateMemberRole, banMember } = useCommunityStore();
  const { activeRole } = useAuthStore();
  const { addToast } = useToastStore();

  const [searchMember, setSearchMember] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'OWNER' | 'MODERATOR' | 'MEMBER'>('ALL');

  const community = communities.find((c) => c.name === communityName);
  const memberList = members[communityName || ''] || members['lap-trinh-viet-nam'] || [];

  if (!community) {
    return <div className="p-12 text-center text-xs">Cộng đồng không tồn tại.</div>;
  }

  const isOwner = community.currentUserRole === 'OWNER' || activeRole === 'ADMIN';

  const filteredMembers = memberList.filter((m) => {
    const matchesSearch =
      m.displayName.toLowerCase().includes(searchMember.toLowerCase()) ||
      m.username.toLowerCase().includes(searchMember.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handlePromoteMod = (memberId: string, username: string) => {
    updateMemberRole(community.name, memberId, 'MODERATOR');
    addToast(`Đã bổ nhiệm @${username} làm Kiểm duyệt viên (Mod)!`, 'success');
  };

  const handleDemoteMod = (memberId: string, username: string) => {
    updateMemberRole(community.name, memberId, 'MEMBER');
    addToast(`Đã gỡ quyền Kiểm duyệt viên của @${username}.`, 'info');
  };

  const handleBanMember = (memberId: string, username: string) => {
    banMember(community.name, memberId);
    addToast(`Đã chặn tài khoản @${username} khỏi cộng đồng.`, 'warning');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left pb-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/c/${community.name}`)}
            className="p-2 rounded-xl bg-[#191A1C] border border-[#303235] text-[#9A9DA3] hover:text-[#F5F5F5] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FF5700]" />
              <span>Thành viên cộng đồng c/{community.name}</span>
            </h1>
            <p className="text-xs text-[#9A9DA3] mt-0.5">
              Danh sách thành viên, ban kiểm duyệt và quản lý quyền hạn
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            value={searchMember}
            onChange={(e) => setSearchMember(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            placeholder="Tìm theo tên hiển thị hoặc @username..."
            className="bg-[#191A1C]"
          />
        </div>

        {/* Role filter chips */}
        <div className="flex items-center gap-1.5 shrink-0">
          {(['ALL', 'OWNER', 'MODERATOR', 'MEMBER'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                roleFilter === r
                  ? 'bg-[#FF5700]/15 text-[#FF5700] border border-[#FF5700]/30 font-bold'
                  : 'bg-[#191A1C] border border-[#303235] text-[#9A9DA3] hover:text-[#F5F5F5]'
              }`}
            >
              {r === 'ALL' ? 'Tất cả' : r === 'OWNER' ? 'Chủ nhóm' : r === 'MODERATOR' ? 'Mod' : 'Thành viên'}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table / List */}
      <div className="bg-[#191A1C] border border-[#303235] rounded-3xl overflow-hidden shadow-xl">
        <div className="divide-y divide-[#303235]/60">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#1E2023] transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <Avatar src={member.avatarUrl} alt={member.displayName} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/u/${member.username}`}
                      className="text-xs sm:text-sm font-bold text-[#F5F5F5] hover:text-[#FF5700] transition-colors"
                    >
                      {member.displayName}
                    </Link>
                    <Badge role={member.role} size="sm" />
                    {member.status === 'BANNED' && (
                      <span className="text-[10px] text-[#EF4444] bg-[#EF4444]/15 px-1.5 py-0.5 rounded font-bold">
                        ĐÃ BỊ CHẶN
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#70747C]">
                    @{member.username} · Tham gia {member.joinedAt}
                  </div>
                </div>
              </div>

              {/* Owner actions */}
              {isOwner && member.role !== 'OWNER' && (
                <div className="flex items-center gap-2">
                  {member.role === 'MEMBER' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePromoteMod(member.id, member.username)}
                      leftIcon={<ShieldPlus className="w-3.5 h-3.5 text-[#3B82F6]" />}
                    >
                      Bổ nhiệm Mod
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDemoteMod(member.id, member.username)}
                      leftIcon={<ShieldMinus className="w-3.5 h-3.5 text-[#F59E0B]" />}
                    >
                      Gỡ Mod
                    </Button>
                  )}

                  {member.status !== 'BANNED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBanMember(member.id, member.username)}
                      className="text-[#EF4444] hover:bg-[#EF4444]/10"
                      title="Chặn khỏi cộng đồng"
                    >
                      <UserX className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}

          {filteredMembers.length === 0 && (
            <div className="py-16 text-center text-xs text-[#70747C]">
              Không tìm thấy thành viên nào phù hợp với tìm kiếm.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityMembersPage;
