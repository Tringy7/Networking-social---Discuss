import React from 'react';
import { useSettingsStore, ACCENT_PRESETS } from '../../store/useSettingsStore';
import { useToastStore } from '../../store/useToastStore';
import Button from '../../components/ui/Button';
import {
  Palette,
  Sun,
  Moon,
  Sparkles,
  Check,
  RotateCcw,
  Layout,
  Type,
  Gauge,
  CheckCircle2,
} from 'lucide-react';

export const AppearanceSettingsPage: React.FC = () => {
  const {
    settings,
    setTheme,
    setAccentColor,
    setDensity,
    setFontSize,
    setAnimationIntensity,
    updateSettings,
    resetDefaults,
  } = useSettingsStore();

  const { addToast } = useToastStore();

  const handleSave = () => {
    addToast('Đã lưu tùy chọn giao diện hiển thị thành công!', 'success');
  };

  const handleReset = () => {
    resetDefaults();
    addToast('Đã khôi phục cài đặt giao diện mặc định!', 'info');
  };

  return (
    <div className="space-y-6 text-left">
      <div className="pb-3 border-b border-[#262C3A]">
        <h2 className="text-lg font-bold text-[#F1F3F7] flex items-center gap-2">
          <Palette className="w-5 h-5 text-[var(--color-orange)]" />
          <span>Giao diện & Bảng màu hài hòa</span>
        </h2>
        <p className="text-xs text-[#959DAA]">
          Cá nhân hóa tông màu chủ đạo, chế độ nền, độ tương phản và mật độ hiển thị để mắt thoải mái nhất.
        </p>
      </div>

      {/* 1. Theme Selection */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-[#F1F3F7] uppercase tracking-wider">
          1. Chế độ màu nền (Theme)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Dark Mode */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              settings.theme === 'dark'
                ? 'bg-[#161922] border-[var(--color-orange)] ring-2 ring-[var(--color-orange-soft)] shadow-lg'
                : 'bg-[#12151B] border-[#262C3A] hover:border-[#343C4E]'
            }`}
          >
            <div className="p-2.5 rounded-xl bg-[#0C0E12] border border-[#262C3A] text-[var(--color-orange)]">
              <Moon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-[#F1F3F7]">
                  Tối ấm êm dịu (DISCUSS Obsidian)
                </span>
                {settings.theme === 'dark' && <Check className="w-4 h-4 text-[var(--color-orange)]" />}
              </div>
              <p className="text-xs text-[#959DAA] mt-1">
                Gam than đá phiến ấm #0C0E12 dịu mắt, chiều sâu không gian cao, chống lóa khi đọc lâu.
              </p>
            </div>
          </button>

          {/* Light Mode */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              settings.theme === 'light'
                ? 'bg-[#FFFFFF] border-[var(--color-orange)] ring-2 ring-[var(--color-orange-soft)] shadow-lg'
                : 'bg-[#F6F7F9] border-[#DFE3E8] hover:border-[#CCD1DA]'
            }`}
          >
            <div className="p-2.5 rounded-xl bg-[#F0F2F5] border border-[#DFE3E8] text-[var(--color-orange)]">
              <Sun className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-[#1A1D23]">
                  Sáng tinh gọn trang nhã (Paper Light)
                </span>
                {settings.theme === 'light' && <Check className="w-4 h-4 text-[var(--color-orange)]" />}
              </div>
              <p className="text-xs text-[#5E6573] mt-1">
                Nền sáng nhẹ nhàng #F6F7F9 thanh thoát, độ tương phản tiêu chuẩn bảo vệ mắt.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Harmonious Accent Color Presets */}
      <div className="space-y-3 pt-3 border-t border-[#262C3A]">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#F1F3F7] uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-orange)]" />
            <span>2. Bộ phối màu chủ đạo hài hòa (Color Palette)</span>
          </label>
          <span className="text-[11px] text-[#959DAA]">Áp dụng toàn bộ hệ thống</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ACCENT_PRESETS.map((preset) => {
            const isSelected = settings.accentColor === preset.primary;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setAccentColor(preset.primary);
                  addToast(`Đã chuyển sang bảng màu: ${preset.name}`, 'info');
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'bg-[#1A1E29] border-[var(--color-orange)] ring-2 ring-[var(--color-orange-soft)] shadow-md'
                    : 'bg-[#12151B] border-[#262C3A] hover:border-[#343C4E] hover:bg-[#161922]'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-5 h-5 rounded-full shadow-inner flex items-center justify-center shrink-0 border border-white/20"
                    style={{ backgroundColor: preset.primary }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </div>
                  <span className="text-xs font-bold text-[#F1F3F7] group-hover:text-white truncate">
                    {preset.name}
                  </span>
                </div>
                <p className="text-[11px] text-[#959DAA] leading-relaxed line-clamp-2">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Density */}
      <div className="space-y-3 pt-2 border-t border-[#262C3A]">
        <label className="text-xs font-bold text-[#F1F3F7] uppercase tracking-wider flex items-center gap-2">
          <Layout className="w-4 h-4 text-[#3B82F6]" />
          <span>3. Mật độ hiển thị khoảng cách (Density)</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setDensity('comfortable')}
            className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
              settings.density === 'comfortable'
                ? 'bg-[var(--color-orange-soft)] border-[var(--color-orange)] text-[var(--color-orange)] font-bold'
                : 'bg-[#12151B] border-[#262C3A] text-[#959DAA] hover:text-[#F1F3F7]'
            }`}
          >
            <div className="text-xs font-bold">Thoáng đãng (Mặc định)</div>
            <div className="text-[11px] text-[#6C7482] mt-0.5">Khoảng đệm tự nhiên, dễ đọc</div>
          </button>

          <button
            type="button"
            onClick={() => setDensity('compact')}
            className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
              settings.density === 'compact'
                ? 'bg-[var(--color-orange-soft)] border-[var(--color-orange)] text-[var(--color-orange)] font-bold'
                : 'bg-[#12151B] border-[#262C3A] text-[#959DAA] hover:text-[#F1F3F7]'
            }`}
          >
            <div className="text-xs font-bold">Thu gọn (Compact)</div>
            <div className="text-[11px] text-[#6C7482] mt-0.5">Hiển thị nhiều bài viết hơn</div>
          </button>
        </div>
      </div>

      {/* 4. Font size */}
      <div className="space-y-3 pt-2 border-t border-[#262C3A]">
        <label className="text-xs font-bold text-[#F1F3F7] uppercase tracking-wider flex items-center gap-2">
          <Type className="w-4 h-4 text-[#22C55E]" />
          <span>4. Cỡ chữ văn bản (Font Size)</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setFontSize(size)}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer capitalize ${
                settings.fontSize === size
                  ? 'bg-[var(--color-orange-soft)] border-[var(--color-orange)] text-[var(--color-orange)] font-bold'
                  : 'bg-[#12151B] border-[#262C3A] text-[#959DAA] hover:text-[#F1F3F7]'
              }`}
            >
              <div className="text-xs font-bold">
                {size === 'small' ? 'Nhỏ (13px)' : size === 'medium' ? 'Vừa (14.5px)' : 'Lớn (16px)'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Sidebar Display Preference */}
      <div className="space-y-3 pt-2 border-t border-[#262C3A]">
        <label className="text-xs font-bold text-[#F1F3F7] uppercase tracking-wider flex items-center gap-2">
          <Layout className="w-4 h-4 text-[var(--color-orange)]" />
          <span>5. Trạng thái thanh điều hướng bên trái (Sidebar)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => updateSettings({ sidebarHidden: false, sidebarCollapsed: false })}
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              !settings.sidebarHidden && !settings.sidebarCollapsed
                ? 'bg-[var(--color-orange-soft)] border-[var(--color-orange)] text-[var(--color-orange)] font-bold'
                : 'bg-[#12151B] border-[#262C3A] text-[#959DAA] hover:text-[#F1F3F7]'
            }`}
          >
            <div className="text-xs font-bold">Hiển thị đầy đủ</div>
            <div className="text-[10px] text-[#6C7482] mt-0.5">Chiều rộng chuẩn 256px</div>
          </button>

          <button
            type="button"
            onClick={() => updateSettings({ sidebarHidden: false, sidebarCollapsed: true })}
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              !settings.sidebarHidden && settings.sidebarCollapsed
                ? 'bg-[var(--color-orange-soft)] border-[var(--color-orange)] text-[var(--color-orange)] font-bold'
                : 'bg-[#12151B] border-[#262C3A] text-[#959DAA] hover:text-[#F1F3F7]'
            }`}
          >
            <div className="text-xs font-bold">Thu gọn icon (64px)</div>
            <div className="text-[10px] text-[#6C7482] mt-0.5">Tiết kiệm diện tích màn hình</div>
          </button>

          <button
            type="button"
            onClick={() => updateSettings({ sidebarHidden: true })}
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              settings.sidebarHidden
                ? 'bg-[var(--color-orange-soft)] border-[var(--color-orange)] text-[var(--color-orange)] font-bold'
                : 'bg-[#12151B] border-[#262C3A] text-[#959DAA] hover:text-[#F1F3F7]'
            }`}
          >
            <div className="text-xs font-bold">Ẩn hoàn toàn (Hidden)</div>
            <div className="text-[10px] text-[#6C7482] mt-0.5">Mở lại từ nút góc trái menu</div>
          </button>
        </div>
      </div>

      {/* 5. Live preview box */}
      <div className="p-4 rounded-2xl bg-[#12151B] border border-[#262C3A] space-y-2">
        <span className="text-[11px] font-bold text-[#6C7482] uppercase tracking-wider block">
          Xem trước giao diện thời gian thực (Live Preview)
        </span>
        <div className="p-4 rounded-xl bg-[#161922] border border-[#262C3A] space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F1F3F7]">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-orange)] shadow-sm" />
            <span>Bài viết thảo luận kỹ thuật mẫu trên DISCUSS</span>
            <span className="text-[10px] text-[var(--color-orange)] bg-[var(--color-orange-soft)] px-2 py-0.5 rounded-full font-semibold">
              Hài hòa
            </span>
          </div>
          <p className="text-xs text-[#959DAA] leading-relaxed">
            Màu sắc mới được cân chỉnh kỹ lưỡng giữa độ sáng nền (#0C0E12) và tông màu điểm nhấn, giảm tối đa ánh sáng xanh gắt giúp trải nghiệm lướt mạng xã hội thoải mái và chuyên nghiệp hơn.
          </p>
          <div className="flex gap-2 pt-1">
            <Button variant="primary" size="sm">
              Nút hành động chính
            </Button>
            <Button variant="outline" size="sm">
              Nút viền
            </Button>
            <Button variant="secondary" size="sm">
              Nút phụ
            </Button>
          </div>
        </div>
      </div>

      {/* Save and Reset */}
      <div className="flex items-center justify-between pt-4 border-t border-[#262C3A]">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-[#6C7482] hover:text-[#F1F3F7] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Khôi phục mặc định</span>
        </button>

        <Button variant="primary" size="md" onClick={handleSave} leftIcon={<Check className="w-4 h-4" />}>
          Lưu tùy chọn giao diện
        </Button>
      </div>
    </div>
  );
};

export default AppearanceSettingsPage;
