import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Avatar from '../ui/Avatar';
import { usePostStore } from '../../store/usePostStore';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import {
  FileText,
  Image as ImageIcon,
  Code2,
  Sparkles,
  ChevronDown,
  X,
  Plus,
  Check,
} from 'lucide-react';

export const PostComposerModal: React.FC = () => {
  const { isCreateModalOpen, closeCreateModal, targetCommunityName, addPost } = usePostStore();
  const { communities } = useCommunityStore();
  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'text' | 'media' | 'code'>('text');
  const [selectedCommunityName, setSelectedCommunityName] = useState<string>('lap-trinh-viet-nam');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('TypeScript');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync selected community when targetCommunityName changes
  useEffect(() => {
    if (targetCommunityName && communities.some((c) => c.name === targetCommunityName)) {
      setSelectedCommunityName(targetCommunityName);
    } else if (communities.length > 0 && !selectedCommunityName) {
      setSelectedCommunityName(communities[0].name);
    }
  }, [targetCommunityName, communities, selectedCommunityName]);

  const currentCommunity = communities.find((c) => c.name === selectedCommunityName) || communities[0];

  const handleQuickAddTag = (tag: string) => {
    const existing = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (!existing.includes(tag)) {
      setTagsInput(existing.length > 0 ? `${existing.join(', ')}, ${tag}` : tag);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      addToast('Vui lòng đăng nhập để tạo bài viết thảo luận', 'warning');
      return;
    }

    if (!title.trim()) {
      addToast('Vui lòng nhập tiêu đề cho bài viết', 'error');
      return;
    }

    if (!content.trim() && !codeSnippet.trim() && !mediaUrl.trim()) {
      addToast('Vui lòng nhập nội dung hoặc đính kèm thông tin thảo luận', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      addPost({
        communityName: currentCommunity.name,
        communityDisplayName: currentCommunity.displayName,
        communityAvatar: currentCommunity.avatarUrl,
        title: title.trim(),
        content: content.trim(),
        tags: parsedTags.length > 0 ? parsedTags : [currentCommunity.category],
        mediaUrl: activeTab === 'media' && mediaUrl.trim() ? mediaUrl.trim() : undefined,
        mediaType: activeTab === 'media' && mediaUrl.trim() ? 'image' : activeTab === 'code' ? 'code' : undefined,
        codeSnippet:
          activeTab === 'code' && codeSnippet.trim()
            ? { language: codeLanguage, code: codeSnippet.trim() }
            : undefined,
      });

      setIsSubmitting(false);
      closeCreateModal();
      setTitle('');
      setContent('');
      setTagsInput('');
      setMediaUrl('');
      setCodeSnippet('');
      addToast(`Đã đăng bài viết thành công vào c/${currentCommunity.name}!`, 'success');
    }, 350);
  };

  return (
    <Modal
      isOpen={isCreateModalOpen}
      onClose={closeCreateModal}
      title="Tạo bài viết thảo luận mới"
      description="Chia sẻ kinh nghiệm lập trình, hỏi đáp kiến trúc hoặc đăng dự án thú vị của bạn"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* 1. Community Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
            Chọn không gian cộng đồng
          </label>
          <div className="relative">
            <select
              value={selectedCommunityName}
              onChange={(e) => setSelectedCommunityName(e.target.value)}
              className="w-full appearance-none bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl py-2.5 pl-3.5 pr-10 text-xs sm:text-sm font-semibold outline-none focus:border-[var(--color-orange)] transition-colors cursor-pointer"
            >
              {communities.map((c) => (
                <option key={c.id} value={c.name}>
                  c/{c.name} — {c.displayName} ({c.memberCount.toLocaleString('vi-VN')} thành viên)
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>

        {/* 2. Format Tabs: Text, Media, Code */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-[var(--color-orange)] text-white shadow-xs font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Thảo luận văn bản</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'media'
                ? 'bg-[var(--color-orange)] text-white shadow-xs font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Hình ảnh</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'bg-[var(--color-orange)] text-white shadow-xs font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Đoạn mã code</span>
          </button>
        </div>

        {/* 3. Post Title */}
        <Input
          label="Tiêu đề bài viết"
          placeholder="Tóm tắt ngắn gọn vấn đề hoặc chủ đề chia sẻ (tối thiểu 5 ký tự)..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* 4. Tab Content */}
        {/* Main Content Area */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
            Nội dung chi tiết
          </label>
          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Chia sẻ bối cảnh chi tiết, lý do lựa chọn kiến trúc, kinh nghiệm xử lý lỗi..."
            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[var(--color-orange)] rounded-xl p-3 text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors"
          />
        </div>

        {/* Image Attachment Tab */}
        {activeTab === 'media' && (
          <div className="space-y-2 p-3.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl">
            <Input
              label="Đường dẫn hình ảnh (Image URL)"
              placeholder="https://images.unsplash.com/photo-..."
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              helperText="Hỗ trợ các định dạng ảnh phổ biến JPG, PNG, WebP"
            />
            {mediaUrl.trim() && (
              <div className="rounded-lg overflow-hidden border border-[var(--border-color)] max-h-48 bg-[var(--bg-surface)]">
                <img
                  src={mediaUrl}
                  alt="Xem trước ảnh"
                  className="w-full h-full object-cover"
                  onError={() => addToast('Không thể tải ảnh từ liên kết này', 'error')}
                />
              </div>
            )}
          </div>
        )}

        {/* Code Snippet Tab */}
        {activeTab === 'code' && (
          <div className="space-y-3 p-3.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Ngôn ngữ lập trình:</label>
              <select
                value={codeLanguage}
                onChange={(e) => setCodeLanguage(e.target.value)}
                className="bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-2.5 py-1 text-xs outline-none"
              >
                {['TypeScript', 'JavaScript', 'Java / Spring', 'Python', 'Rust', 'Go', 'SQL', 'HTML/CSS'].map(
                  (lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  )
                )}
              </select>
            </div>
            <textarea
              rows={4}
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              placeholder="// Dán đoạn mã hoặc câu lệnh của bạn tại đây..."
              className="w-full font-mono text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] focus:border-[var(--color-orange)] rounded-lg p-2.5 text-[var(--text-primary)] outline-none"
            />
          </div>
        )}

        {/* 5. Tags & Suggestions */}
        <div className="space-y-2">
          <Input
            label="Thẻ phân loại (Tags)"
            placeholder="Ví dụ: React, SpringBoot, CleanArchitecture..."
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            helperText="Các thẻ ngăn cách nhau bởi dấu phẩy"
          />

          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[var(--color-orange)]" />
              Gợi ý nhanh:
            </span>
            {['React 19', 'Spring Boot 3', 'Tailwind CSS', 'Microservices', 'Clean Architecture', 'Frontend'].map(
              (suggested) => (
                <button
                  key={suggested}
                  type="button"
                  onClick={() => handleQuickAddTag(suggested)}
                  className="text-[11px] px-2 py-0.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[var(--color-orange)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  +{suggested}
                </button>
              )
            )}
          </div>
        </div>

        {/* 6. Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
          <Button type="button" variant="ghost" size="sm" onClick={closeCreateModal}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Đăng bài ngay
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PostComposerModal;
