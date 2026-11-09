import React, { useEffect, useId, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Camera, Eye, MoreHorizontal } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import ImageLightbox from '../post/ImageLightbox';

interface Props {
  src?: string;
  kind: 'avatar' | 'banner';
  name: string;
  href: string;
  handle: string;
  avatarUrl?: string;
  onEdit?: () => void;
  children?: React.ReactNode;
}

/** One interaction for every user/community image, with editing authorized by the caller. */
export default function EntityImageActions({ src, kind, name, onEdit, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const wrapper = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const reduced = useReducedMotion();
  const intensity = useSettingsStore((state) => state.settings.animationIntensity);
  const quiet = reduced || intensity !== 'full';
  const label = kind === 'avatar' ? 'ảnh đại diện' : 'ảnh bìa';
  const title = kind === 'avatar' ? 'Ảnh đại diện' : 'Ảnh bìa';

  useEffect(() => {
    if (!menuOpen) return;
    const frame = requestAnimationFrame(() => wrapper.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
    const outside = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
        toggle.current?.focus();
      }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const items = Array.from(wrapper.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') || []);
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length;
      items[next]?.focus();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', keyboard);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', keyboard);
    };
  }, [menuOpen]);

  const linkedPreview = searchParams.get('photo') === kind && Boolean(src);
  const closePreview = () => {
    setPreviewOpen(false);
    if (linkedPreview) setSearchParams((params) => {
      const next = new URLSearchParams(params);
      next.delete('photo');
      return next;
    }, { replace: true });
  };
  const view = () => { setMenuOpen(false); setPreviewOpen(true); };
  const edit = () => { setMenuOpen(false); closePreview(); onEdit?.(); };


  return <>
    <div ref={wrapper} className={`entity-image-control entity-image-control--${kind} ${menuOpen ? 'is-open' : ''}`}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setMenuOpen(false); }}>
      <motion.button type="button" className="entity-image-trigger" disabled={!src && !onEdit}
        aria-label={src ? `Xem ${label} của ${name}` : `Thêm ${label}`}
        onClick={src ? view : edit} whileTap={quiet ? undefined : { scale: 0.985 }}>
        {children}
        <span className="entity-image-feedback" aria-hidden="true"><Eye size={kind === 'avatar' ? 22 : 20} /></span>
      </motion.button>
      {onEdit && <button ref={toggle} type="button" className="entity-image-options" aria-label={`Tùy chọn ${label}`}
        aria-haspopup="menu" aria-expanded={menuOpen} aria-controls={menuOpen ? menuId : undefined}
        onClick={() => setMenuOpen((open) => !open)}><MoreHorizontal size={18} /><span>{title}</span></button>}
      <AnimatePresence>
        {menuOpen && <motion.div id={menuId} role="menu" aria-label={`Tùy chọn ${label}`} className="entity-image-menu" data-ui="popover"
          initial={quiet ? false : { opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: quiet ? 0 : -4, scale: quiet ? 1 : 0.98 }} transition={{ duration: quiet ? 0 : 0.16 }}>
          {src && <button type="button" role="menuitem" onClick={view}><Eye size={16} />Xem {label}</button>}
          {onEdit && <button type="button" role="menuitem" onClick={edit}><Camera size={16} />{src ? 'Chỉnh sửa' : 'Thêm'} {label}</button>}
        </motion.div>}
      </AnimatePresence>
    </div>
    {src && (previewOpen || linkedPreview) && <ImageLightbox
      images={[{ url: src, alt: `${title} của ${name}` }]}
      index={0}
      onChange={() => {}}
      onClose={closePreview}
    />}
  </>;
}
