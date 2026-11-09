import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Logo from '../components/common/Logo';
import Avatar from '../components/ui/Avatar';
import DevRoleSwitcher from '../components/common/DevRoleSwitcher';
import { Heart, MessageSquare, Sparkles, Users, Code, Cpu, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0C0E12] text-[#F5F5F5] flex flex-col lg:flex-row antialiased overflow-hidden">
      {/* LEFT PANEL: BRAND EXPERIENCE (52 - 55% on desktop) */}
      <div className="relative hidden lg:flex lg:w-[54%] bg-gradient-to-br from-[#0F1217] via-[#131720] to-[#161922] border-r border-[#262C3A] p-10 xl:p-14 flex-col justify-between overflow-hidden">
        {/* Subtle orange ambient glow backgrounds */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[var(--color-orange)]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[var(--color-orange)]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10">
          <Logo size="lg" showTagline />
        </div>

        {/* Center Visual Showcase */}
        <div className="relative z-10 max-w-xl my-auto space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl xl:text-4xl font-extrabold text-[#F5F5F5] tracking-tight leading-tight">
              Nơi những cộng đồng <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-orange)] via-[var(--color-orange)] to-[#FFB066]">
                tạo nên khác biệt.
              </span>
            </h1>
            <p className="text-sm xl:text-base text-[#9A9DA3] leading-relaxed max-w-lg">
              Khám phá sở thích, chia sẻ kiến thức chuyên sâu và kết nối với hàng nghìn lập trình viên, nhà thiết kế cùng chung đam mê.
            </p>
          </div>

          {/* Floating Mock Cards Composition */}
          <div className="relative pt-2 pb-6 space-y-3">
            {/* Mock Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-4 rounded-2xl bg-[#161922]/90 backdrop-blur-md border border-[#262C3A] shadow-xl shadow-black/40 space-y-2.5 max-w-md transform hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[var(--color-orange-soft)] flex items-center justify-center text-[var(--color-orange)]">
                    <Code className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-[#F5F5F5]">Lập trình Việt Nam</span>
                  <span className="text-[11px] text-[#70747C]">· vừa xong</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[var(--color-orange)] bg-[var(--color-orange-soft)] px-2 py-0.5 rounded-full font-medium">
                  <Sparkles className="w-3 h-3" />
                  <span>Thịnh hành</span>
                </div>
              </div>
              <p className="text-xs text-[#9A9DA3] font-medium leading-relaxed">
                "Kiến trúc Spring Boot 3 kết hợp React 19 tối ưu hóa tốc độ tải trang tới 40% cho ứng dụng mạng xã hội."
              </p>
              <div className="flex items-center gap-4 text-xs text-[#70747C] pt-1 border-t border-[#262C3A]/60">
                <span className="flex items-center gap-1 text-[var(--color-orange)]">
                  <Heart className="w-3.5 h-3.5 fill-[var(--color-orange)]" /> 342
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> 28 bình luận
                </span>
              </div>
            </motion.div>

            {/* Mock Card 2 (Offset Right) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="ml-8 p-3.5 rounded-2xl bg-[#1E232F]/90 backdrop-blur-md border border-[#262C3A] shadow-lg shadow-black/30 space-y-2 max-w-sm transform hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-[#F5F5F5]">Trí tuệ nhân tạo & AI Việt</span>
              </div>
              <p className="text-xs text-[#9A9DA3]">
                "Thử nghiệm Gemini 2.5 Flash phân tích vi phạm nội dung cộng đồng thời gian thực."
              </p>
              <div className="flex items-center gap-3 text-[11px] text-[#70747C]">
                <span className="flex items-center gap-1 text-[var(--color-orange)]">
                  <Heart className="w-3 h-3 fill-[var(--color-orange)]" /> 167
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> 142k thành viên
                </span>
              </div>
            </motion.div>
          </div>

          {/* Metrics summary */}
          <div className="flex items-center gap-6 pt-2">
            <div>
              <div className="text-xl font-bold text-[#F5F5F5]">120,000+</div>
              <div className="text-xs text-[#70747C]">Thành viên hoạt động</div>
            </div>
            <div className="w-px h-8 bg-[#262C3A]" />
            <div>
              <div className="text-xl font-bold text-[#F5F5F5]">85+</div>
              <div className="text-xs text-[#70747C]">Cộng đồng chuyên đề</div>
            </div>
            <div className="w-px h-8 bg-[#262C3A]" />
            <div>
              <div className="text-xl font-bold text-[#F5F5F5]">310k+</div>
              <div className="text-xs text-[#70747C]">Bài viết chia sẻ</div>
            </div>
          </div>
        </div>

        {/* Footer brand signature */}
        <div className="relative z-10 flex items-center justify-between text-xs text-[#70747C]">
          <span>Kết nối đam mê. Chia sẻ tri thức.</span>
          <span>© 2026 DISCUSS</span>
        </div>
      </div>

      {/* RIGHT PANEL: AUTH FORM (45 - 48% on desktop) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 bg-[#0C0E12] overflow-y-auto min-h-screen">
        {/* Mobile Header with Logo */}
        <div className="lg:hidden w-full max-w-md mb-8 flex items-center justify-between">
          <Logo size="md" />
          <Link to="/" className="text-xs text-[var(--color-orange)] hover:underline">
            Quay lại trang chủ
          </Link>
        </div>

        {/* Form Container (380px - 440px wide) */}
        <div className="w-full max-w-[420px] my-auto">
          <Outlet />
        </div>

        {/* Terms footer */}
        <div className="mt-8 text-center text-xs text-[#70747C] max-w-sm">
          Bằng cách tiếp tục, bạn đồng ý với{' '}
          <Link to="/c/lap-trinh-viet-nam" className="text-[#9A9DA3] hover:text-[var(--color-orange)] underline">
            Điều khoản dịch vụ
          </Link>{' '}
          và{' '}
          <Link to="/settings/privacy" className="text-[#9A9DA3] hover:text-[var(--color-orange)] underline">
            Chính sách quyền riêng tư
          </Link>{' '}
          của DISCUSS.
        </div>
      </div>

      <DevRoleSwitcher />
    </div>
  );
};

export default AuthLayout;
