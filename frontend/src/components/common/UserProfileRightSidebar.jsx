import React from 'react';
import { 
  User, 
  Settings, 
  Calendar, 
  MapPin, 
  FileText, 
  Users, 
  MessageSquare, 
  Mail, 
  Cake,
  Sparkles
} from 'lucide-react';
import { formatDate, formatNumber } from '../../utils/formatters';

export default function UserProfileRightSidebar({
  targetUser,
  isMe,
  onOpenEditProfile,
  userPostsCount = 0,
  userCommunitiesCount = 0,
}) {
  if (!targetUser) return null;

  const profile = targetUser.profile || {};
  const privacySettings = targetUser.privacySettings || {};

  const displayName = profile.displayName || targetUser.displayName || targetUser.name || targetUser.username || 'Người dùng';
  const username = targetUser.username || '';
  const email = targetUser.email || '';
  const bio = profile.bio || targetUser.bio || '';
  const location = profile.location || targetUser.location || '';
  const dateOfBirth = profile.dateOfBirth || targetUser.dateOfBirth || '';
  const gender = profile.gender || targetUser.gender || '';
  const joinedDate = targetUser.joinedAt || targetUser.createdAt;

  // Privacy filters
  const canShowLocation = isMe || (privacySettings.showLocation !== false && !!location);
  const canShowDob = isMe || (privacySettings.showDateOfBirth === true && !!dateOfBirth);

  const displayPostCount = targetUser.statistics?.postCount ?? userPostsCount;
  const displayCommentCount = targetUser.statistics?.commentCount;
  const displayCommunityCount = targetUser.statistics?.communityCount ?? userCommunitiesCount;

  const renderGenderText = (g) => {
    switch (g) {
      case 'MALE':
        return 'Nam';
      case 'FEMALE':
        return 'Nữ';
      case 'OTHER':
        return 'Khác';
      default:
        return g || null;
    }
  };

  return (
    <aside className="hidden xl:block w-80 shrink-0 space-y-4 sticky top-16">
      {/* Profile Overview Card (NO avatar, NO banner) */}
      <div className="bg-[#1a1a1b] rounded-2xl border border-[#343536] p-5 shadow-sm space-y-4">
        {/* Header with Display Name & Username */}
        <div className="border-b border-[#343536] pb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-[#d7dadc] truncate">
              {displayName}
            </h3>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#272729] text-orange-400 border border-[#343536]">
              {isMe ? 'Bạn' : 'Hồ sơ'}
            </span>
          </div>
          <p className="text-xs font-mono text-[#818384] mt-0.5">
            u/{username}
          </p>

          {email && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-[#818384] truncate">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{email}</span>
            </div>
          )}

          {isMe && onOpenEditProfile && (
            <button
              onClick={onOpenEditProfile}
              className="mt-4 w-full py-2 px-3 bg-[#272729] hover:bg-[#343536] text-[#d7dadc] text-xs font-semibold rounded-full border border-[#343536] transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Settings className="w-3.5 h-3.5 text-orange-400" />
              <span>Chỉnh sửa thông tin</span>
            </button>
          )}
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-bold text-[#818384] uppercase tracking-wider">
            Tiểu sử
          </h4>
          {bio ? (
            <p className="text-xs text-[#d7dadc] whitespace-pre-wrap leading-relaxed">
              {bio}
            </p>
          ) : (
            <p className="text-xs text-[#818384] italic">
              {isMe ? 'Chưa cập nhật tiểu sử bản thân.' : 'Chưa có tiểu sử giới thiệu.'}
            </p>
          )}
        </div>

        {/* User Details */}
        <div className="space-y-2.5 pt-2 border-t border-[#343536]/80 text-xs text-[#d7dadc]">
          {joinedDate && (
            <div className="flex items-center gap-2.5 text-[#818384]">
              <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Đã tham gia {formatDate(joinedDate)}</span>
            </div>
          )}

          {gender && renderGenderText(gender) && (
            <div className="flex items-center gap-2.5 text-[#818384]">
              <User className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Giới tính: <strong className="text-[#d7dadc] font-normal">{renderGenderText(gender)}</strong></span>
            </div>
          )}

          {canShowDob && (
            <div className="flex items-center gap-2.5 text-[#818384]">
              <Cake className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Sinh nhật: <strong className="text-[#d7dadc] font-normal">{formatDate(dateOfBirth)}</strong></span>
            </div>
          )}

          {canShowLocation && (
            <div className="flex items-center gap-2.5 text-[#818384]">
              <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Khu vực: <strong className="text-[#d7dadc] font-normal">{location}</strong></span>
            </div>
          )}
        </div>

        {/* Statistics Grid */}
        <div className="pt-3 border-t border-[#343536] space-y-2">
          <h4 className="text-[11px] font-bold text-[#818384] uppercase tracking-wider">
            Thống kê tài khoản
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-[#272729] rounded-xl border border-[#343536]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#818384]">
                <FileText className="w-3.5 h-3.5 text-orange-400" />
                <span>Bài viết</span>
              </div>
              <p className="text-base font-bold text-[#d7dadc] mt-1">
                {formatNumber(displayPostCount)}
              </p>
            </div>

            <div className="p-2.5 bg-[#272729] rounded-xl border border-[#343536]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#818384]">
                <Users className="w-3.5 h-3.5 text-orange-400" />
                <span>Cộng đồng</span>
              </div>
              <p className="text-base font-bold text-[#d7dadc] mt-1">
                {formatNumber(displayCommunityCount)}
              </p>
            </div>

            {displayCommentCount !== undefined && displayCommentCount !== null && (
              <div className="p-2.5 bg-[#272729] rounded-xl border border-[#343536] col-span-2">
                <div className="flex items-center gap-1.5 text-[11px] text-[#818384]">
                  <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                  <span>Bình luận</span>
                </div>
                <p className="text-base font-bold text-[#d7dadc] mt-1">
                  {formatNumber(displayCommentCount)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
