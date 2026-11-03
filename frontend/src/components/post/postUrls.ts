import type { PostImage } from '../../types';

export function httpUrl(value?: string | null): string | undefined {
  if (!value || !/^https?:\/\//i.test(value)) return undefined;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}

// A Markdown image can only address a server-verified attachment, never an arbitrary URL.
export function markdownImageUrl(token: string | undefined, images: PostImage[]): string | undefined {
  if (!token?.startsWith('post-image:')) return undefined;
  return httpUrl(images.find((image) => image.objectKey === token.slice(11))?.url);
}

export function markdownImageKeys(markdown: string): string[] {
  return [...new Set([...markdown.matchAll(/post-image:([A-Za-z0-9_./-]+)/g)].map((match) => match[1]))];
}
