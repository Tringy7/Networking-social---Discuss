import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';

export const AccessDeniedPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-[#191A1C] border border-[#303235] space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-[var(--color-danger)]/15 border border-[var(--color-danger)]/30 flex items-center justify-center text-[var(--color-danger)] mx-auto">
          <ShieldX className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-[var(--color-danger)]">
            Lỗi 403 · Access Denied
          </span>
          <h1 className="text-2xl font-black text-[#F5F5F5]">Không có quyền truy cập</h1>
          <p className="text-xs text-[#9A9DA3] leading-relaxed">
            Khu vực này yêu cầu quyền Quản trị viên hoặc quyền quản lý cộng đồng phù hợp. Nếu bạn cần quyền truy cập, hãy liên hệ quản trị viên.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/">
            <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
              Về trang chủ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage;
