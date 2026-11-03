import { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import type { Post } from '../../types';
import Modal from '../ui/Modal';
import PostMarkdown from './PostMarkdown';
import { httpUrl } from './postUrls';

type BodyPost = Pick<Post, 'title' | 'content' | 'type' | 'media' | 'linkUrl'>;
export default function PostBody({ post, preview = false }: { post: BodyPost; preview?: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  const media = post.media || [];
  const mediaUrl = (url: string) => httpUrl(url) || (preview && url.startsWith('blob:') ? url : undefined);
  const attachments = media.filter((item) => !item.inlineImage && mediaUrl(item.url));
  const current = selected === null ? null : attachments[Math.min(selected, attachments.length - 1)];
  const link = httpUrl(post.linkUrl);
  return <div className="post-body-content">
    {post.content && <PostMarkdown content={post.content} images={media.filter((item) => item.type === 'IMAGE')} />}
    {attachments.length > 0 && <div className="post-media-list">
      {attachments.map((item, index) => <figure key={item.objectKey || item.url} className="post-gallery">
        {item.type === 'VIDEO'
          ? <video src={mediaUrl(item.url)} controls preload="metadata" className="post-gallery-full" />
          : <button type="button" className="post-gallery-image" aria-label={`Xem ảnh ${index + 1} kích thước lớn`} onClick={() => setSelected(index)}>
            <img src={mediaUrl(item.url)} alt={item.caption || `${post.title} — ảnh ${index + 1}`} loading="lazy" />
          </button>}
        {item.caption && <figcaption className="post-media-caption">{item.caption}</figcaption>}
      </figure>)}
    </div>}
    {link && <a className="post-link-card" href={link} target="_blank" rel="noopener noreferrer">
      <ExternalLink size={20} /><span><strong>{new URL(link).hostname}</strong><span>{link}</span></span>
    </a>}
    <Modal isOpen={!!current} onClose={() => setSelected(null)} title={`Media ${(selected ?? 0) + 1} / ${attachments.length}`} maxWidth="4xl">
      {current && (current.type === 'VIDEO'
        ? <video src={mediaUrl(current.url)} controls preload="metadata" className="post-gallery-full" />
        : <img src={mediaUrl(current.url)} alt={current.caption || post.title} className="post-gallery-full" />)}
      {current?.caption && <p className="post-media-caption">{current.caption}</p>}
      {attachments.length > 1 && <div className="post-gallery-controls">
        <button type="button" aria-label="Media trước" onClick={() => setSelected(((selected ?? 0) + attachments.length - 1) % attachments.length)}><ChevronLeft size={18} /></button>
        <span>{(selected ?? 0) + 1} / {attachments.length}</span>
        <button type="button" aria-label="Media tiếp" onClick={() => setSelected(((selected ?? 0) + 1) % attachments.length)}><ChevronRight size={18} /></button>
      </div>}
    </Modal>
  </div>;
}
