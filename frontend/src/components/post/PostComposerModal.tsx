import React, { useState, useEffect, useRef } from 'react';
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
  Crop,
  RotateCcw,
  RotateCw,
  Upload,
} from 'lucide-react';
import { uploadPostImage } from '../../services/mediaService';

type CropRatio = 'original' | 'square' | 'landscape' | 'portrait';

const cropRatios: Record<Exclude<CropRatio, 'original'>, number> = {
  square: 1,
  landscape: 4 / 3,
  portrait: 3 / 4,
};

async function createCroppedImage(
  src: string,
  ratio: CropRatio,
  zoom: number,
  rotation: number,
  fileName: string,
  fileType: string
): Promise<File> {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Không thể đọc ảnh đã chọn.'));
    image.src = src;
  });

  const outputRatio = ratio === 'original'
    ? image.naturalWidth / image.naturalHeight
    : cropRatios[ratio];
  const width = Math.round(Math.min(1200, 1920 * outputRatio));
  const height = Math.round(width / outputRatio);
  const isQuarterTurn = Math.abs(rotation % 180) === 90;
  const rotatedWidth = isQuarterTurn ? image.naturalHeight : image.naturalWidth;
  const rotatedHeight = isQuarterTurn ? image.naturalWidth : image.naturalHeight;
  const scale = Math.max(width / rotatedWidth, height / rotatedHeight) * zoom;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Trình duyệt không hỗ trợ chỉnh sửa ảnh.');

  context.translate(width / 2, height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(
    image,
    (-image.naturalWidth * scale) / 2,
    (-image.naturalHeight * scale) / 2,
    image.naturalWidth * scale,
    image.naturalHeight * scale
  );

  const outputType = ['image/jpeg', 'image/png', 'image/webp'].includes(fileType)
    ? fileType
    : 'image/jpeg';
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => result ? resolve(result) : reject(new Error('Không thể xuất ảnh đã chỉnh sửa.')),
      outputType,
      0.92
    );
  });
  const extension = outputType === 'image/png' ? '.png' : outputType === 'image/webp' ? '.webp' : '.jpg';
  return new File([blob], `${fileName.replace(/\.[^.]+$/, '')}${extension}`, { type: outputType });
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Không thể đọc ảnh đã chọn.'));
    };
    reader.onerror = () => reject(new Error('Không thể đọc ảnh đã chọn.'));
    reader.readAsDataURL(file);
  });
}

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  const [cropRatio, setCropRatio] = useState<CropRatio>('original');
  const [imageNaturalRatio, setImageNaturalRatio] = useState(4 / 3);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropRotation, setCropRotation] = useState(0);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('TypeScript');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  // Sync selected community when targetCommunityName changes
  useEffect(() => {
    if (targetCommunityName && communities.some((c) => c.name === targetCommunityName)) {
      setSelectedCommunityName(targetCommunityName);
    } else if (communities.length > 0 && !selectedCommunityName) {
      setSelectedCommunityName(communities[0].name);
    }
  }, [targetCommunityName, communities, selectedCommunityName]);

  const currentCommunity = communities.find((c) => c.name === selectedCommunityName) || communities[0];

  const handleImageSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      addToast('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast('Ảnh không được vượt quá 10 MB.', 'error');
      return;
    }
    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
    const previewImage = new Image();
    previewImage.onload = () => setImageNaturalRatio(previewImage.naturalWidth / previewImage.naturalHeight);
    previewImage.src = previewUrl;
    setCropRatio('original');
    setCropZoom(1);
    setCropRotation(0);
    setIsImageEditorOpen(true);
  };

  const handleApplyCrop = async () => {
    if (!imagePreviewUrl || !imageFile) return;
    setIsApplyingCrop(true);
    try {
      const croppedFile = await createCroppedImage(
        imagePreviewUrl,
        cropRatio,
        cropZoom,
        cropRotation,
        imageFile.name,
        imageFile.type
      );
      setImageFile(croppedFile);
      setImagePreviewUrl(URL.createObjectURL(croppedFile));
      setIsImageEditorOpen(false);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể chỉnh sửa ảnh.', 'error');
    } finally {
      setIsApplyingCrop(false);
    }
  };

  const handleQuickAddTag = (tag: string) => {
    const existing = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (!existing.includes(tag)) {
      setTagsInput(existing.length > 0 ? `${existing.join(', ')}, ${tag}` : tag);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      addToast('Vui lòng đăng nhập để tạo bài viết thảo luận', 'warning');
      return;
    }

    if (!title.trim()) {
      addToast('Vui lòng nhập tiêu đề cho bài viết', 'error');
      return;
    }

    if (!currentCommunity) {
      addToast('Không có cộng đồng khả dụng để đăng bài.', 'error');
      return;
    }

    const hasContent = Boolean(
      content.trim()
      || (activeTab === 'code' && codeSnippet.trim())
      || (activeTab === 'media' && imageFile)
    );
    if (!hasContent) {
      addToast('Vui lòng nhập nội dung hoặc đính kèm thông tin thảo luận', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const uploadedImage = activeTab === 'media' && imageFile
        ? !POSTS_AVAILABLE
          ? { url: await readImageAsDataUrl(imageFile) }
          : await uploadPostImage(imageFile)
        : null;

      await addPost({
        communityName: currentCommunity.name,
        communityDisplayName: currentCommunity.displayName,
        communityAvatar: currentCommunity.avatarUrl,
        author: {
          id: user?.id ?? 'demo-current-user',
          username: user?.username ?? 'ban',
          displayName: user?.displayName ?? 'Bạn',
          avatarUrl: user?.avatarUrl ?? '',
          role: user?.role,
        },
        title: title.trim(),
        content: content.trim(),
        tags: parsedTags.length > 0 ? parsedTags : [currentCommunity.category],
        mediaUrl: uploadedImage?.url,
        mediaType: uploadedImage ? 'image' : activeTab === 'code' ? 'code' : undefined,
        codeSnippet:
          activeTab === 'code' && codeSnippet.trim()
            ? { language: codeLanguage, code: codeSnippet.trim() }
            : undefined,
      });

      closeCreateModal();
      setTitle('');
      setContent('');
      setTagsInput('');
      setImageFile(null);
      setImagePreviewUrl('');
      setCodeSnippet('');
      addToast(`Đã đăng bài viết thành công vào community/${currentCommunity.name}!`, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể đăng bài viết.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Modal
      isOpen={isCreateModalOpen}
      onClose={() => isImageEditorOpen ? setIsImageEditorOpen(false) : closeCreateModal()}
      title="Tạo bài viết thảo luận mới"
      description="Soạn nội dung bên trái và xem trước bài viết ở bên phải"
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] gap-5 text-left">
        <div className="space-y-4">
        {/* 1. Community Selection */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-[var(--text-secondary)] block">
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
                  community/{c.name} — {c.displayName} ({c.memberCount.toLocaleString('vi-VN')} thành viên)
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
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-[background-color,border-color,color,opacity,transform] cursor-pointer ${
              activeTab === 'text'
                ? 'bg-[var(--action-bg)] text-[var(--action-ink)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Thảo luận văn bản</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-[background-color,border-color,color,opacity,transform] cursor-pointer ${
              activeTab === 'media'
                ? 'bg-[var(--action-bg)] text-[var(--action-ink)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Hình ảnh</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-[background-color,border-color,color,opacity,transform] cursor-pointer ${
              activeTab === 'code'
                ? 'bg-[var(--action-bg)] text-[var(--action-ink)] font-semibold'
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
          <label className="text-sm font-semibold text-[var(--text-secondary)] block">
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
          <div className="space-y-3 p-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelected}
              className="hidden"
            />
            {imagePreviewUrl ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setIsImageEditorOpen(true)}
                  className="group relative block w-full overflow-hidden rounded-xl border border-[var(--border-color)] bg-black"
                >
                  <img src={imagePreviewUrl} alt="Ảnh đã chọn" className="max-h-64 w-full object-contain" />
                  <span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/55 text-sm font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <Crop className="h-4 w-4" />
                    Chỉnh sửa ảnh
                  </span>
                </button>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-[var(--text-secondary)]">{imageFile?.name}</span>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => setIsImageEditorOpen(true)}>
                      Chỉnh sửa
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreviewUrl('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex min-h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border-color)] px-4 py-8 text-center text-[var(--text-secondary)] transition-colors hover:border-[var(--color-orange)] hover:text-[var(--text-primary)]"
              >
                <Upload className="h-7 w-7 text-[var(--color-orange)]" />
                <span className="text-sm font-semibold">Chọn ảnh từ thiết bị</span>
                <span className="text-xs text-[var(--text-muted)]">JPG, PNG hoặc WebP · Tối đa 10 MB</span>
              </button>
            )}
          </div>
        )}

        {/* Code Snippet Tab */}
        {activeTab === 'code' && (
          <div className="space-y-3 p-3.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Ngôn ngữ lập trình:</label>
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
            <textarea data-ui="code-editor"
              rows={4}
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              placeholder="// Dán đoạn mã hoặc câu lệnh của bạn tại đây..."
              className="w-full font-code text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] focus:border-[var(--color-orange)] rounded-lg p-2.5 text-[var(--text-primary)] outline-none"
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
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[var(--color-orange)]" />
              Gợi ý nhanh:
            </span>
            {['React 19', 'Spring Boot 3', 'Tailwind CSS', 'Microservices', 'Clean Architecture', 'Frontend'].map(
              (suggested) => (
                <button
                  key={suggested}
                  type="button"
                  onClick={() => handleQuickAddTag(suggested)}
                  className="text-xs px-2 py-0.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[var(--color-orange)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  +{suggested}
                </button>
              )
            )}
          </div>
        </div>
        </div>

        <aside className="min-w-0">
          <div className="sticky top-0 space-y-3 rounded-[var(--radius-card)] border border-[var(--border-color)] bg-[var(--bg-main)] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <ImageIcon className="h-4 w-4 text-[var(--color-orange)]" />
              Xem trước bài viết
            </div>
            <article className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
              <div className="flex items-center gap-2.5 p-3">
                <Avatar src={user?.avatarUrl} alt={user?.displayName || 'Bạn'} size="sm" />
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-[var(--text-primary)]">
                    {user?.displayName || 'Tên của bạn'}
                  </div>
                  <div className="truncate text-xs text-[var(--text-muted)]">
                    {currentCommunity ? `community/${currentCommunity.name}` : 'Chọn cộng đồng'}
                  </div>
                </div>
              </div>
              <div className="space-y-2 px-3 pb-3">
                <h3 className="break-words text-base font-semibold text-[var(--text-primary)]">
                  {title.trim() || 'Tiêu đề bài viết'}
                </h3>
                <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-[var(--text-secondary)]">
                  {content.trim() || 'Nội dung bạn soạn sẽ hiển thị ở đây.'}
                </p>
                {activeTab === 'media' && imagePreviewUrl && (
                  <img
                    src={imagePreviewUrl}
                    alt="Ảnh xem trước bài viết"
                    className="max-h-72 w-full rounded-lg bg-black object-contain"
                  />
                )}
                {activeTab === 'code' && codeSnippet.trim() && (
                  <pre className="max-h-48 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-[var(--text-secondary)]">
                    <code>{codeSnippet}</code>
                  </pre>
                )}
                {tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                      <span key={tag} className="rounded-full bg-[var(--color-orange-soft)] px-2 py-1 text-xs font-semibold text-[var(--color-orange)]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
            <p className="text-xs leading-relaxed text-[var(--text-muted)]">
              Đây là bản xem trước gần đúng với bài viết sau khi đăng.
            </p>
          </div>
        </aside>

        {/* 6. Action Footer */}
        <div className="col-span-full flex items-center justify-end gap-3 border-t border-[var(--border-color)] pt-3">
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
    <Modal
      isOpen={isImageEditorOpen}
      onClose={() => setIsImageEditorOpen(false)}
      title="Chỉnh sửa ảnh"
      description="Cắt ảnh theo khung, phóng to hoặc xoay trước khi đăng."
      maxWidth="xl"
    >
      <div className="space-y-5">
        <div
          className="mx-auto max-h-[50vh] w-full max-w-[520px] overflow-hidden rounded-xl bg-black"
          style={{
            aspectRatio: cropRatio === 'original'
              ? (cropRotation % 180 === 0 ? imageNaturalRatio : 1 / imageNaturalRatio)
              : cropRatios[cropRatio],
          }}
        >
          {imagePreviewUrl && (
            <img
              src={imagePreviewUrl}
              alt="Khung chỉnh sửa ảnh"
              className="h-full w-full object-cover transition-transform"
              style={{ transform: `scale(${cropZoom}) rotate(${cropRotation}deg)` }}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-[var(--text-secondary)]">Tỉ lệ khung ảnh</span>
            <div className="flex flex-wrap gap-2">
              {([
                ['original', 'Gốc'],
                ['square', 'Vuông'],
                ['landscape', 'Ngang'],
                ['portrait', 'Dọc'],
              ] as const).map(([ratio, label]) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setCropRatio(ratio)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    cropRatio === ratio
                      ? 'border-[var(--color-orange)] bg-[var(--color-orange-soft)] text-[var(--color-orange)]'
                      : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCropRotation((value) => value - 90)}
              aria-label="Xoay ảnh sang trái"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCropRotation((value) => value + 90)}
              aria-label="Xoay ảnh sang phải"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <label className="block space-y-2 text-xs font-semibold text-[var(--text-secondary)]">
          Phóng to ảnh
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={cropZoom}
            onChange={(event) => setCropZoom(Number(event.target.value))}
            className="w-full accent-[var(--color-orange)]"
          />
        </label>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsImageEditorOpen(false)}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            isLoading={isApplyingCrop}
            onClick={() => void handleApplyCrop()}
          >
            Áp dụng ảnh
          </Button>
        </div>
      </div>
    </Modal>
    </>
  );
};

export default PostComposerModal;
