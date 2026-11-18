import { useSearchParams } from 'react-router-dom';

export default function useAdminQuery() {
  const [params, setParams] = useSearchParams();
  const raw = Number(params.get('page') || 0);
  const page = Number.isSafeInteger(raw) && raw >= 0 ? raw : 0;
  const size = [10, 20, 50].includes(Number(params.get('size'))) ? Number(params.get('size')) : 10;
  const update = (values: Record<string, string>, replace = false) => setParams(previous => {
    const next = new URLSearchParams(previous);
    if (!('page' in values)) next.delete('page');
    Object.entries(values).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    return next;
  }, { replace });
  return { params, page, size, update, reset: () => setParams({}) };
}
