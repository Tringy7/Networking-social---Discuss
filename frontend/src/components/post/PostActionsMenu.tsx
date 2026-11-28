import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { MoreHorizontal, Pencil, Trash2, Share2, Flag, Pin, PinOff } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { REPORT_CREATION_AVAILABLE } from '../../services';
import type { Post } from '../../types';

interface PostActionsMenuProps {
  post: Post;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
  onShare: (event: ReactMouseEvent) => void | Promise<void>;
  onTogglePin?: () => void;
  pinDisabled?: boolean;
}

export default function PostActionsMenu({ post, onEdit, onDelete, onReport, onShare, onTogglePin, pinDisabled }: PostActionsMenuProps) {
  const { user, isAuthenticated } = useAuthStore();
  const isPostOwner = isAuthenticated && !!user && user.username === post.author.username;
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!showMenu) return;
    const close = (event: MouseEvent) => { if (!menuRef.current?.contains(event.target as Node)) setShowMenu(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setShowMenu(false); menuButtonRef.current?.focus(); } };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, [showMenu]);
  return (
        <div ref={menuRef} className="relative">
          <button type="button" ref={menuButtonRef} className="icon-button" onClick={() => setShowMenu(!showMenu)} aria-expanded={showMenu} aria-label={`Tùy chọn bài viết ${post.title}`}><MoreHorizontal size={17} /></button>
          {showMenu && <div role="menu" data-ui="popover" className="absolute right-0 top-full z-20 w-48 border p-2">
            {isPostOwner && <>
              <button type="button" role="menuitem" className="side-link" onClick={() => { setShowMenu(false); onEdit(); }}><Pencil size={15} /> Chỉnh sửa bài viết</button>
              <button type="button" role="menuitem" className="side-link text-[var(--color-danger)]" onClick={() => { setShowMenu(false); onDelete(); }}><Trash2 size={15} /> Xóa bài viết</button>
            </>}
            {onTogglePin && <button type="button" role="menuitem" className="side-link" disabled={pinDisabled}
              onClick={() => { setShowMenu(false); onTogglePin(); }}>
              {post.pinned ? <><PinOff size={15} /> Bỏ ghim bài viết</> : <><Pin size={15} /> Ghim bài viết</>}
            </button>}
            <button type="button" role="menuitem" className="side-link" onClick={(e) => { void onShare(e); setShowMenu(false); }}><Share2 size={15} /> Sao chép liên kết</button>
            {REPORT_CREATION_AVAILABLE && <button type="button" role="menuitem" className="side-link" onClick={() => { setShowMenu(false); onReport(); }}><Flag size={15} /> Báo cáo bài viết</button>}
          </div>}
        </div>
  );
}
