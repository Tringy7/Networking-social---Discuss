import { useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import type { Post } from '../../types';
import PostMarkdown from './PostMarkdown';
import ImageLightbox from './ImageLightbox';
import { httpUrl } from './postUrls';

type BodyPost = Pick<Post, 'title' | 'content' | 'type' | 'media' | 'linkUrl'>;
export default function PostBody({ post, preview = false }: { post: BodyPost; preview?: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const openedHere = useRef(false);
  const media = post.media || [];
  const mediaUrl = (url: string) => httpUrl(url) || (preview && url.startsWith('blob:') ? url : undefined);
  const attachments = media.filter((item) => !item.inlineImage && mediaUrl(item.url));
  const images = media.filter((item) => item.type === 'IMAGE' && mediaUrl(item.url));
  const selected = images.findIndex((item) => mediaUrl(item.url) === searchParams.get('image'));
  const selectImage = (index: number, replace = false) => {
    const url = mediaUrl(images[index]?.url || '');
    if (!url) return;
    const params = new URLSearchParams(searchParams);
    params.set('image', url);
    setSearchParams(params, { replace, preventScrollReset: true });
  };
  const openImage = (url: string) => {
    const index = images.findIndex((item) => mediaUrl(item.url) === url);
    if (index >= 0) { openedHere.current = true; selectImage(index); }
  };
  const closeImage = () => {
    if (openedHere.current) { openedHere.current = false; navigate(-1); }
    else {
      const params = new URLSearchParams(searchParams);
      params.delete('image');
      setSearchParams(params, { replace: true, preventScrollReset: true });
    }
  };
  const link = httpUrl(post.linkUrl);
  return <div className="post-body-content">
    {post.content && <PostMarkdown content={post.content} images={media.filter((item) => item.type === 'IMAGE')} onImageClick={openImage} />}
    {attachments.length > 0 && <div className="post-media-list">
      {attachments.map((item, index) => <figure key={item.objectKey || item.url} className="post-gallery">
        {item.type === 'VIDEO'
          ? <video src={mediaUrl(item.url)} controls preload="metadata" className="post-gallery-full" />
          : <button type="button" className="post-gallery-image" aria-label={`Xem ảnh ${index + 1} kích thước lớn`} onClick={() => openImage(mediaUrl(item.url)!)}>
            <img src={mediaUrl(item.url)} alt={`${post.title} — ảnh ${index + 1}`} loading="lazy" />
          </button>}
      </figure>)}
    </div>}
    {link && <a className="post-link-card" href={link} target="_blank" rel="noopener noreferrer">
      <ExternalLink size={20} /><span><strong>{new URL(link).hostname}</strong><span>{link}</span></span>
    </a>}
    {selected >= 0 && images[selected] && <ImageLightbox images={images.map((item) => ({ url: mediaUrl(item.url)! }))}
      index={selected} onChange={(index) => selectImage(index, true)} onClose={closeImage} />}
  </div>;
}
