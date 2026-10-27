import React, { useEffect, useState } from 'react';
import { useToastStore } from '../../store/useToastStore';
import Button from '../../components/ui/Button';
import { Bell, Check, RotateCcw } from 'lucide-react';
import { notificationService } from '../../services';

export const NotificationSettingsPage: React.FC = () => {
  const { addToast } = useToastStore();

  const [inAppReplies, setInAppReplies] = useState(true);
  const [inAppMentions, setInAppMentions] = useState(true);
  const [inAppCommunityActivity, setInAppCommunityActivity] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [emailAnnouncements, setEmailAnnouncements] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    notificationService.getPreferences().then((preferences) => {
      setInAppReplies(preferences.inAppReplies);
      setInAppMentions(preferences.inAppMentions);
      setInAppCommunityActivity(preferences.inAppCommunityActivity);
      setEmailDigest(preferences.emailDigest);
      setEmailAnnouncements(preferences.emailAnnouncements);
    }).catch((error: unknown) => {
      addToast(error instanceof Error ? error.message : 'Không thể tải tùy chọn thông báo.', 'error');
    });
  }, [addToast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await notificationService.savePreferences({
        inAppReplies,
        inAppMentions,
        inAppCommunityActivity,
        emailDigest,
        emailAnnouncements,
      });
      addToast('Đã lưu tùy chọn cài đặt thông báo!', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể lưu tùy chọn thông báo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setInAppReplies(true);
    setInAppMentions(true);
    setInAppCommunityActivity(true);
    setEmailDigest(false);
    setEmailAnnouncements(true);
    addToast('Đã khôi phục giá trị mặc định. Nhấn lưu để áp dụng.', 'info');
  };

  const renderToggle = (label: string, desc: string, checked: boolean, onChange: () => void) => (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#141517] border border-[#303235]">
      <div className="space-y-0.5 max-w-md">
        <h4 className="text-xs sm:text-sm font-bold text-[#F5F5F5]">{label}</h4>
        <p className="text-xs text-[#9A9DA3]">{desc}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
          checked ? 'bg-[#FF5700]' : 'bg-[#CBD5E1]'
        }`}
      >
        <div
          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSave} className="space-y-6 text-left">
      <div className="pb-3 border-b border-[#303235]">
        <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#FF5700]" />
          <span>Tùy chọn thông báo</span>
        </h2>
        <p className="text-xs text-[#9A9DA3]">
          Cấu hình thông báo hiển thị trên chuông in-app hoặc gửi đến email của bạn.
        </p>
      </div>

      {/* Section 1: In-App */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
          Thông báo trên ứng dụng (In-App)
        </h3>
        <div className="space-y-2.5">
          {renderToggle(
            'Phản hồi bình luận',
            'Khi có người trả lời hoặc tương tác với bình luận của bạn.',
            inAppReplies,
            () => setInAppReplies(!inAppReplies)
          )}
          {renderToggle(
            'Lượt nhắc đến (@mention)',
            'Khi tên tài khoản của bạn được đề cập trong bài viết hoặc comment.',
            inAppMentions,
            () => setInAppMentions(!inAppMentions)
          )}
          {renderToggle(
            'Hoạt động cộng đồng nổi bật',
            'Bài viết được ghim hoặc thông báo quan trọng từ nhóm bạn đã tham gia.',
            inAppCommunityActivity,
            () => setInAppCommunityActivity(!inAppCommunityActivity)
          )}
        </div>
      </div>

      {/* Section 2: Email */}
      <div className="space-y-3 pt-2 border-t border-[#303235]">
        <h3 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
          Thông báo qua Email
        </h3>
        <div className="space-y-2.5">
          {renderToggle(
            'Bản tin tổng hợp tuần (Weekly Digest)',
            'Gửi email tổng hợp các bài viết kỹ thuật hay nhất trong tuần.',
            emailDigest,
            () => setEmailDigest(!emailDigest)
          )}
          {renderToggle(
            'Thông báo cập nhật hệ thống & bảo mật',
            'Tin tức bảo mật quan trọng từ đội ngũ DISCUSS.',
            emailAnnouncements,
            () => setEmailAnnouncements(!emailAnnouncements)
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[#303235]">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-[#70747C] hover:text-[#F5F5F5] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Khôi phục mặc định</span>
        </button>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          leftIcon={<Check className="w-4 h-4" />}
        >
          Lưu tùy chọn thông báo
        </Button>
      </div>
    </form>
  );
};

export default NotificationSettingsPage;
