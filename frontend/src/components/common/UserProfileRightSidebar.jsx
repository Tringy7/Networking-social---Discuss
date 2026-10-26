import React from 'react';
import { formatDate, formatNumber } from '../../utils/formatters';
import { 
  Settings, 
  Calendar, 
  FileText, 
  Users, 
  MessageSquare,
  Mail,
  MapPin,
  Sparkles
} from 'lucide-react';

export default function UserProfileRightSidebar({
  targetUser,
  isMe,
  onOpenEditProfile,
  userPostsCount = 0,
  userCommunitiesCount = 0,
}) {
  if (!targetUser) return null;

  const profile = targetUser?.profile || {};
  const privacySettings = targetUser?.privacySettings || {};
  const statistics = targetUser?.statistics || null;

  const userDisplayName = profile.displayName || targetUser?.displayName || targetUser?.name || targetUser?.username || 'Người dùng';
  const userBio = profile.bio || targetUser?.bio || '';
  const userLocation = profile.location || targetUser?.location || '';
  const userDob = profile.dateOfBirth || targetUser?.dateOfBirth || '';
  const userGender = profile.gender || targetUser?.gender || '';
  const userEmail = targetUser?.email || '';

  const displayPostCount = statistics?.postCount !== undefined ? statistics.postCount : userPostsCount;
  const displayCommentCount = statistics?.commentCount !== undefined ? statistics.commentCount : null;
  const displayCommunityCount = statistics?.communityCount !== undefined ? statistics.communityCount : userCommunitiesCount;

  return (
    <aside className="hidden xl:block w-80 shrink-0 space-y-4 sticky top-16">
      {/* User Info Card */}
      <div className="bg-[#1a1a1b] rounded-2xl border border-[#343536] p-5 shadow-sm space-y-4">
        {/* Username Header */}
        <div className="border-b border-[#343536] pb-3">
          <div className="text-[11px] font-bold text-[#818384] uppercase tracking-wider mb-1">
            Hồ sơ người dùng
          </div>
          <div className="font-extrabold text-base text-[#d7dadc] truncate">
            {userDisplayName}
          </div>
          <div className="text-xs text-orange-400 font-mono">
            u/{targetUser?.username}
          </div>
          {userEmail && (
            <div className="flex items-center gap-1.5 text-xs text-[#818384] font-mono mt-1 truncate" title={userEmail}>
              <Mail className="w-3.5 h-3.5 text-[#818384] shrink-0" />
              <span className="truncate">{userEmail}</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {userBio ? (
          <p className="text-xs text-[#d7dadc] leading-relaxed break-words">
            {userBio}
          </p>
        ) : (
          <p className="text-xs text-[#818384] italic">
            Chưa có tiểu sử giới thiệu.
          </p>
        )}

        {/* Metadata: Location, Gender, DOB */}
        {(userLocation || (userDob && (isMe || privacySettings.showDateOfBirth === true)) || userGender) && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {userLocation && (privacySettings.showLocation !== false) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#272729] border border-[#343536] rounded-full text-xs text-[#d7dadc]">
                <MapPin className="w-3 h-3 text-orange-400" />
                <span>{userLocation}</span>
              </span>
            )}
            {userGender && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#272729] border border-[#343536] rounded-full text-xs text-[#d7dadc]">
                <span>{userGender === 'MALE' ? 'Nam' : userGender === 'FEMALE' ? 'Nữ' : userGender}</span>
              </span>
            )}
            {userDob && (isMe || privacySettings.showDateOfBirth === true) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#272729] border border-[#343536] rounded-full text-xs text-[#d7dadc]">
                <span>🎂 {formatDate(userDob)}</span>
              </span>
            )}
          </div>
        )}

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#343536] text-xs">
          <div className="p-2.5 bg-[#272729] rounded-xl border border-[#343536]/80 flex flex-col">
            <span className="text-[11px] text-[#818384]">Bài viết</span>
            <span className="font-bold text-[#d7dadc] text-sm mt-0.5">{displayPostCount}</span>
          </div>

          <div className="p-2.5 bg-[#272729] rounded-xl border border-[#343536]/80 flex flex-col">
            <span className="text-[11px] text-[#818384]">Cộng đồng</span>
            <span className="font-bold text-[#d7dadc] text-sm mt-0.5">{displayCommunityCount}</span>
          </div>

          {displayCommentCount !== null && (
            <div className="p-2.5 bg-[#272729] rounded-xl border border-[#343536]/80 flex flex-col col-span-2">
              <span className="text-[11px] text-[#818384]">Bình luận</span>
              <span className="font-bold text-[#d7dadc] text-sm mt-0.5">{displayCommentCount}</span>
            </div>
          )}
        </div>

        {/* Joined Date */}
        <div className="flex items-center gap-2 text-xs text-[#818384] pt-2 border-t border-[#343536]">
          <Calendar className="w-3.5 h-3.5 text-[#818384] shrink-0" />
          <span>Tham gia {formatDate(targetUser.createdAt || targetUser.joinedAt)}</span>
        </div>

        {/* Edit Profile Action */}
        {isMe && onOpenEditProfile && (
          <button
            onClick={onOpenEditProfile}
            className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white rounded-full text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Chỉnh sửa thông tin</span>
          </button>
        )}
      </div>
    </aside>
  );
}

export { UserProfileRightSidebar };
