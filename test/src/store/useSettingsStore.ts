import { create } from 'zustand';
import { AppearanceSettings } from '../types';

export interface AccentColorPreset {
  id: string;
  name: string;
  primary: string;
  hover: string;
  soft: string;
  border: string;
  description: string;
}

export const ACCENT_PRESETS: AccentColorPreset[] = [
  {
    id: 'sunset',
    name: 'Sunset Amber (Mặc định hài hòa)',
    primary: '#F05A28',
    hover: '#D94818',
    soft: 'rgba(240, 90, 40, 0.12)',
    border: 'rgba(240, 90, 40, 0.28)',
    description: 'Tông cam hoàng hôn ấm áp, êm dịu cho mắt, tương phản tự nhiên',
  },
  {
    id: 'tangerine',
    name: 'Vivid Tangerine',
    primary: '#FF5700',
    hover: '#E94B00',
    soft: 'rgba(255, 87, 0, 0.12)',
    border: 'rgba(255, 87, 0, 0.28)',
    description: 'Màu cam rực rỡ phong cách Reddit cổ điển',
  },
  {
    id: 'blue',
    name: 'Sapphire Ocean',
    primary: '#2563EB',
    hover: '#1D4ED8',
    soft: 'rgba(37, 99, 235, 0.12)',
    border: 'rgba(37, 99, 235, 0.28)',
    description: 'Xanh lam công nghệ hiện đại, thanh lịch và tập trung cao',
  },
  {
    id: 'emerald',
    name: 'Emerald Pine',
    primary: '#059669',
    hover: '#047857',
    soft: 'rgba(5, 150, 105, 0.12)',
    border: 'rgba(5, 150, 105, 0.28)',
    description: 'Xanh ngọc lục bảo tươi mát, dễ chịu khi đọc nhiều văn bản',
  },
  {
    id: 'purple',
    name: 'Amethyst Violet',
    primary: '#7C3AED',
    hover: '#6D28D9',
    soft: 'rgba(124, 58, 237, 0.12)',
    border: 'rgba(124, 58, 237, 0.28)',
    description: 'Tím thạch anh sáng tạo, phong cách thiết kế sản phẩm cao cấp',
  },
  {
    id: 'rose',
    name: 'Coral Rose',
    primary: '#E11D48',
    hover: '#BE123C',
    soft: 'rgba(225, 29, 72, 0.12)',
    border: 'rgba(225, 29, 72, 0.28)',
    description: 'Hồng san hô nổi bật, trẻ trung và cá tính',
  },
];

interface SettingsState {
  settings: AppearanceSettings;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setAccentColor: (colorHex: string) => void;
  setDensity: (density: 'comfortable' | 'compact') => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setAnimationIntensity: (intensity: 'full' | 'reduced' | 'off') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarHidden: () => void;
  setSidebarHidden: (hidden: boolean) => void;
  updateSettings: (newSettings: Partial<AppearanceSettings>) => void;
  resetDefaults: () => void;
}

const DEFAULT_SETTINGS: AppearanceSettings = {
  theme: 'dark',
  accentColor: '#F05A28', // Harmonious Sunset Amber by default
  density: 'comfortable',
  fontSize: 'medium',
  animationIntensity: 'full',
  sidebarCollapsed: false,
  sidebarHidden: false,
  feedLayout: 'card',
};

const getInitialSettings = (): AppearanceSettings => {
  try {
    const saved = localStorage.getItem('discuss_settings');
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_SETTINGS;
};

const applyDOMClasses = (settings: AppearanceSettings) => {
  const root = document.documentElement;
  
  // Theme
  if (settings.theme === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
  }

  // Accent Color injection into CSS variables
  const matchedPreset = ACCENT_PRESETS.find((p) => p.primary === settings.accentColor) || ACCENT_PRESETS[0];
  root.style.setProperty('--color-orange', matchedPreset.primary);
  root.style.setProperty('--color-orange-hover', matchedPreset.hover);
  root.style.setProperty('--color-orange-soft', matchedPreset.soft);
  root.style.setProperty('--color-orange-border', matchedPreset.border);

  // Density
  root.classList.remove('density-comfortable', 'density-compact');
  root.classList.add(`density-${settings.density}`);

  // Font size
  root.classList.remove('font-size-sm', 'font-size-md', 'font-size-lg');
  const sizeClass = settings.fontSize === 'small' ? 'font-size-sm' : settings.fontSize === 'large' ? 'font-size-lg' : 'font-size-md';
  root.classList.add(sizeClass);
};

export const useSettingsStore = create<SettingsState>((set, get) => {
  const initial = getInitialSettings();
  if (typeof document !== 'undefined') {
    applyDOMClasses(initial);
  }

  const persist = (settings: AppearanceSettings) => {
    localStorage.setItem('discuss_settings', JSON.stringify(settings));
    applyDOMClasses(settings);
  };

  return {
    settings: initial,
    setTheme: (theme) => {
      const updated = { ...get().settings, theme };
      persist(updated);
      set({ settings: updated });
    },
    setAccentColor: (accentColor) => {
      const updated = { ...get().settings, accentColor };
      persist(updated);
      set({ settings: updated });
    },
    setDensity: (density) => {
      const updated = { ...get().settings, density };
      persist(updated);
      set({ settings: updated });
    },
    setFontSize: (fontSize) => {
      const updated = { ...get().settings, fontSize };
      persist(updated);
      set({ settings: updated });
    },
    setAnimationIntensity: (animationIntensity) => {
      const updated = { ...get().settings, animationIntensity };
      persist(updated);
      set({ settings: updated });
    },
    toggleSidebar: () => {
      // If currently hidden, opening it restores visibility
      const wasHidden = get().settings.sidebarHidden;
      const updated = {
        ...get().settings,
        sidebarHidden: false,
        sidebarCollapsed: wasHidden ? false : !get().settings.sidebarCollapsed,
      };
      persist(updated);
      set({ settings: updated });
    },
    setSidebarCollapsed: (collapsed) => {
      const updated = { ...get().settings, sidebarCollapsed: collapsed };
      persist(updated);
      set({ settings: updated });
    },
    toggleSidebarHidden: () => {
      const updated = { ...get().settings, sidebarHidden: !get().settings.sidebarHidden };
      persist(updated);
      set({ settings: updated });
    },
    setSidebarHidden: (hidden) => {
      const updated = { ...get().settings, sidebarHidden: hidden };
      persist(updated);
      set({ settings: updated });
    },
    updateSettings: (newSettings) => {
      const updated = { ...get().settings, ...newSettings };
      persist(updated);
      set({ settings: updated });
    },
    resetDefaults: () => {
      persist(DEFAULT_SETTINGS);
      set({ settings: DEFAULT_SETTINGS });
    },
  };
});
