import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useReportStore } from '../../store/useReportStore';
import { useToastStore } from '../../store/useToastStore';
import { ReportContentType } from '../../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: ReportContentType;
  contentId: string;
  contentTitle?: string;
  communityName?: string;
  targetUsername?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  contentType,
  contentId,
  contentTitle,
  communityName,
  targetUsername,
}) => {
  const { addReport } = useReportStore();
  const { addToast } = useToastStore();

  const [selectedReason, setSelectedReason] = useState('Spam hoặc nội dung quảng cáo trái phép');
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    'Spam hoặc nội dung quảng cáo trái phép',
    'Gây hấn, quấy rối hoặc ngôn từ thù địch',
    'Thông tin sai lệch hoặc tin giả mạo',
    'Vi phạm bản quyền hoặc sở hữu trí tuệ',
    'Nội dung khiêu dâm hoặc bạo lực',
    'Lý do khác',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addReport({
        contentType,
        contentId,
        contentTitle,
        communityName,
        targetUsername,
        reason: selectedReason === 'Lý do khác' && customNote ? customNote : selectedReason,
      });
      addToast('Cảm ơn bạn! Báo cáo đã được gửi tới đội ngũ kiểm duyệt.', 'success');
      onClose();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể gửi báo cáo.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Báo cáo vi phạm"
      description={`Gửi báo cáo nội dung "${contentTitle || contentId}" tới ban quản trị`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#9A9DA3]">Lý do vi phạm:</label>
          <div className="space-y-1.5">
            {reasons.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                  selectedReason === r
                    ? 'border-[#FF5700] bg-[#FF5700]/10 text-[#F5F5F5]'
                    : 'border-[#303235] bg-[#222426] text-[#9A9DA3] hover:text-[#F5F5F5]'
                }`}
              >
                <input
                  type="radio"
                  name="reportReason"
                  checked={selectedReason === r}
                  onChange={() => setSelectedReason(r)}
                  className="accent-[#FF5700]"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </div>

        {selectedReason === 'Lý do khác' && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#9A9DA3]">Mô tả chi tiết:</label>
            <textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Vui lòng cung cấp thêm thông tin giúp chúng tôi xử lý..."
              rows={3}
              required
              className="w-full bg-[#101112] border border-[#303235] focus:border-[#FF5700] rounded-xl p-3 text-xs text-[#F5F5F5] placeholder-[#70747C] outline-none"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Gửi báo cáo
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ReportModal;
