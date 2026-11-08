import { useEffect, useRef, useState } from 'react';
import { X, FileText, ImagePlus } from 'lucide-react';
import { imageRequestError } from '../../utils/imageUploadLimits';
import type { CommentAttachment } from '../../types';
import ImageLightbox from '../post/ImageLightbox';
import '../post/postContent.css';

export const MAX_COMMENT_FILE_SIZE = 10 * 1024 * 1024;
const sizeLabel = (size: number) => size < 1024 * 1024
  ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;

function FilePreview({ file }: { file: File }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!file.type.startsWith('image/')) return;
    const next = URL.createObjectURL(file); setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url ? <img src={url} alt="" className="h-10 w-10 rounded object-cover shrink-0" />
    : <FileText className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />;
}

export function CommentFilePicker({ files, onChange, disabled, onError }: {
  files: File[]; onChange: (files: File[]) => void; disabled?: boolean; onError: (message: string) => void;
}) {
  const images = useRef<HTMLInputElement>(null);
  const select = (selected: FileList | null) => {
    const next = [...files, ...Array.from(selected || [])];
    if (next.some(file => !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type))) {
      onError('Bình luận chỉ hỗ trợ ảnh JPEG, PNG, WebP hoặc GIF.'); return;
    }
    if (next.some(file => file.size > MAX_COMMENT_FILE_SIZE || file.size === 0)) {
      onError('Chọn ảnh có dung lượng lớn hơn 0 và không quá 10 MB.'); return;
    }
    const sizeError = imageRequestError(next);
    if (sizeError) { onError(sizeError); return; }
    onChange(next);
  };
  return <div className="space-y-2 min-w-0">
    <div className="flex flex-wrap items-center gap-3 text-[13px] text-[var(--text-secondary)]">
      <button type="button" disabled={disabled} onClick={() => images.current?.click()}
        className="inline-flex items-center gap-1.5 py-1.5 disabled:opacity-40 hover:text-[var(--text-primary)]">
        <ImagePlus size={16} />Ảnh
      </button>
    </div>
    <input ref={images} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" aria-label="Chọn ảnh đính kèm"
      onChange={e => { select(e.target.files); e.target.value = ''; }} />
    {files.length > 0 && <ul className="space-y-1.5" aria-label="Ảnh đã chọn">
      {files.map((file, index) => <li key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] p-2 text-[13px]">
        <FilePreview file={file} />
        <div className="min-w-0 flex-1"><p className="truncate">{file.name}</p><span className="text-[var(--text-muted)]">{sizeLabel(file.size)}</span></div>
        <button type="button" disabled={disabled} aria-label={`Gỡ ${file.name}`} onClick={() => onChange(files.filter((_, i) => i !== index))} className="p-2"><X size={14} /></button>
      </li>)}
    </ul>}
  </div>;
}

export function CommentAttachmentList({ attachments, onRefresh }: { attachments?: CommentAttachment[]; onRefresh?: () => Promise<void> }) {
  const [failedImages, setFailedImages] = useState(new Set<string>());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const images = (attachments || []).filter(file => file.contentType.startsWith('image/'));
  const selectedIndex = images.findIndex(file => file.id === selectedId);
  if (!attachments?.length) return null;
  return <div className="pl-8 min-w-0">
    <ul className="comment-media-grid" data-count={Math.min(attachments.length, 3)} aria-label="Ảnh bình luận">
    {attachments.map(file => <li key={file.id}>
      {file.contentType.startsWith('image/')
        ? <button type="button" className="post-gallery-image post-media-tile comment-media-tile"
            aria-label={`Xem ${file.fileName} kích thước lớn`} onClick={() => setSelectedId(file.id)}>
            <img src={file.url} alt={file.fileName} loading="lazy"
              onError={() => setFailedImages(previous => new Set(previous).add(file.id))}
              onLoad={() => setFailedImages(previous => { const next = new Set(previous); next.delete(file.id); return next; })}
            />
          </button>
        : <a href={file.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
            <FileText size={16} /><span className="break-all">{file.fileName}</span>
          </a>}
      {failedImages.has(file.id) && onRefresh && <button type="button" disabled={refreshing}
        className="block text-xs text-[var(--text-secondary)] underline" onClick={async () => {
          setRefreshing(true);
          try { await onRefresh(); } catch { /* Keep the retry action visible. */ } finally { setRefreshing(false); }
        }}>{refreshing ? 'Đang tải lại ảnh…' : 'Ảnh chưa tải được. Thử lại'}</button>}
    </li>)}
    </ul>
    {selectedIndex >= 0 && <ImageLightbox images={images.map(file => ({ url: file.url, alt: file.fileName }))}
      index={selectedIndex} onChange={index => setSelectedId(images[index].id)} onClose={() => setSelectedId(null)} />}
  </div>;
}
