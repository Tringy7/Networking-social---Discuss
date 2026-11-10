import { useEffect, useState } from 'react';

export default function useAdminResource<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let current = true;
    setLoading(true); setError(''); setData(null);
    load().then(value => { if (current) setData(value); })
      .catch((cause: unknown) => { if (current) setError(cause instanceof Error ? cause.message : 'Không thể tải dữ liệu.'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [load, revision]);
  return { data, loading, error, reload: () => setRevision(value => value + 1) };
}
