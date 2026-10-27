import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import Button from '../../components/ui/Button';
import { Lock, Eye, Check, RotateCcw } from 'lucide-react';

export const PrivacySettingsPage: React.FC = () => {
  const { user, updatePrivacy } = useAuthStore();
  const { addToast } = useToastStore();

  const [showDOB, setShowDOB] = useState(user?.privacy.showDateOfBirth ?? true);
  const [showLocation, setShowLocation] = useState(user?.privacy.showLocation ?? true);
  const [showPosts, setShowPosts] = useState(user?.privacy.showPostsOnProfile ?? true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setShowDOB(user.privacy.showDateOfBirth);
    setShowLocation(user.privacy.showLocation);
    setShowPosts(user.privacy.showPostsOnProfile);
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updatePrivacy({
        showDateOfBirth: showDOB,
        showLocation: showLocation,
        showPostsOnProfile: showPosts,
      });
      addToast('Cài đặt quyền riêng tư đã được lưu thành công!', 'success');
    } catch (error: unknown) {
      addToast(error instanceof Error ? error.message : 'Không thể lưu cài đặt quyền riêng tư.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setShowDOB(true);
    setShowLocation(true);
    setShowPosts(true);
    try {
      await updatePrivacy({ showDateOfBirth: true, showLocation: true, showPostsOnProfile: true });
      addToast('Đã khôi phục cài đặt riêng tư mặc định.', 'info');
    } catch (error: unknown) {
      addToast(error instanceof Error ? error.message : 'Không thể khôi phục cài đặt riêng tư.', 'error');
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 text-left">
      <div className="pb-3 border-b border-[#303235]">
        <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
          <Lock className="w-5 h-5 text-[#22C55E]" />
          <span>Quyền riêng tư & Bảo mật</span>
        </h2>
        <p className="text-xs text-[#9A9DA3]">
          Kiểm soát những thông tin nào có thể hiển thị công khai tới các thành viên khác trên DISCUSS.
        </p>
      </div>

      <div className="space-y-4">
        {/* Toggle 1: DOB */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#141517] border border-[#303235]">
          <div className="space-y-0.5 max-w-md">
            <h4 className="text-xs sm:text-sm font-bold text-[#F5F5F5]">Hiển thị ngày sinh trên hồ sơ</h4>
            <p className="text-xs text-[#9A9DA3]">
              Cho phép các thành viên khác nhìn thấy ngày sinh của bạn trên trang cá nhân công khai.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDOB(!showDOB)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              showDOB ? 'bg-[#FF5700]' : 'bg-[#CBD5E1]'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                showDOB ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Toggle 2: Location */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#141517] border border-[#303235]">
          <div className="space-y-0.5 max-w-md">
            <h4 className="text-xs sm:text-sm font-bold text-[#F5F5F5]">Hiển thị vị trí / tỉnh thành</h4>
            <p className="text-xs text-[#9A9DA3]">
              Hiển thị thông tin thành phố của bạn để kết nối với các lập trình viên cùng khu vực.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowLocation(!showLocation)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              showLocation ? 'bg-[#FF5700]' : 'bg-[#CBD5E1]'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                showLocation ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Toggle 3: Posts on profile */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#141517] border border-[#303235]">
          <div className="space-y-0.5 max-w-md">
            <h4 className="text-xs sm:text-sm font-bold text-[#F5F5F5]">Hiển thị danh sách bài viết trên hồ sơ</h4>
            <p className="text-xs text-[#9A9DA3]">
              Khi tắt tính năng này, người khác truy cập trang cá nhân của bạn sẽ không thấy danh sách bài viết đã đăng.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPosts(!showPosts)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              showPosts ? 'bg-[#FF5700]' : 'bg-[#CBD5E1]'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                showPosts ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

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
          Lưu cài đặt quyền riêng tư
        </Button>
      </div>
    </form>
  );
};

export default PrivacySettingsPage;
