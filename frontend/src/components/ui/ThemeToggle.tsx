import { Moon, Sun } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

export default function ThemeToggle() {
  const setTheme = useSettingsStore((state) => state.setTheme);
  return <button type="button" className="icon-button theme-toggle" aria-label="Chuyển giao diện sáng hoặc tối" title="Chuyển giao diện sáng hoặc tối"
    onClick={() => setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark')}>
    <Moon className="theme-moon" size={19} aria-hidden="true" />
    <Sun className="theme-sun" size={19} aria-hidden="true" />
  </button>;
}
