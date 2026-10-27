import React from 'react';
import { Link } from 'react-router-dom';
import { User, KeyRound, Lock, Palette, Bell, ChevronRight } from 'lucide-react';

export const GeneralSettingsPage: React.FC = () => {
  const sections = [
    {
      to: '/settings/profile',
      title: 'Hồ sơ cá nhân',
      desc: 'Thay đổi ảnh đại diện, ảnh bìa, tên hiển thị, tiểu sử và thông tin công khai.',
      icon: <User className="w-5 h-5 text-[#FF5700]" />,
    },
    {
      to: '/settings/account',
      title: 'Tài khoản & Đăng nhập',
      desc: 'Quản lý địa chỉ email, đổi mật khẩu và xem các phiên đăng nhập đang hoạt động.',
      icon: <KeyRound className="w-5 h-5 text-[#3B82F6]" />,
    },
    {
      to: '/settings/privacy',
      title: 'Quyền riêng tư & Bảo mật',
      desc: 'Kiểm soát khả năng hiển thị vị trí, ngày sinh và lịch sử bài viết trên trang cá nhân.',
      icon: <Lock className="w-5 h-5 text-[#22C55E]" />,
    },
    {
      to: '/settings/appearance',
      title: 'Giao diện & Hiệu ứng',
      desc: 'Tùy chỉnh Dark/Light mode, màu điểm nhấn DISCUSS Orange, kích cỡ chữ và mật độ.',
      icon: <Palette className="w-5 h-5 text-[#F59E0B]" />,
    },
    {
      to: '/settings/notifications',
      title: 'Tùy chọn thông báo',
      desc: 'Chọn loại thông báo bạn muốn nhận qua ứng dụng hoặc email.',
      icon: <Bell className="w-5 h-5 text-[#A855F7]" />,
    },
  ];

  return (
    <div className="space-y-4 text-left">
      <div className="pb-3 border-b border-[#303235]">
        <h2 className="text-lg font-bold text-[#F5F5F5]">Tổng quan cài đặt</h2>
        <p className="text-xs text-[#9A9DA3]">Chọn một mục để cấu hình trải nghiệm DISCUSS của bạn.</p>
      </div>

      <div className="space-y-3">
        {sections.map((sec) => (
          <Link
            key={sec.to}
            to={sec.to}
            className="flex items-center justify-between p-4 rounded-2xl bg-[#141517] border border-[#303235] hover:border-[#FF5700]/50 hover:bg-[#1E2023] transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#191A1C] border border-[#303235] group-hover:scale-105 transition-transform">
                {sec.icon}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#F5F5F5] group-hover:text-white">
                  {sec.title}
                </h3>
                <p className="text-xs text-[#9A9DA3] mt-0.5">{sec.desc}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#70747C] group-hover:text-[#FF5700] transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default GeneralSettingsPage;
