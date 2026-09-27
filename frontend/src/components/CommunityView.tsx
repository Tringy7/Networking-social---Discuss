import React, { useState } from 'react';
import { Community } from '../types';
import { useApp } from '../context/AppContext';
import { PostCard } from './PostCard';
import {
  Users,
  Shield,
  Crown,
  UserCheck,
  UserX,
  UserMinus,
  Settings,
  AlertOctagon,
  LogOut,
  UserPlus,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Plus,
  Save,
  Trash2,
  ShieldAlert,
} from 'lucide-react';

interface CommunityViewProps {
  community: Community;
  onOpenReportPost: (postId: string) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ community, onOpenReportPost }) => {
  const {
    currentUser,
    users,
    members,
    posts,
    reports,
    getUserCommunityRole,
    isUserBannedInCommunity,
    joinCommunity,
    leaveCommunity,
    updateCommunity,
    transferOwnership,
    setModeratorRole,
    kickMember,
    toggleBanMember,
    resolveReport,
    setIsCreatePostOpen,
    searchQuery,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'posts' | 'members' | 'modqueue' | 'settings'>('posts');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetUserId, setTransferTargetUserId] = useState('');

  // Settings form state (Function #10)
  const [editDesc, setEditDesc] = useState(community.description);
  const [editIcon, setEditIcon] = useState(community.icon);
  const [editBanner, setEditBanner] = useState(community.banner);
  const [editRules, setEditRules] = useState(community.rules.join('\n'));
  const [settingsMessage, setSettingsMessage] = useState('');

  const currentRole = currentUser ? getUserCommunityRole(community.id, currentUser.id) : null;
  const isBanned = currentUser ? isUserBannedInCommunity(community.id, currentUser.id) : false;
  const isGlobalAdmin = currentUser?.globalRole === 'ADMIN';
  const isOwner = currentRole === 'OWNER';
  const isMod = currentRole === 'MODERATOR';
  const canManage = isOwner || isGlobalAdmin;
  const canModerate = isOwner || isMod || isGlobalAdmin;

  // Filter posts of this community
  const communityPosts = posts.filter(
    (p) =>
      p.communityId === community.id &&
      !p.isDeleted &&
      (searchQuery
        ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.content.toLowerCase().includes(searchQuery.toLowerCase())
        : true)
  );

  // Community members
  const communityMembers = members.filter((m) => m.communityId === community.id);
  const ownerUser = users.find((u) => u.id === community.ownerId);

  // Reports for this community
  const communityReports = reports.filter((r) => {
    const post = posts.find((p) => p.id === r.postId);
    return post?.communityId === community.id;
  });
  const pendingReports = communityReports.filter((r) => r.status === 'PENDING');

  const handleJoin = () => {
    const res = joinCommunity(community.id);
    if (!res.success) alert(res.message);
  };

  const handleLeave = () => {
    const res = leaveCommunity(community.id);
    if (!res.success) {
      if (isOwner) {
        // Trigger transfer modal
        if (confirm(`${res.message}\n\nBạn có muốn chuyển giao quyền Owner cho thành viên khác ngay bây giờ không?`)) {
          setShowTransferModal(true);
        }
      } else {
        alert(res.message);
      }
    } else {
      alert(res.message);
    }
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetUserId) {
      alert('Vui lòng chọn thành viên nhận quyền Owner.');
      return;
    }
    const res = transferOwnership(community.id, transferTargetUserId);
    alert(res.message);
    if (res.success) {
      setShowTransferModal(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const rulesArray = editRules
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const res = updateCommunity(community.id, {
      description: editDesc.trim(),
      icon: editIcon.trim(),
      banner: editBanner.trim(),
      rules: rulesArray,
    });
    setSettingsMessage(res.message);
    setTimeout(() => setSettingsMessage(''), 4000);
  };

  return (
    <div className="space-y-4">
      {/* Banner & Community Header (Function #6) */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs">
        {/* Banner image */}
        <div className="h-32 sm:h-44 w-full relative bg-slate-800 overflow-hidden">
          <img
            src={community.banner}
            alt={community.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
          {community.isLocked && (
            <div className="absolute top-3 right-3 bg-red-600/90 text-white text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-md">
              <Lock className="w-3.5 h-3.5" />
              <span>Cộng đồng đã bị Admin khóa</span>
            </div>
          )}
        </div>

        {/* Community info row */}
        <div className="p-4 sm:p-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
            <div className="flex items-end gap-3 sm:gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-3xl sm:text-4xl shrink-0">
                {community.icon}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {community.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">c/{community.slug}</p>
              </div>
            </div>

            {/* Action buttons (Join / Leave / Post) */}
            <div className="flex items-center gap-2 flex-wrap">
              {isBanned ? (
                <div className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Bạn đã bị Ban trong cộng đồng này</span>
                </div>
              ) : currentRole ? (
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                      isOwner
                        ? 'bg-amber-100 text-amber-800'
                        : isMod
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isOwner ? <Crown className="w-3 h-3" /> : isMod ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                    <span>{currentRole}</span>
                  </span>

                  {/* Leave community button */}
                  <button
                    id="leave-community-btn"
                    onClick={handleLeave}
                    className="px-3 py-1.5 border border-slate-300 hover:border-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl text-xs font-semibold text-slate-600 transition flex items-center gap-1 cursor-pointer"
                    title={isOwner ? 'Owner cần chuyển quyền trước khi rời cộng đồng' : 'Rời Community'}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Rời</span>
                  </button>
                </div>
              ) : (
                /* Join community button */
                <button
                  id="join-community-btn"
                  onClick={handleJoin}
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Tham gia</span>
                </button>
              )}

              {/* Create post in community */}
              <button
                id="comm-create-post-btn"
                onClick={() => setIsCreatePostOpen(true)}
                disabled={isBanned || community.isLocked}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Đăng bài</span>
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl mb-4">
            {community.description}
          </p>

          {/* Quick stats & rules bar */}
          <div className="flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100 flex-wrap">
            <div className="flex items-center gap-1 font-semibold text-slate-700">
              <Users className="w-4 h-4 text-slate-400" />
              <span>{communityMembers.length} thành viên</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-slate-700">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>{communityPosts.length} bài viết</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Chủ sở hữu:</span>
              <strong className="text-slate-800 font-semibold">u/{ownerUser?.username || 'user'}</strong>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-slate-200 bg-slate-50/70 px-4 sm:px-6 overflow-x-auto text-xs sm:text-sm font-medium">
          <button
            id="tab-posts-btn"
            onClick={() => setActiveTab('posts')}
            className={`py-3 px-4 border-b-2 font-semibold transition shrink-0 ${
              activeTab === 'posts'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Bài viết ({communityPosts.length})
          </button>

          <button
            id="tab-members-btn"
            onClick={() => setActiveTab('members')}
            className={`py-3 px-4 border-b-2 font-semibold transition shrink-0 ${
              activeTab === 'members'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Thành viên & Phân quyền ({communityMembers.length})
          </button>

          {canModerate && (
            <button
              id="tab-modqueue-btn"
              onClick={() => setActiveTab('modqueue')}
              className={`py-3 px-4 border-b-2 font-semibold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === 'modqueue'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Báo cáo & Kiểm duyệt</span>
              {pendingReports.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {pendingReports.length}
                </span>
              )}
            </button>
          )}

          {canManage && (
            <button
              id="tab-settings-btn"
              onClick={() => setActiveTab('settings')}
              className={`py-3 px-4 border-b-2 font-semibold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Cài đặt Community</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Contents */}
      {/* TAB 1: Posts */}
      {activeTab === 'posts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Posts column */}
          <div className="lg:col-span-2 space-y-3">
            {communityPosts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">Chưa có bài viết nào trong cộng đồng này.</p>
                <p className="text-xs text-slate-400">Hãy là người đầu tiên chia sẻ nội dung thảo luận!</p>
                <button
                  onClick={() => setIsCreatePostOpen(true)}
                  disabled={isBanned || community.isLocked}
                  className="mt-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold"
                >
                  Đăng bài viết ngay
                </button>
              </div>
            ) : (
              communityPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onOpenReport={() => onOpenReportPost(post.id)}
                />
              ))
            )}
          </div>

          {/* Right column: Community Rules & About widget */}
          <div className="space-y-4">
            {/* Rules card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-orange-600" />
                <span>Nội quy cộng đồng</span>
              </h3>
              <ol className="space-y-2 text-xs text-slate-600 list-decimal list-inside">
                {community.rules.map((rule, idx) => (
                  <li key={idx} className="leading-relaxed pl-1">
                    <span className="text-slate-800 font-medium">{rule}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Moderators widget */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-sky-600" />
                <span>Ban điều hành</span>
              </h3>
              <div className="space-y-2 text-xs">
                {/* Owner */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">u/{ownerUser?.username}</span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-bold">Owner</span>
                </div>
                {/* Mods */}
                {communityMembers
                  .filter((m) => m.role === 'MODERATOR')
                  .map((m) => {
                    const modUser = users.find((u) => u.id === m.userId);
                    return (
                      <div key={m.userId} className="flex items-center justify-between">
                        <span className="text-slate-700">u/{modUser?.username}</span>
                        <span className="bg-sky-100 text-sky-800 text-[10px] px-1.5 py-0.5 rounded font-bold">Mod</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Members & Roles */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Danh sách thành viên & Quản lý vai trò
              </h2>
              <p className="text-xs text-slate-500">
                Quản lý phân quyền Community Role: <strong>Owner</strong>, <strong>Moderator</strong>, <strong>Member</strong>.
              </p>
            </div>

            {/* If Owner: Transfer Ownership button */}
            {canManage && (
              <button
                id="transfer-ownership-open-btn"
                onClick={() => setShowTransferModal(true)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Chuyển quyền Owner</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Thành viên</th>
                  <th className="py-2.5 px-3">Vai trò trong Community</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3">Ngày tham gia</th>
                  <th className="py-2.5 px-3 text-right">Thao tác quyền hạn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {communityMembers.map((member) => {
                  const user = users.find((u) => u.id === member.userId);
                  if (!user) return null;
                  const isCurrent = user.id === currentUser?.id;
                  const isTargetOwner = member.role === 'OWNER';
                  const isTargetMod = member.role === 'MODERATOR';

                  return (
                    <tr key={member.userId} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={user.avatar}
                            alt={user.displayName}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-bold text-slate-800">
                              {user.displayName} {isCurrent && <span className="text-orange-600">(Bạn)</span>}
                            </p>
                            <p className="text-[11px] text-slate-400">u/{user.username}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            member.role === 'OWNER'
                              ? 'bg-amber-100 text-amber-800'
                              : member.role === 'MODERATOR'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {member.role === 'OWNER' && <Crown className="w-2.5 h-2.5" />}
                          {member.role === 'MODERATOR' && <Shield className="w-2.5 h-2.5" />}
                          {member.role === 'MEMBER' && <UserCheck className="w-2.5 h-2.5" />}
                          <span>{member.role}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {member.isBanned ? (
                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            Bị cấm (Banned)
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            Hoạt động
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {new Date(member.joinedAt).toLocaleDateString('vi-VN')}
                      </td>

                      {/* Management actions (Functions #11, #12, #13) */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Function #11: Gán / Xóa Moderator (Owner or Admin) */}
                          {canManage && !isTargetOwner && (
                            <button
                              id={`toggle-mod-btn-${user.id}`}
                              onClick={() => {
                                const res = setModeratorRole(community.id, user.id, !isTargetMod);
                                alert(res.message);
                              }}
                              className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                                isTargetMod
                                  ? 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                              title="Gán/Xóa Moderator"
                            >
                              {isTargetMod ? 'Hủy quyền Mod' : 'Thăng cấp Mod'}
                            </button>
                          )}

                          {/* Ban / Unban thành viên */}
                          {canModerate && !isTargetOwner && (
                            <button
                              id={`toggle-ban-btn-${user.id}`}
                              onClick={() => {
                                const res = toggleBanMember(community.id, user.id);
                                alert(res.message);
                              }}
                              className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                                member.isBanned
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-red-50 text-red-600 hover:bg-red-100'
                              }`}
                              title={member.isBanned ? 'Gỡ Ban' : 'Ban thành viên'}
                            >
                              <UserX className="w-3 h-3 inline mr-1" />
                              {member.isBanned ? 'Gỡ Ban' : 'Ban'}
                            </button>
                          )}

                          {/* Kick thành viên */}
                          {canModerate && !isTargetOwner && (
                            <button
                              id={`kick-btn-${user.id}`}
                              onClick={() => {
                                if (confirm(`Kick thành viên u/${user.username} khỏi ${community.name}?`)) {
                                  const res = kickMember(community.id, user.id);
                                  alert(res.message);
                                }
                              }}
                              className="px-2 py-1 bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded text-[11px] font-semibold transition"
                              title="Kick thành viên"
                            >
                              <UserMinus className="w-3 h-3 inline mr-0.5" />
                              Kick
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Mod Queue & Post Reports */}
      {activeTab === 'modqueue' && canModerate && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Hàng đợi kiểm duyệt báo cáo bài viết</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dành cho <strong>Moderator</strong>, <strong>Owner</strong> và <strong>Admin</strong> để xử lý vi phạm nội dung.
            </p>
          </div>

          {communityReports.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Không có bài viết nào bị báo cáo.</p>
              <p className="text-slate-400">Cộng đồng đang vận hành lành mạnh!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {communityReports.map((report) => {
                const targetPost = posts.find((p) => p.id === report.postId);
                const reporter = users.find((u) => u.id === report.reportedByUserId);
                const resolver = report.resolvedByUserId ? users.find((u) => u.id === report.resolvedByUserId) : null;

                return (
                  <div
                    key={report.id}
                    className={`p-4 rounded-xl border transition ${
                      report.status === 'PENDING'
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-slate-50 border-slate-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          {report.reason}
                        </span>
                        <span className="text-xs text-slate-500">
                          Báo cáo bởi <strong>u/{reporter?.username}</strong> vào {new Date(report.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          report.status === 'PENDING'
                            ? 'bg-amber-200 text-amber-900'
                            : report.status === 'RESOLVED_DELETED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {report.status === 'PENDING' ? 'Chờ xử lý' : report.status === 'RESOLVED_DELETED' ? 'Đã xóa bài vi phạm' : 'Đã bác bỏ'}
                      </span>
                    </div>

                    {report.details && (
                      <p className="text-xs text-slate-600 bg-white/70 p-2 rounded-lg border border-slate-200 mb-2 italic">
                        &quot;{report.details}&quot;
                      </p>
                    )}

                    {targetPost ? (
                      <div className="bg-white p-3 rounded-lg border border-slate-200 mb-3 text-xs">
                        <p className="font-bold text-slate-800 mb-1">{targetPost.title}</p>
                        <p className="text-slate-600 line-clamp-2">{targetPost.content}</p>
                      </div>
                    ) : (
                      <div className="text-xs text-red-500 mb-3 italic">[Bài viết đã bị xóa]</div>
                    )}

                    {/* Actions for pending reports */}
                    {report.status === 'PENDING' ? (
                      <div className="flex items-center gap-2 justify-end pt-2 border-t border-slate-200/60 flex-wrap">
                        <button
                          id={`dismiss-report-btn-${report.id}`}
                          onClick={() => {
                            const res = resolveReport(report.id, 'DISMISS');
                            alert(res.message);
                          }}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
                        >
                          Bác bỏ (Bài hợp lệ)
                        </button>

                        <button
                          id={`delete-reported-post-btn-${report.id}`}
                          onClick={() => {
                            if (confirm('Xác nhận xóa bài viết vi phạm này?')) {
                              const res = resolveReport(report.id, 'DELETE_POST');
                              alert(res.message);
                            }
                          }}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Xóa bài viết</span>
                        </button>

                        <button
                          id={`ban-reported-author-btn-${report.id}`}
                          onClick={() => {
                            if (confirm('Xóa bài viết VÀ CẤM (Ban) tác giả khỏi cộng đồng?')) {
                              const res = resolveReport(report.id, 'BAN_USER');
                              alert(res.message);
                            }
                          }}
                          className="px-3 py-1.5 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
                        >
                          <UserX className="w-3 h-3" />
                          <span>Xóa bài & Ban tác giả</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 text-right">
                        Xử lý bởi u/{resolver?.username} vào {new Date(report.resolvedAt || '').toLocaleString('vi-VN')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Community Settings (Owner or Admin) */}
      {activeTab === 'settings' && canManage && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Chỉnh sửa thông tin Community
            </h2>
            <p className="text-xs text-slate-500">
              Chỉ <strong>Owner</strong> của cộng đồng hoặc <strong>Admin</strong> hệ thống mới có quyền này.
            </p>
          </div>

          {settingsMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{settingsMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mô tả cộng đồng:</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Icon đại diện (Emoji):</label>
                <input
                  type="text"
                  value={editIcon}
                  onChange={(e) => setEditIcon(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ảnh bìa Banner URL:</label>
                <input
                  type="text"
                  value={editBanner}
                  onChange={(e) => setEditBanner(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nội quy cộng đồng (Mỗi dòng 1 điều):</label>
              <textarea
                value={editRules}
                onChange={(e) => setEditRules(e.target.value)}
                rows={5}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                id="save-community-settings-btn"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu thông tin Community</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <Crown className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Chuyển giao quyền Owner</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Là Owner, <strong>bạn không thể rời cộng đồng trực tiếp khi chưa chuyển giao quyền</strong>.
              Vui lòng chọn một thành viên khác để giao quyền Quản trị viên (Owner). Sau khi hoàn tất, vai trò của bạn sẽ chuyển thành <strong>Member</strong>.
            </p>

            <form onSubmit={handleConfirmTransfer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn thành viên nhận quyền Owner:
                </label>
                <select
                  value={transferTargetUserId}
                  onChange={(e) => setTransferTargetUserId(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden"
                  required
                >
                  <option value="">-- Chọn thành viên --</option>
                  {communityMembers
                    .filter((m) => m.userId !== community.ownerId)
                    .map((m) => {
                      const user = users.find((u) => u.id === m.userId);
                      return (
                        <option key={m.userId} value={m.userId}>
                          {user?.displayName} (@{user?.username}) - Hiện là {m.role}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  id="confirm-transfer-ownership-btn"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  Xác nhận chuyển quyền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
