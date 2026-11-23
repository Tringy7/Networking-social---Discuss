import { useState } from 'react';
import type { FormEvent } from 'react';
import { Award, BadgeCheck, Save, Sparkles } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminUI.jsx';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import useAdminResource from '../../hooks/useAdminResource';
import apiClient from '../../services/apiClient';
import { useToastStore } from '../../store/useToastStore';

type Thresholds = { contributor: number; trusted: number; highlyTrusted: number };
const endpoint = '/admin/reputation/thresholds';
const loadThresholds = () => apiClient.get<Thresholds>(endpoint);
const fields = [
  { key: 'contributor', label: 'Người đóng góp', icon: Sparkles, tone: 'text-[var(--color-orange-ink)] bg-[var(--color-orange-soft)]' },
  { key: 'trusted', label: 'Uy tín', icon: BadgeCheck, tone: 'text-[var(--color-info)] bg-[var(--color-info)]/10' },
  { key: 'highlyTrusted', label: 'Uy tín cao', icon: Award, tone: 'text-[var(--admin-positive)] bg-[var(--admin-positive-bg)]' },
] as const;

function thresholdValues(thresholds: Thresholds) {
  return {
    contributor: String(thresholds.contributor),
    trusted: String(thresholds.trusted),
    highlyTrusted: String(thresholds.highlyTrusted),
  };
}

function ThresholdForm({ thresholds }: { thresholds: Thresholds }) {
  const [savedValues, setSavedValues] = useState(() => thresholdValues(thresholds));
  const [values, setValues] = useState(savedValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const addToast = useToastStore(state => state.addToast);
  const hasChanges = fields.some(({ key }) => values[key] !== savedValues[key]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      contributor: Number(values.contributor),
      trusted: Number(values.trusted),
      highlyTrusted: Number(values.highlyTrusted),
    };
    if (!Object.values(payload).every(value => Number.isInteger(value) && value > 0 && value <= 2147483647)
      || payload.contributor >= payload.trusted || payload.trusted >= payload.highlyTrusted) {
      setError('Nhập ba số nguyên dương theo thứ tự tăng dần.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = thresholdValues(await apiClient.put<Thresholds>(endpoint, payload));
      setSavedValues(saved);
      setValues(saved);
      addToast('Đã lưu ngưỡng điểm uy tín.', 'success');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  }

  return <form onSubmit={submit} aria-labelledby="reputation-thresholds-title"
    className="max-w-3xl overflow-hidden rounded-[var(--radius-card)] border border-[var(--admin-line)]">
    <div className="flex items-center justify-between gap-4 border-b border-[var(--admin-line)] bg-[var(--admin-frame)] px-4 py-3 sm:px-6">
      <h2 id="reputation-thresholds-title" className="text-sm font-semibold">Hạng uy tín</h2>
      <span className="text-xs font-medium text-[var(--text-secondary)]">Điểm tối thiểu</span>
    </div>
    <div className="divide-y divide-[var(--admin-line)] px-4 sm:px-6">
      {fields.map(({ key, label, icon: Icon, tone }) => (
        <div key={key} className="grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
          <div className="flex min-w-0 items-center gap-3">
            <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${tone}`}>
              <Icon size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <label htmlFor={`reputation-${key}`} className="block text-sm font-semibold">{label}</label>
              {key === 'trusted' && <p id="reputation-badge-note" className="mt-0.5 text-xs text-[var(--text-secondary)]">Bắt đầu có tick xanh</p>}
            </div>
          </div>
          <Input id={`reputation-${key}`} type="number" min={1} max={2147483647} step={1} inputMode="numeric"
            required disabled={saving} value={values[key]} className="text-right tabular-nums"
            aria-describedby={key === 'trusted' ? 'reputation-badge-note' : undefined}
            onChange={event => {
              setValues(previous => ({ ...previous, [key]: event.target.value }));
              setError('');
            }} />
        </div>
      ))}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--admin-line)] bg-[var(--admin-frame)] px-4 py-4 sm:px-6">
      <div className="text-sm text-[var(--text-secondary)]">
        {error ? <p role="alert" className="text-[var(--color-danger)]">{error}</p>
          : <p role="status">{hasChanges ? 'Có thay đổi chưa lưu' : 'Đang dùng các ngưỡng trên'}</p>}
      </div>
      <div className="ml-auto flex flex-wrap justify-end gap-2">
        {hasChanges && <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => {
          setValues(savedValues);
          setError('');
        }}>Hoàn tác</Button>}
        <Button type="submit" size="sm" disabled={!hasChanges} isLoading={saving}
          leftIcon={<Save size={15} aria-hidden="true" />}>Lưu ngưỡng điểm</Button>
      </div>
    </div>
  </form>;
}

export default function ReputationSettingsPage() {
  const { data, loading, error, reload } = useAdminResource(loadThresholds);

  return <section className="space-y-5">
    <AdminPageHeader title="Cấu hình điểm uy tín"
      description="Ngưỡng mới áp dụng khi người dùng tải lại hồ sơ." />
    {loading && <p role="status">Đang tải cấu hình…</p>}
    {error && <div role="alert" className="space-y-2">
      <p>{error}</p>
      <Button size="sm" variant="secondary" onClick={reload}>Thử lại</Button>
    </div>}
    {data && <ThresholdForm thresholds={data} />}
  </section>;
}
