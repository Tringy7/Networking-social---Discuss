import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { chatService } from '../../services/chatService';
import Button from '../../components/ui/Button';
import { Lock, Check, RotateCcw } from 'lucide-react';

export const PrivacySettingsPage: React.FC = () => {
  const { user, updatePrivacy } = useAuthStore();
  const { addToast } = useToastStore();

  const [showDOB, setShowDOB] = useState(user?.privacy.showDateOfBirth ?? true);
  const [showLocation, setShowLocation] = useState(user?.privacy.showLocation ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [chatPrivacy, setChatPrivacy] = useState<boolean>();
  const [savingChatPrivacy, setSavingChatPrivacy] = useState(false);

  useEffect(() => {
    let active = true;
    if (user?.id) chatService.getChatPrivacySettings().then(result => {
      if (active) setChatPrivacy(result.allowRequests);
    }).catch(() => { if (active) addToast('Không thể tải cài đặt nhắn tin.', 'error'); });
    return () => { active = false; };
  }, [user?.id, addToast]);

  async function toggleChatPrivacy() {
    if (chatPrivacy === undefined || savingChatPrivacy) return;
    setSavingChatPrivacy(true);
    try {
      await chatService.updateChatPrivacySettings(!chatPrivacy);
      setChatPrivacy(!chatPrivacy);
    } catch {
      addToast('Không thể cập nhật cài đặt nhắn tin.', 'error');
    } finally {
      setSavingChatPrivacy(false);
    }
  }

  const savedDOB = user?.privacy.showDateOfBirth;
  const savedLocation = user?.privacy.showLocation;
  const hasChanges = Boolean(user) && (savedDOB !== showDOB || savedLocation !== showLocation);

  useEffect(() => {
    if (savedDOB !== undefined) setShowDOB(savedDOB);
    if (savedLocation !== undefined) setShowLocation(savedLocation);
  }, [user?.id, savedDOB, savedLocation]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !hasChanges) return;
    setIsLoading(true);
    try {
      await updatePrivacy({
        showDateOfBirth: savedDOB === showDOB ? undefined : showDOB,
        showLocation: savedLocation === showLocation ? undefined : showLocation,
      });
      addToast('Cài đặt quyền riêng tư đã được lưu thành công!', 'success');
    } catch (error: unknown) {
      addToast(error instanceof Error ? error.message : 'Không thể lưu cài đặt quyền riêng tư.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setShowDOB(true);
    setShowLocation(true);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 text-left">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Lock className="w-5 h-5 text-[var(--color-orange-ink)]" />
          <span>Quyền riêng tư & Bảo mật</span>
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Kiểm soát những thông tin nào có thể hiển thị công khai tới các thành viên khác trên DISCUSS.
        </p>
      </div>

      <div className="space-y-4">
        <label className="flex items-center justify-between gap-4 setting-group">
          <span className="space-y-0.5">
            <span className="block text-sm font-semibold">Cho phép người khác bắt đầu trò chuyện</span>
            <span className="block text-xs text-[var(--text-secondary)]">Cho phép người chưa trò chuyện với bạn gửi lời nhắn đầu tiên.</span>
          </span>
          <input type="checkbox" disabled={chatPrivacy === undefined || savingChatPrivacy}
            checked={chatPrivacy ?? false} onChange={() => void toggleChatPrivacy()} />
        </label>
        {/* Toggle 1: DOB */}
        <div className="flex items-center justify-between gap-4 setting-group">
          <div className="space-y-0.5 max-w-md">
            <h4 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">Hiển thị ngày sinh trên hồ sơ</h4>
            <p className="text-xs text-[var(--text-secondary)]">
              Cho phép các thành viên khác nhìn thấy ngày sinh của bạn trên trang cá nhân công khai.
            </p>
          </div>
          <button
            type="button"
            disabled={isLoading}
            role="switch"
            aria-checked={showDOB}
            aria-label="Hiển thị ngày sinh trên hồ sơ"
            onClick={() => setShowDOB(!showDOB)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              showDOB ? 'bg-[var(--color-orange)]' : 'bg-[var(--bg-elevated)]'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full transform transition-transform ${
                showDOB ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Toggle 2: Location */}
        <div className="flex items-center justify-between gap-4 setting-group">
          <div className="space-y-0.5 max-w-md">
            <h4 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">Hiển thị vị trí / tỉnh thành</h4>
            <p className="text-xs text-[var(--text-secondary)]">
              Hiển thị thông tin thành phố của bạn để kết nối với các lập trình viên cùng khu vực.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            disabled={isLoading}
            aria-checked={showLocation}
            aria-label="Hiển thị vị trí hoặc tỉnh thành"
            onClick={() => setShowLocation(!showLocation)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              showLocation ? 'bg-[var(--color-orange)]' : 'bg-[var(--bg-elevated)]'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full transform transition-transform ${
                showLocation ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
        <button
          type="button"
          onClick={handleReset}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Khôi phục mặc định</span>
        </button>

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!hasChanges}
          isLoading={isLoading}
          leftIcon={<Check className="w-4 h-4" />}
        >
          Lưu cài đặt quyền riêng tư
        </Button>
      </div>
    </form>
  );
};

export default PrivacySettingsPage;
