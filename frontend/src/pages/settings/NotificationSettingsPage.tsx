import React from 'react';
import { useToastStore } from '../../store/useToastStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import Button from '../../components/ui/Button';
import { Bell, Check, RotateCcw } from 'lucide-react';
import { NOTIFICATIONS_AVAILABLE } from '../../services';

export const NotificationSettingsPage: React.FC = () => {
  const { addToast } = useToastStore();
  const { preferences, updatePreferences, savePreferences, resetPreferences } = useNotificationStore();
  const handleReset = () => {
    try {
      resetPreferences();
      addToast('Đã khôi phục và lưu các tùy chọn thông báo mặc định.', 'info');
    } catch (error: unknown) {
      addToast(error instanceof Error ? error.message : 'Không thể khôi phục tùy chọn thông báo.', 'error');
    }
  };

  const renderToggle = (
    label: string,
    desc: string,
    checked: boolean,
    onChange: (checked: boolean) => void
  ) => (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#141517] border border-[#303235]">
      <div className="space-y-0.5 max-w-md">
        <h4 className="text-xs sm:text-sm font-bold text-[#F5F5F5]">{label}</h4>
        <p className="text-xs text-[#9A9DA3]">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
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
    <div className="space-y-6 text-left">
      <div className="pb-3 border-b border-[#303235]">
        <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#FF5700]" />
          <span>Tùy chọn thông báo</span>
        </h2>
        <p className="text-xs text-[#9A9DA3]">
          Cấu hình thông báo hiển thị trên chuông in-app hoặc gửi đến email của bạn.
        </p>
      </div>

      {!NOTIFICATIONS_AVAILABLE && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          Thay đổi được lưu trên thiết bị này; đồng bộ thông báo với máy chủ sẽ khả dụng sau.
        </div>
      )}

      {/* Section 1: In-App */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
          Thông báo trên ứng dụng (In-App)
        </h3>
        <div className="space-y-2.5">
          {renderToggle(
            'Phản hồi bình luận',
            'Khi có người trả lời hoặc tương tác với bình luận của bạn.',
            preferences.inAppReplies,
            (checked) => updatePreferences({ inAppReplies: checked })
          )}
          {renderToggle(
            'Lượt nhắc đến (@mention)',
            'Khi tên tài khoản của bạn được đề cập trong bài viết hoặc comment.',
            preferences.inAppMentions,
            (checked) => updatePreferences({ inAppMentions: checked })
          )}
          {renderToggle(
            'Hoạt động cộng đồng nổi bật',
            'Bài viết được ghim hoặc thông báo quan trọng từ nhóm bạn đã tham gia.',
            preferences.inAppCommunityActivity,
            (checked) => updatePreferences({ inAppCommunityActivity: checked })
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
            preferences.emailDigest,
            (checked) => updatePreferences({ emailDigest: checked })
          )}
          {renderToggle(
            'Thông báo cập nhật hệ thống & bảo mật',
            'Tin tức bảo mật quan trọng từ đội ngũ DISCUSS.',
            preferences.emailAnnouncements,
            (checked) => updatePreferences({ emailAnnouncements: checked })
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
          type="button"
          variant="primary"
          size="md"
          onClick={() => {
            try {
              savePreferences();
              addToast('Đã lưu tùy chọn thông báo trên thiết bị này.', 'success');
            } catch (error: unknown) {
              addToast(error instanceof Error ? error.message : 'Không thể lưu tùy chọn thông báo.', 'error');
            }
          }}
          leftIcon={<Check className="w-4 h-4" />}
        >
          Lưu tùy chọn thông báo
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
