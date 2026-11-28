import { useEffect, useState } from 'react';
import { communityService } from '../../services';

let request: Promise<string> | undefined;
function loadDefault() {
  request ??= communityService.getDefaultRules().catch((error) => { request = undefined; throw error; });
  return request;
}

export function useDefaultCommunityRules(enabled = true) {
  const [markdown, setMarkdown] = useState('');
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setError(false);
    loadDefault().then((value) => { if (active) setMarkdown(value); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [enabled, attempt]);
  return { markdown, error, retry: () => setAttempt((value) => value + 1) };
}
