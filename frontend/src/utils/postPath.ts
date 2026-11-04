import type { Post } from '../types';

export function postSlug(title: string): string {
  return title.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd').toLowerCase()
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
    .slice(0, 100).replace(/_+$/g, '') || 'bai_viet';
}

export function postPath(post: Pick<Post, 'id' | 'communityName' | 'title'>): string {
  return `/c/${encodeURIComponent(post.communityName)}/comments/${encodeURIComponent(post.id)}/${postSlug(post.title)}/`;
}
