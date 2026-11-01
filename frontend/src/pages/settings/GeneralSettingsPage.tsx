import React from 'react';
import { Link } from 'react-router-dom';
import { User, KeyRound, Lock, Palette, Bell, ChevronRight } from 'lucide-react';

export const GeneralSettingsPage: React.FC = () => {
  const sections = [
    {
      to: '/settings/profile',
      title: 'Hồ sơ cá nhân',
      desc: 'Thay đổi ảnh đại diện, ảnh bìa, tên hiển thị, tiểu sử và thông tin công khai.',
      icon: <User className="w-5 h-5 text-[var(--text-secondary)]" />,
    },
    {
      to: '/settings/account',
      title: 'Tài khoản & Đăng nhập',
      desc: 'Quản lý địa chỉ email, đổi mật khẩu và xem các phiên đăng nhập đang hoạt động.',
      icon: <KeyRound className="w-5 h-5 text-[var(--text-secondary)]" />,
    },
    {
      to: '/settings/privacy',
      title: 'Quyền riêng tư & Bảo mật',
      desc: 'Kiểm soát khả năng hiển thị vị trí, ngày sinh và lịch sử bài viết trên trang cá nhân.',
      icon: <Lock className="w-5 h-5 text-[var(--text-secondary)]" />,
    },
    {
      to: '/settings/appearance',
      title: 'Giao diện & Hiệu ứng',
      desc: 'Tùy chỉnh màu điểm nhấn, kích cỡ chữ, mật độ nội dung và chuyển động.',
      icon: <Palette className="w-5 h-5 text-[var(--text-secondary)]" />,
    },
    {
      to: '/settings/notifications',
      title: 'Tùy chọn thông báo',
      desc: 'Chọn loại thông báo bạn muốn nhận qua ứng dụng hoặc email.',
      icon: <Bell className="w-5 h-5 text-[var(--text-secondary)]" />,
    },
  ];

  return (
    <div className="space-y-4 text-left">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Tổng quan cài đặt</h2>
        <p className="text-sm text-[var(--text-secondary)]">Chọn một mục để cấu hình trải nghiệm DISCUSS của bạn.</p>
      </div>

      <div className="space-y-3">
        {sections.map((sec) => (
          <Link
            key={sec.to}
            to={sec.to}
            className="settings-overview-row group flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex shrink-0 items-center justify-center">
                {sec.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {sec.title}
                </h3>
                <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">{sec.desc}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--color-orange)] transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default GeneralSettingsPage;
