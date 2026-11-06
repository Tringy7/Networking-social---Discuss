import { useCallback, useEffect } from 'react';
import type { Comment } from '../types';
import { usePostStore } from '../store/usePostStore';

function imageExpirations(comments: Comment[]): number[] {
  return comments.flatMap(comment => [
    ...(comment.attachments || []).map(image => Date.parse(image.expiresAt || '')),
    ...imageExpirations(comment.replies || []),
  ]);
}

/** One renewal for the whole post, with retries and foreground-tab recovery. */
export function startCommentImageRefresh(comments: Comment[], refresh: () => Promise<void>): () => void {
  const expirations = imageExpirations(comments);
  if (!expirations.length) return () => {};
  const valid = expirations.filter(Number.isFinite);
  const nextRefresh = valid.length ? Math.min(...valid) - 2 * 60 * 1000 : Date.now() + 12 * 60 * 1000;
  let active = true;
  let pending = false;
  let timer: ReturnType<typeof setTimeout>;
  const renew = async () => {
    if (!active || pending) return;
    pending = true;
    try {
      await refresh();
      if (active) timer = setTimeout(renew, 12 * 60 * 1000);
    } catch {
      if (active) timer = setTimeout(renew, 60 * 1000);
    } finally { pending = false; }
  };
  const resume = () => {
    if (document.visibilityState === 'visible' && Date.now() >= nextRefresh) {
      clearTimeout(timer); void renew();
    }
  };
  timer = setTimeout(renew, Math.max(1000, nextRefresh - Date.now()));
  window.addEventListener('focus', resume);
  document.addEventListener('visibilitychange', resume);
  return () => {
    active = false; clearTimeout(timer);
    window.removeEventListener('focus', resume);
    document.removeEventListener('visibilitychange', resume);
  };
}

export function useCommentImageRefresh(postId: string | undefined, comments: Comment[] | undefined) {
  const refreshCommentImages = usePostStore(state => state.refreshCommentImages);
  const refresh = useCallback(() => postId ? refreshCommentImages(postId) : Promise.resolve(), [postId, refreshCommentImages]);
  useEffect(() => {
    if (postId) return startCommentImageRefresh(comments || [], refresh);
  }, [postId, comments, refresh]);
  return refresh;
}
