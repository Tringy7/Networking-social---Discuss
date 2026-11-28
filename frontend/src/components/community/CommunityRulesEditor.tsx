import { useId, useState } from 'react';
import CommunityRulesContent from './CommunityRulesContent';
import { useDefaultCommunityRules } from './useDefaultCommunityRules';
import './communityRules.css';

export default function CommunityRulesEditor({ value, onChange, disabled = false }: {
  value: string; onChange: (value: string) => void; disabled?: boolean;
}) {
  const id = useId();
  const [preview, setPreview] = useState(false);
  const defaults = useDefaultCommunityRules();
  const content = value.trim() ? value : defaults.markdown;
  return <section className="rules-editor" aria-labelledby={`${id}-title`}>
    <div className="rules-editor-heading">
      <label id={`${id}-title`} htmlFor={id}>Nội quy cộng đồng</label>
      <button type="button" disabled={disabled || !defaults.markdown} onClick={() => onChange(defaults.markdown)}>Dùng nội quy mặc định</button>
    </div>
    <div className="rules-editor-tabs" aria-label="Chế độ nội quy">
      <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>Soạn nội quy</button>
      <button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>Xem trước</button>
    </div>
    {preview ? <div className="rules-editor-preview"><CommunityRulesContent markdown={content} /></div>
      : <textarea id={id} value={content} onChange={(event) => onChange(event.target.value)} disabled={disabled}
          maxLength={16000} rows={12} aria-describedby={`${id}-help`} spellCheck={false}
          placeholder="Đang tải nội quy mặc định…" />}
    <div id={`${id}-help`} className="rules-editor-help"><span>Hỗ trợ Markdown: # tiêu đề, **in đậm**, - danh sách. Để trống để dùng nội quy mặc định.</span><span>{content.length.toLocaleString('vi-VN')}/16.000</span></div>
    {defaults.error && <p className="rules-status" role="status">Không thể tải nội quy mặc định. <button type="button" onClick={defaults.retry}>Thử lại</button></p>}
  </section>;
}
