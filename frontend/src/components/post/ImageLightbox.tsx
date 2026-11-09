import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import './postContent.css';

export default function ImageLightbox({ images, index, onChange, onClose }: {
  images: { url: string; alt?: string }[];
  index: number; onChange: (index: number) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = overflow; };
  }, []);
  const current = images[index];
  if (!current) return null;
  const move = (offset: number) => onChange((index + offset + images.length) % images.length);
  return createPortal(<dialog ref={dialog} className="post-lightbox" aria-label="Xem ảnh kích thước lớn"
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => { event.stopPropagation(); if (event.target === event.currentTarget) onClose(); }}
    onKeyDown={(event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    }}>
    <button autoFocus type="button" className="post-lightbox-close" aria-label="Đóng ảnh" onClick={onClose}><X /></button>
    <img className="post-lightbox-image" src={current.url} alt={current.alt || `Ảnh ${index + 1}`} />
    {images.length > 1 && <>
      <button type="button" className="post-lightbox-prev" aria-label="Ảnh trước" onClick={() => move(-1)}><ChevronLeft /></button>
      <button type="button" className="post-lightbox-next" aria-label="Ảnh tiếp" onClick={() => move(1)}><ChevronRight /></button>
    </>}
    {images.length > 1 && <div className="post-lightbox-counter" aria-live="polite">{index + 1} / {images.length}</div>}
  </dialog>, document.body);
}
