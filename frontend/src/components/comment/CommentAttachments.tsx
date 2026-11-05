import { useEffect, useRef, useState } from 'react';
import { X, FileText, ImagePlus } from 'lucide-react';
import type { CommentAttachment } from '../../types';

export const MAX_COMMENT_FILE_SIZE = 10 * 1024 * 1024;
const sizeLabel = (size: number) => size < 1024 * 1024
  ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
const fileUrl = (id: string) => `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/comments/attachments/${id}`;

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
    onChange(next);
  };
  return <div className="space-y-2 min-w-0">
    <div className="flex flex-wrap items-center gap-3 text-[13px] text-[var(--text-secondary)]">
      <button type="button" disabled={disabled} onClick={() => images.current?.click()}
        className="inline-flex items-center gap-1.5 py-1.5 disabled:opacity-40 hover:text-[var(--text-primary)]">
        <ImagePlus size={16} />Ảnh
      </button>
      <span className="text-[var(--text-muted)]">10 MB/ảnh · Tổng mỗi lần gửi tối đa 55 MB</span>
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

export function CommentAttachmentList({ attachments }: { attachments?: CommentAttachment[] }) {
  if (!attachments?.length) return null;
  return <ul className="space-y-2 pl-8" aria-label="Tệp đính kèm bình luận">
    {attachments.map(file => <li key={file.id}>
      <a href={fileUrl(file.id)} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full flex-col gap-1.5 text-[13px] text-[var(--text-secondary)] hover:underline">
        {file.contentType.startsWith('image/')
          ? <img src={fileUrl(file.id)} alt={file.fileName} loading="lazy" className="max-h-64 max-w-full rounded-lg object-contain" />
          : <span className="inline-flex items-center gap-2"><FileText size={16} /><span className="break-all">{file.fileName}</span></span>}
        <span className="break-all">{file.contentType.startsWith('image/') ? `${file.fileName} · ` : ''}{sizeLabel(file.size)} · Mở / tải xuống</span>
      </a>
    </li>)}
  </ul>;
}
