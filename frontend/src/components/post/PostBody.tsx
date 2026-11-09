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
  const galleryImages = attachments.filter((item) => item.type === 'IMAGE');
  const videos = attachments.filter((item) => item.type === 'VIDEO');
  const visibleImages = galleryImages.slice(0, 6);
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
    {galleryImages.length > 0 && <div className="post-media-grid" data-count={Math.min(galleryImages.length, 6)} aria-label={`${galleryImages.length} ảnh đính kèm`}>
      {visibleImages.map((item, index) => <button key={item.objectKey || item.url} type="button"
        className="post-gallery-image post-media-tile"
        aria-label={index === 5 && galleryImages.length > 6 ? `Xem ảnh ${index + 1}, còn ${galleryImages.length - 6} ảnh khác` : `Xem ảnh ${index + 1} kích thước lớn`}
        onClick={() => openImage(mediaUrl(item.url)!)}>
        <img src={mediaUrl(item.url)} alt={item.caption || `${post.title} — ảnh ${index + 1}`} loading="lazy" />
        {index === 5 && galleryImages.length > 6 && <span className="post-media-more" aria-hidden="true">+{galleryImages.length - 6}</span>}
      </button>)}
    </div>}
    {videos.length > 0 && <div className="post-media-list">
      {videos.map((item) => <figure key={item.objectKey || item.url} className="post-gallery">
        <video src={mediaUrl(item.url)} controls preload="metadata" className="post-gallery-full" />
      </figure>)}
    </div>}
    {link && <a className="post-link-card" href={link} target="_blank" rel="noopener noreferrer">
      <ExternalLink size={20} /><span><strong>{new URL(link).hostname}</strong><span>{link}</span></span>
    </a>}
    {selected >= 0 && images[selected] && <ImageLightbox images={images.map((item) => ({ url: mediaUrl(item.url)!, alt: item.caption || post.title }))}
      index={selected} onChange={(index) => selectImage(index, true)} onClose={closeImage} />}
  </div>;
}
