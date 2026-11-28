import { create } from 'zustand';
import { AppearanceSettings } from '../types';

interface AccentColorPreset {
  id: string;
  name: string;
  primary: string;
  ink: string;
  hover: string;
  soft: string;
  border: string;
  description: string;
}

export const ACCENT_PRESETS: AccentColorPreset[] = [
  {
    id: 'monochrome',
    name: 'Trắng đen (Mặc định)',
    primary: '#171717',
    ink: '#171717',
    hover: '#243041',
    soft: '#EDF0F5',
    border: '#CDD5E0',
    description: 'Trắng đen với điểm nhấn xanh đen',
  },
  {
    id: 'tangerine',
    name: 'Vivid Tangerine',
    primary: '#FF5700',
    ink: '#A8370A',
    hover: '#E94B00',
    soft: 'rgba(255, 87, 0, 0.12)',
    border: 'rgba(255, 87, 0, 0.28)',
    description: 'Màu cam rực rỡ phong cách Reddit cổ điển',
  },
  {
    id: 'blue',
    name: 'Sapphire Ocean',
    primary: '#2563EB',
    ink: '#1D4ED8',
    hover: '#1D4ED8',
    soft: 'rgba(37, 99, 235, 0.12)',
    border: 'rgba(37, 99, 235, 0.28)',
    description: 'Xanh lam công nghệ hiện đại, thanh lịch và tập trung cao',
  },
  {
    id: 'emerald',
    name: 'Emerald Pine',
    primary: '#059669',
    ink: '#056348',
    hover: '#047857',
    soft: 'rgba(5, 150, 105, 0.12)',
    border: 'rgba(5, 150, 105, 0.28)',
    description: 'Xanh ngọc lục bảo tươi mát, dễ chịu khi đọc nhiều văn bản',
  },
  {
    id: 'purple',
    name: 'Amethyst Violet',
    primary: '#7C3AED', // taste-skill-ignore: preserve the existing user-selectable accent preset; DISCUSS defaults to orange.
    ink: '#6D28D9', // taste-skill-ignore: preserve the existing user-selectable accent preset; DISCUSS defaults to orange.
    hover: '#6D28D9', // taste-skill-ignore: preserve the existing user-selectable accent preset; DISCUSS defaults to orange.
    soft: 'rgba(124, 58, 237, 0.12)',
    border: 'rgba(124, 58, 237, 0.28)',
    description: 'Tím thạch anh sáng tạo, phong cách thiết kế sản phẩm cao cấp',
  },
  {
    id: 'rose',
    name: 'Coral Rose',
    primary: '#E11D48',
    ink: '#BE123C',
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
  theme: 'light',
  accentColor: ACCENT_PRESETS[0].primary,
  density: 'comfortable',
  fontSize: 'medium',
  animationIntensity: 'full',
  sidebarCollapsed: false,
  sidebarHidden: false,
  feedLayout: 'card',
};

const normalizeAccentColor = (color: string) =>
  ['#F97316', '#F05A28', '#E04D1B', '#A6452D'].includes(color.toUpperCase()) ? DEFAULT_SETTINGS.accentColor : color;

const getInitialSettings = (): AppearanceSettings => {
  try {
    const saved = localStorage.getItem('discuss_settings');
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<AppearanceSettings>;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        theme: parsed.theme ?? DEFAULT_SETTINGS.theme,
        accentColor: normalizeAccentColor(parsed.accentColor ?? DEFAULT_SETTINGS.accentColor),
      };
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_SETTINGS;
};

const applyDOMClasses = (settings: AppearanceSettings) => {
  const root = document.documentElement;
  root.dataset.motion = settings.animationIntensity;
  
  // Theme
  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }

  // The default accent follows the active theme. Custom accents override it.
  const matchedPreset = ACCENT_PRESETS.find((p) => p.primary === settings.accentColor) || ACCENT_PRESETS[0];
  if (matchedPreset.id === 'monochrome') {
    const properties = ['--color-orange', '--color-orange-ink', '--color-orange-hover', '--color-orange-soft',
      '--color-orange-border', '--action-ink', '--action-hover'];
    properties.forEach((property) => root.style.removeProperty(property));
  } else {
    root.style.setProperty('--color-orange', matchedPreset.primary);
    root.style.setProperty('--color-orange-ink', isDark
      ? `color-mix(in srgb, ${matchedPreset.primary} 60%, white)`
      : matchedPreset.ink);
    root.style.setProperty('--color-orange-hover', matchedPreset.hover);
    root.style.setProperty('--color-orange-soft', matchedPreset.soft);
    root.style.setProperty('--color-orange-border', matchedPreset.border);

    const channels = matchedPreset.primary.match(/[a-f0-9]{2}/gi)!.map((channel) => parseInt(channel, 16));
    const rgb = channels.map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });
    const luminance = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    const darkInk = (luminance + 0.05) / 0.061 >= 1.05 / (luminance + 0.05);
    root.style.setProperty('--action-ink', darkInk ? '#171717' : '#FFFFFF');
    const hover = channels.map((value) =>
      Math.round(darkInk ? value + (255 - value) * 0.08 : value * 0.92).toString(16).padStart(2, '0')
    ).join('');
    root.style.setProperty('--action-hover', `#${hover}`);
  }
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
      const updated = {
        ...get().settings,
        sidebarHidden: false,
        sidebarCollapsed: !get().settings.sidebarCollapsed,
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
      updated.accentColor = normalizeAccentColor(updated.accentColor);
      persist(updated);
      set({ settings: updated });
    },
    resetDefaults: () => {
      persist(DEFAULT_SETTINGS);
      set({ settings: DEFAULT_SETTINGS });
    },
  };
});

if (typeof window !== 'undefined') {
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  systemTheme.addEventListener('change', () => {
    const settings = useSettingsStore.getState().settings;
    if (settings.theme === 'system') applyDOMClasses(settings);
  });
}
