import { useRef, useState } from 'react';
import { Bold, Italic, Code2, Link2, ImagePlus, List, Quote, Heading2 } from 'lucide-react';
import type { PostImage } from '../../types';
import PostMarkdown from './PostMarkdown';
import { useToastStore } from '../../store/useToastStore';
import { markdownImageKeys } from './postUrls';

export default function MarkdownEditor({ value, onChange, images, onImage, imageLimitReached = false }: {
  value: string; onChange: (value: string) => void; images: PostImage[];
  onImage: (file: File) => PostImage | null;
  imageLimitReached?: boolean;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(false);
  const toast = useToastStore((state) => state.addToast);
  const insert = (before: string, after = '', fallback = '') => {
    const el = textarea.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? start;
    const selected = value.slice(start, end) || fallback;
    onChange(value.slice(0, start) + before + selected + after + value.slice(end));
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(start + before.length, start + before.length + selected.length); });
  };
  const tools = [
    { label: 'Tiêu đề', icon: Heading2, before: '\n## ', fallback: 'Tiêu đề' },
    { label: 'In đậm', icon: Bold, before: '**', after: '**', fallback: 'Nội dung' },
    { label: 'In nghiêng', icon: Italic, before: '*', after: '*', fallback: 'Nội dung' },
    { label: 'Danh sách', icon: List, before: '\n- ', fallback: 'Mục mới' },
    { label: 'Trích dẫn', icon: Quote, before: '\n> ', fallback: 'Trích dẫn' },
    { label: 'Chèn code block', icon: Code2, before: '\n```java\n', after: '\n```\n', fallback: '// Viết code tại đây' },
    { label: 'Chèn liên kết', icon: Link2, before: '[', after: '](https://)', fallback: 'Tên liên kết' },
  ];
  return <div className="markdown-editor">
    <div className="markdown-toolbar" role="toolbar" aria-label="Định dạng Markdown">
      {!preview && tools.map(({ label, icon: Icon, before, after, fallback }) => <button type="button" key={label}
        title={label} aria-label={label} onClick={() => insert(before, after, fallback)}><Icon size={16} /></button>)}
      {!preview && <button type="button" title="Chọn ảnh chèn vào nội dung" aria-label="Chọn ảnh chèn vào nội dung" disabled={imageLimitReached}
        onClick={() => file.current?.click()}><ImagePlus size={16} /></button>}
      <button type="button" className="markdown-preview-toggle" aria-pressed={preview} onClick={() => setPreview(!preview)}>
        {preview ? 'Tiếp tục viết' : 'Xem trước'}
      </button>
    </div>
    <input hidden ref={file} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
      const selected = event.target.files?.[0]; event.target.value = '';
      if (!selected) return;
      if (imageLimitReached || markdownImageKeys(value).length >= 20) { toast('Tối đa 20 ảnh trong một bài viết.', 'error'); return; }
      if (selected.size > 10 * 1024 * 1024) { toast('Ảnh không được vượt quá 10 MB.', 'error'); return; }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type) || selected.size === 0) {
        toast('Chỉ hỗ trợ ảnh JPG, PNG, WebP hợp lệ.', 'error'); return;
      }
      const start = textarea.current?.selectionStart ?? value.length;
      const end = textarea.current?.selectionEnd ?? start;
      const image = onImage(selected);
      if (!image) return;
      onChange(value.slice(0, start) + `\n![Ảnh](post-image:${image.objectKey})\n` + value.slice(end));
    }} />
    {preview ? <div className="markdown-preview">{value ? <PostMarkdown content={value} images={images} />
      : <p className="post-empty-preview">Nội dung xem trước sẽ xuất hiện ở đây.</p>}</div>
      : <textarea ref={textarea} aria-label="Nội dung Markdown" value={value} maxLength={50000}
        onChange={(event) => onChange(event.target.value)} placeholder="Chia sẻ câu chuyện của bạn… Hỗ trợ Markdown và nhiều đoạn code." rows={10} />}
    <div className="markdown-editor-hint"><span>Markdown · `code` · **in đậm** · danh sách</span><span>{value.length.toLocaleString('vi-VN')} / 50.000</span></div>
  </div>;
}
