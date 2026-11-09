import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useReportStore } from '../../store/useReportStore';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ApiError } from '../../services/apiClient';
import { REPORT_CREATION_AVAILABLE } from '../../services';
import type { ReportContentType, ReportReason, ReportTargetType } from '../../types';
import './reportModal.css';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: ReportContentType;
  contentId: string;
  contentTitle?: string;
  communityName?: string;
  targetUsername?: string;
}
const reasons: { value: ReportReason; label: string }[] = [
  { value: 'SPAM', label: 'Spam hoặc quảng cáo' },
  { value: 'HARASSMENT', label: 'Quấy rối hoặc bắt nạt' },
  { value: 'HATE_SPEECH', label: 'Ngôn từ thù địch' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Nội dung không phù hợp' },
  { value: 'MISINFORMATION', label: 'Thông tin sai lệch' },
  { value: 'OTHER', label: 'Lý do khác' },
];
const targetLabels = { POST: 'bài viết', COMMENT: 'bình luận', COMMUNITY: 'cộng đồng', USER: 'tài khoản' };

export default function ReportModal({ isOpen, onClose, contentType, contentId, contentTitle, communityName }: ReportModalProps) {
  const addReport = useReportStore((state) => state.addReport);
  const addToast = useToastStore((state) => state.addToast);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [duplicate, setDuplicate] = useState(false);
  const pending = useRef(false);
  const fieldId = useId();
  useEffect(() => {
    if (!isOpen) return;
    setReason(''); setDescription(''); setError(''); setDuplicate(false);
  }, [isOpen, contentType, contentId]);
  const close = () => { if (!pending.current) onClose(); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending.current || duplicate || !authenticated || !reason || contentType === 'USER') return;
    if (reason === 'OTHER' && !description.trim()) { setError('Vui lòng mô tả lý do báo cáo.'); return; }
    const targetId = Number(contentId);
    if (!Number.isSafeInteger(targetId) || targetId <= 0) { setError('Không tìm thấy nội dung để báo cáo. Vui lòng tải lại trang.'); return; }
    pending.current = true; setSubmitting(true); setError('');
    try {
      await addReport({ targetType: contentType as ReportTargetType, targetId, reason,
        ...(description.trim() ? { description: description.trim() } : {}) });
      addToast('Đã gửi báo cáo. Cảm ơn bạn đã giúp cộng đồng an toàn hơn.', 'success');
      onClose();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) {
        setDuplicate(true); setError('Bạn đã báo cáo nội dung này. Báo cáo trước đó đang chờ xử lý.');
      } else if (cause instanceof ApiError && cause.status === 404) {
        setError('Nội dung không còn tồn tại hoặc bạn không có quyền truy cập.');
      } else if (cause instanceof ApiError && cause.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else setError(cause instanceof Error ? cause.message : 'Không thể gửi báo cáo. Vui lòng thử lại.');
    } finally { pending.current = false; setSubmitting(false); }
  };

  return <Modal isOpen={isOpen} onClose={close} closeDisabled={submitting}
    title={`Báo cáo ${targetLabels[contentType]}`} maxWidth="md">
    {!REPORT_CREATION_AVAILABLE || contentType === 'USER' ? <p className="report-form-notice" role="status">Báo cáo {targetLabels[contentType]} hiện chưa được hỗ trợ.</p>
      : !authenticated ? <div className="report-sign-in"><p>Bạn cần đăng nhập để gửi báo cáo.</p><Link to="/login" onClick={onClose}>Đăng nhập</Link></div>
      : <form className="report-form" onSubmit={submit}>
        <div className="report-target"><Flag size={18} aria-hidden="true" /><div>
          {communityName && <span>c/{communityName}</span>}
          <p>{contentTitle || `${targetLabels[contentType]} #${contentId}`}</p>
        </div></div>
        <fieldset disabled={submitting || duplicate} className="report-reasons">
          <legend>Vì sao bạn báo cáo nội dung này?</legend>
          {reasons.map((item) => <label key={item.value} className={reason === item.value ? 'is-selected' : ''}>
            <input type="radio" name={`${fieldId}-reason`} value={item.value} required checked={reason === item.value}
              onChange={() => { setReason(item.value); setError(''); }} />
            <span>{item.label}</span>
          </label>)}
        </fieldset>
        <div className="report-description">
          <div><label htmlFor={`${fieldId}-description`}>Thông tin bổ sung <span>{reason === 'OTHER' ? '(bắt buộc)' : '(không bắt buộc)'}</span></label>
            <span id={`${fieldId}-limit`}>{description.length}/2.000</span></div>
          <textarea id={`${fieldId}-description`} rows={3} maxLength={2000} required={reason === 'OTHER'}
            disabled={submitting || duplicate} value={description} onChange={(event) => setDescription(event.target.value)}
            aria-describedby={`${fieldId}-limit`} placeholder="Chia sẻ thêm chi tiết để hỗ trợ việc xem xét…" />
        </div>
        {error && <p className="report-form-error" role="alert">{error}</p>}
        <footer className="report-form-footer"><Button type="button" variant="ghost" size="sm" disabled={submitting} onClick={close}>{duplicate ? 'Đóng' : 'Hủy'}</Button>
          <Button type="submit" size="sm" isLoading={submitting} disabled={!reason || duplicate || (reason === 'OTHER' && !description.trim())}>Gửi báo cáo</Button></footer>
      </form>}
  </Modal>;
}
