import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { KeyRound, Shield, Laptop, Smartphone, LogOut, CheckCircle2 } from 'lucide-react';

export const AccountSettingsPage: React.FC = () => {
  const { user, logout, changePassword } = useAuthStore();
  const { addToast } = useToastStore();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      addToast('Mật khẩu mới phải có tối thiểu 8 ký tự!', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Mật khẩu xác nhận không trùng khớp!', 'error');
      return;
    }

    setIsChanging(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      setIsChanging(false);
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast('Đổi mật khẩu thành công!', 'success');
    } catch (error: unknown) {
      addToast(error instanceof Error ? error.message : 'Đổi mật khẩu thất bại.', 'error');
    } finally {
      setIsChanging(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error: unknown) {
      addToast(error instanceof Error ? error.message : 'Đăng xuất thất bại.', 'error');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-[var(--color-orange-ink)]" />
          <span>Tài khoản & Đăng nhập</span>
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Quản lý thông tin đăng nhập, bảo mật mật khẩu và các phiên truy cập của bạn.
        </p>
      </div>

      {/* Account credentials */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="setting-group space-y-1">
            <span className="text-xs text-[var(--text-muted)] font-semibold">Tên đăng nhập</span>
            <div className="text-sm font-semibold text-[var(--text-primary)]">@{user?.username}</div>
            <p className="text-xs text-[var(--text-muted)]">Tên định danh cố định trong hệ thống.</p>
          </div>

          <div className="setting-group space-y-1">
            <span className="text-xs text-[var(--text-muted)] font-semibold">Email liên kết</span>
            <div className="text-sm font-semibold text-[var(--text-primary)]">{user?.email}</div>
            <p className="text-xs text-[var(--color-success)] flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Đã xác thực
            </p>
          </div>
        </div>

        {/* Change password button */}
        <div className="setting-group flex items-center justify-between gap-4">
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">Mật khẩu tài khoản</h4>
            <p className="text-xs text-[var(--text-secondary)]">Đổi mật khẩu định kỳ để nâng cao tính an toàn.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setIsPasswordModalOpen(true)}>
            Đổi mật khẩu
          </Button>
        </div>

        {/* Linked providers */}
        <div className="setting-group space-y-3">
          <h4 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">Nhà cung cấp đăng nhập liên kết</h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z"
                />
              </svg>
              <div>
                <div className="text-xs font-semibold text-[var(--text-primary)]">Google Account</div>
                <div className="text-xs text-[var(--text-muted)]">Đã liên kết cho đăng nhập 1 chạm</div>
              </div>
            </div>
            <span className="text-xs font-semibold text-[var(--color-success)] bg-[var(--color-success)]/15 px-2.5 py-0.5 rounded-full">
              Đã kích hoạt
            </span>
          </div>
        </div>

        {/* Active sessions */}
        <div className="setting-group space-y-3">
          <h4 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">Phiên đăng nhập đang hoạt động</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[var(--bg-surface)]">
              <div className="flex items-center gap-3">
                <Laptop className="w-4 h-4 text-[var(--color-orange)]" />
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    Chrome trên macOS (Thiết bị hiện tại)
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">IP: 14.161.x.x · TP. Hồ Chí Minh</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-[var(--color-success)]">Trực tuyến</span>
            </div>

            <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[var(--bg-surface)]">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-[var(--text-secondary)]" />
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">Safari trên iPhone 15 Pro</div>
                  <div className="text-xs text-[var(--text-muted)]">Hoạt động 3 giờ trước</div>
                </div>
              </div>
              <button
                onClick={() => addToast('Đã thu hồi phiên đăng nhập di động!', 'info')}
                className="text-xs text-[var(--color-danger)] hover:underline"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logout button */}
      <div className="pt-4">
        <Button
          variant="danger"
          size="md"
          onClick={handleLogout}
          leftIcon={<LogOut className="w-4 h-4" />}
        >
          Đăng xuất khỏi thiết bị này
        </Button>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Đổi mật khẩu"
        description="Nhập mật khẩu hiện tại và tạo mật khẩu mới an toàn"
        maxWidth="md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4 text-left">
          <Input
            label="Mật khẩu hiện tại"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="Mật khẩu mới (tối thiểu 8 ký tự)"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            label="Xác nhận mật khẩu mới"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isChanging}>
              Cập nhật mật khẩu
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AccountSettingsPage;
