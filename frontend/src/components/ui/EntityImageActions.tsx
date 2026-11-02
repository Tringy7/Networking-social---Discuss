import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Camera, Eye, ImageOff, MoreHorizontal, Share2 } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useToastStore } from '../../store/useToastStore';
import Avatar from './Avatar';
import Modal from './Modal';
import Button from './Button';

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
export default function EntityImageActions({ src, kind, name, href, handle, avatarUrl, onEdit, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [failedSrc, setFailedSrc] = useState<string>();
  const wrapper = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const reduced = useReducedMotion();
  const intensity = useSettingsStore((state) => state.settings.animationIntensity);
  const notify = useToastStore((state) => state.addToast);
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
  const share = async () => {
    try {
      const url = new URL(href, window.location.origin);
      url.searchParams.set('photo', kind);
      await navigator.clipboard.writeText(url.href);
      notify('Đã sao chép liên kết ảnh.', 'success');
    } catch { notify('Không thể sao chép liên kết ảnh.', 'error'); }
  };

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
    {createPortal(<Modal isOpen={previewOpen || linkedPreview} onClose={closePreview} title={`${title} của ${name}`} maxWidth="4xl">
      <article className="image-post" aria-label={`Bài đăng ${label} của ${name}`}>
        <header className="image-post-author">
          <Link to={href} onClick={closePreview}><Avatar src={avatarUrl} alt={name} size="md" /></Link>
          <div><Link to={href} onClick={closePreview} className="post-author-name">{name}</Link><p>{handle} · {title}</p></div>
        </header>
        <div className="image-post-media">
          {src && src !== failedSrc ? <img src={src} alt={`${title} của ${name}`} onError={() => setFailedSrc(src)} />
            : <div className="image-post-unavailable" role="status"><ImageOff size={32} /><p>Không thể tải ảnh này.</p></div>}
        </div>
        <footer className="image-post-actions">
          <Button type="button" variant="ghost" size="sm" leftIcon={<Share2 size={16} />} onClick={() => void share()}>Chia sẻ</Button>
          {onEdit && <Button type="button" variant="secondary" size="sm" leftIcon={<Camera size={16} />} onClick={edit}>Chỉnh sửa {label}</Button>}
        </footer>
      </article>
    </Modal>, document.body)}
  </>;
}
