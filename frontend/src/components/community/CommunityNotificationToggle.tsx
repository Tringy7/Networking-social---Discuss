import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import { notificationService } from '../../services';
import { useToastStore } from '../../store/useToastStore';

export default function CommunityNotificationToggle({ name, iconOnly = false }: { name: string; iconOnly?: boolean }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(true);
  const notify = useToastStore(state => state.addToast);

  useEffect(() => {
    let active = true;
    notificationService.getCommunityNotificationPreference(name)
      .then(result => { if (active) setEnabled(result.newPostEnabled); })
      .catch(() => { if (active) setEnabled(null); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [name]);

  const toggle = async () => {
    setBusy(true);
    try {
      const response = enabled === null
        ? await notificationService.getCommunityNotificationPreference(name)
        : await notificationService.updateCommunityNotificationPreference(name, !enabled);
      setEnabled(response.newPostEnabled);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể cập nhật thông báo cộng đồng.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const status = enabled === null ? 'Tải tùy chọn thông báo' : enabled ? 'Thông báo bài mới đang bật' : 'Thông báo bài mới đang tắt';
  if (iconOnly) {
    const label = enabled === null ? status : 'Thông báo bài mới';
    return <button type="button" className="icon-button" disabled={busy} aria-busy={busy || undefined}
      aria-label={label} title={status} aria-pressed={enabled ?? undefined} onClick={() => void toggle()}>
      {busy ? <Loader2 size={18} className="animate-spin" /> : enabled === false ? <BellOff size={18} /> : <Bell size={18} />}
    </button>;
  }

  return <Button size="sm" variant="secondary" isLoading={busy} aria-pressed={enabled ?? undefined}
    onClick={() => void toggle()} leftIcon={enabled === false ? <BellOff size={15} /> : <Bell size={15} />}>
    {status}
  </Button>;
}
