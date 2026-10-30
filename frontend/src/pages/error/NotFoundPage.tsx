import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Compass, Home, Search } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-[#191A1C] border border-[#303235] space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-[#FF5700]/15 border border-[#FF5700]/30 flex items-center justify-center text-[#FF5700] mx-auto">
          <Compass className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-[var(--color-orange-ink)]">
            Lỗi 404 · Page Not Found
          </span>
          <h1 className="text-2xl font-black text-[#F5F5F5]">Trang không tồn tại</h1>
          <p className="text-xs text-[#9A9DA3] leading-relaxed">
            Đường dẫn bạn yêu cầu không tồn tại hoặc đã được chuyển sang địa chỉ mới trong hệ thống DISCUSS.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/">
            <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
              Về trang chủ
            </Button>
          </Link>
          <Link to="/explore">
            <Button variant="secondary" size="md" leftIcon={<Search className="w-4 h-4" />}>
              Khám phá cộng đồng
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
