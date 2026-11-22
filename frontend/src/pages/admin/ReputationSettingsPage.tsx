import { useState } from 'react';
import type { FormEvent } from 'react';
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
  { key: 'contributor', label: 'Người đóng góp' },
  { key: 'trusted', label: 'Uy tín (bắt đầu có tick xanh)' },
  { key: 'highlyTrusted', label: 'Uy tín cao' },
] as const;

function ThresholdForm({ thresholds }: { thresholds: Thresholds }) {
  const [values, setValues] = useState(() => ({
    contributor: String(thresholds.contributor),
    trusted: String(thresholds.trusted),
    highlyTrusted: String(thresholds.highlyTrusted),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const addToast = useToastStore(state => state.addToast);

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
      await apiClient.put<Thresholds>(endpoint, payload);
      addToast('Đã lưu ngưỡng điểm uy tín.', 'success');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  }

  return <form onSubmit={submit} className="max-w-lg space-y-4">
    {fields.map(({ key, label }) => (
      <Input key={key} label={label} type="number" min={1} max={2147483647} step={1}
        required disabled={saving} value={values[key]}
        onChange={event => setValues(previous => ({ ...previous, [key]: event.target.value }))} />
    ))}
    {error && <p role="alert" className="text-sm text-[var(--color-danger)]">{error}</p>}
    <Button type="submit" isLoading={saving}>Lưu ngưỡng điểm</Button>
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
