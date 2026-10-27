import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { UserRole } from '../../types';
import { UserCog, ChevronUp, ChevronDown, Check, Info } from 'lucide-react';

export const DevRoleSwitcher: React.FC = () => {
  const { activeRole, setRole, user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const roles: { label: string; role: UserRole; desc: string }[] = [
    { label: 'Khách (Guest)', role: 'GUEST', desc: 'Chưa đăng nhập, nút login prompt' },
    { label: 'Thành viên (User)', role: 'USER', desc: 'Người dùng thường' },
    { label: 'Kiểm duyệt (Mod)', role: 'MODERATOR', desc: 'Có quyền duyệt bài & báo cáo' },
    { label: 'Trưởng nhóm (Owner)', role: 'OWNER', desc: 'Quản lý cài đặt cộng đồng' },
    { label: 'Quản trị viên (Admin)', role: 'ADMIN', desc: 'Toàn quyền dashboard /admin' },
  ];

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#191A1C] border border-[#FF5700]/50 text-xs font-semibold text-[#FF5700] shadow-lg shadow-black/50 hover:bg-[#222426] transition-all cursor-pointer"
          title="Chuyển đổi vai trò để kiểm thử giao diện"
        >
          <UserCog className="w-3.5 h-3.5 text-[#FF5700]" />
          <span>Role Test: {activeRole}</span>
          {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>

        {isOpen && (
          <div className="absolute bottom-10 left-0 w-72 p-3 bg-[#191A1C] border border-[#303235] rounded-2xl shadow-2xl text-left space-y-2.5">
            <div className="flex items-start gap-2 text-[11px] text-[#9A9DA3] bg-[#222426] p-2 rounded-lg border border-[#303235]">
              <Info className="w-3.5 h-3.5 text-[#FF5700] shrink-0 mt-0.5" />
              <span>Chế độ mô phỏng UI testing cho giảng viên & hội đồng duyệt các trang phân quyền.</span>
            </div>

            <div className="space-y-1">
              {roles.map((item) => (
                <button
                  key={item.role}
                  onClick={() => {
                    setRole(item.role);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    activeRole === item.role
                      ? 'bg-[#FF5700]/15 text-[#FF5700] font-semibold border border-[#FF5700]/30'
                      : 'text-[#9A9DA3] hover:text-[#F5F5F5] hover:bg-[#222426]'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-[10px] text-[#70747C]">{item.desc}</div>
                  </div>
                  {activeRole === item.role && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
            </div>

            {user && (
              <div className="pt-2 border-t border-[#303235] text-[11px] text-[#70747C]">
                Đang đăng nhập: <span className="text-[#F5F5F5] font-medium">@{user.username}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DevRoleSwitcher;
