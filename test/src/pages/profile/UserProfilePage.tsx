import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { usePostStore } from '../../store/usePostStore';
import { useToastStore } from '../../store/useToastStore';
import PostCard from '../../components/post/PostCard';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ReportModal from '../../components/post/ReportModal';
import {
  Calendar,
  MapPin,
  Cake,
  Settings,
  Edit3,
  Share2,
  Flag,
  FileText,
  MessageSquare,
  Award,
} from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const { user: currentUser } = useAuthStore();
  const { posts } = usePostStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');
  const [isReportOpen, setIsReportOpen] = useState(false);

  const isMe = currentUser?.username === username;

  // Mock user profile details
  const profileUser = (isMe && currentUser)
    ? currentUser
    : {
        id: `usr_${username || 'guest'}`,
        username: username || 'user',
        displayName: username === 'minh_frontend' ? 'Minh Nguyễn (Senior Frontend)' : (username || 'Người dùng'),
        avatarUrl:
          username === 'minh_frontend'
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
        bio: 'Thành viên tích cực tại mạng xã hội DISCUSS. Đam mê chia sẻ tri thức công nghệ.',
        location: 'Hà Nội, Việt Nam',
        dateOfBirth: '1996-08-10',
        privacy: { showDateOfBirth: false, showLocation: true, showPostsOnProfile: true },
        role: username === 'minh_frontend' ? ('MODERATOR' as const) : ('USER' as const),
        karma: 1250,
        createdAt: '2022-04-12T00:00:00Z',
      };

  const userPosts = posts.filter((p) => p.author.username === profileUser.username);

  const handleShareProfile = () => {
    navigator.clipboard?.writeText(window.location.href);
    addToast('Đã sao chép liên kết trang cá nhân!', 'success');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left pb-16">
      {/* BANNER & HEADER */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-xl">
        {/* Banner */}
        <div className="h-44 sm:h-56 w-full relative bg-[var(--bg-main)]">
          <img
            src={profileUser.bannerUrl}
            alt={profileUser.displayName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] via-transparent to-black/15" />
        </div>

        {/* Profile Details */}
        <div className="p-6 sm:p-8 -mt-16 sm:-mt-20 relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <Avatar
                src={profileUser.avatarUrl}
                alt={profileUser.displayName}
                size="2xl"
                className="border-4 border-[var(--bg-surface)] shadow-2xl bg-[var(--bg-surface)]"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                    {profileUser.displayName}
                  </h1>
                  {profileUser.role === 'OWNER' && <Badge role="OWNER" />}
                  {profileUser.role === 'MODERATOR' && <Badge role="MODERATOR" />}
                  {profileUser.role === 'ADMIN' && <Badge role="ADMIN" />}
                </div>
                <div className="text-xs text-[var(--text-muted)]">@{profileUser.username}</div>
              </div>
            </div>

            {/* Actions: Edit profile for self, or report/message for other */}
            <div className="flex items-center gap-2.5">
              {isMe ? (
                <>
                  <Link to="/settings/profile">
                    <Button variant="primary" size="sm" leftIcon={<Edit3 className="w-4 h-4" />}>
                      Chỉnh sửa hồ sơ
                    </Button>
                  </Link>
                  <Link to="/settings">
                    <Button variant="secondary" size="sm" leftIcon={<Settings className="w-4 h-4" />}>
                      Cài đặt
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to={`/messages`}>
                    <Button variant="primary" size="sm" leftIcon={<MessageSquare className="w-4 h-4" />}>
                      Nhắn tin
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsReportOpen(true)}
                    className="text-[#EF4444]"
                    title="Báo cáo tài khoản"
                  >
                    <Flag className="w-4 h-4" />
                  </Button>
                </>
              )}

              <button
                onClick={handleShareProfile}
                className="p-2.5 rounded-full bg-[#222426] border border-[#303235] text-[#9A9DA3] hover:text-[#F5F5F5] transition-colors"
                title="Chia sẻ hồ sơ"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bio */}
          <p className="text-xs sm:text-sm text-[#D1D5DB] max-w-2xl leading-relaxed">
            {profileUser.bio}
          </p>

          {/* Metadata strictly respecting privacy settings */}
          <div className="flex items-center gap-5 flex-wrap pt-2 text-xs text-[#70747C]">
            <span className="flex items-center gap-1.5 font-bold text-[#FF5700]">
              <Award className="w-4 h-4" />
              <span className="tabular-nums">{profileUser.karma}</span> điểm Karma
            </span>

            {profileUser.privacy.showLocation && profileUser.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#9A9DA3]" />
                {profileUser.location}
              </span>
            )}

            {profileUser.privacy.showDateOfBirth && profileUser.dateOfBirth && (
              <span className="flex items-center gap-1.5">
                <Cake className="w-4 h-4 text-[#9A9DA3]" />
                Sinh nhật: {profileUser.dateOfBirth}
              </span>
            )}

            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#9A9DA3]" />
              Tham gia từ 2023
            </span>
          </div>
        </div>
      </div>

      {/* Profile Activity Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#303235] pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'posts'
                ? 'bg-[#FF5700]/15 text-[#FF5700] border border-[#FF5700]/30 font-bold'
                : 'text-[#9A9DA3] hover:text-[#F5F5F5]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Bài viết ({userPosts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'comments'
                ? 'bg-[#FF5700]/15 text-[#FF5700] border border-[#FF5700]/30 font-bold'
                : 'text-[#9A9DA3] hover:text-[#F5F5F5]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Bình luận thảo luận</span>
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {profileUser.privacy.showPostsOnProfile ? (
              userPosts.length > 0 ? (
                userPosts.map((p) => <PostCard key={p.id} post={p} />)
              ) : (
                <div className="py-16 text-center bg-[#191A1C] border border-[#303235] rounded-3xl p-8 text-xs text-[#70747C]">
                  Người dùng chưa đăng bài viết nào.
                </div>
              )
            ) : (
              <div className="py-16 text-center bg-[#191A1C] border border-[#303235] rounded-3xl p-8 text-xs text-[#70747C]">
                Người dùng này đã ẩn danh sách bài viết theo cài đặt quyền riêng tư.
              </div>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="py-16 text-center bg-[#191A1C] border border-[#303235] rounded-3xl p-8 text-xs text-[#70747C] space-y-2">
            <MessageSquare className="w-8 h-8 text-[#FF5700] mx-auto opacity-70" />
            <p>Lịch sử các phản hồi bình luận hữu ích của người dùng sẽ hiển thị ở đây.</p>
          </div>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        contentType="USER"
        contentId={profileUser.id}
        contentTitle={`Tài khoản @${profileUser.username}`}
        targetUsername={profileUser.username}
      />
    </div>
  );
};

export default UserProfilePage;
