import { useEffect, useRef, useState } from 'react';
import { ImagePlus, ArrowLeft, ArrowRight, X } from 'lucide-react';
import Button from '../ui/Button';
import { usePostStore } from '../../store/usePostStore';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useToastStore } from '../../store/useToastStore';
import type { Post, PostImage, PostMedia, PostMediaInput } from '../../types';
import VideoPlayer from '../common/VideoPlayer';
import MarkdownEditor from './MarkdownEditor';
import { imageRequestError } from '../../utils/imageUploadLimits';
import PostBody from './PostBody';
import CommunityPicker from './CommunityPicker';
import './postContent.css';
import { httpUrl, markdownImageKeys } from './postUrls';

type DraftMedia = Omit<PostMedia, 'objectKey'> & {
  id: string; objectKey?: string; file?: File; preview?: string;
};
interface PostComposerProps {
  initialCommunity?: string;
  editingPost?: Post;
  onCancel: () => void;
  onSaved: (post: Post) => void;
  onBusyChange?: (busy: boolean) => void;
}

export default function PostComposer({ initialCommunity, editingPost, onCancel, onSaved, onBusyChange }: PostComposerProps) {
  const { addPost, editPost } = usePostStore();
  const { communities, myCommunities } = useCommunityStore();
  const toast = useToastStore((state) => state.addToast);
  const [communityName, setCommunityName] = useState(editingPost?.communityName ?? initialCommunity ?? '');
  const type = editingPost?.type ?? 'TEXT';
  const [title, setTitle] = useState(editingPost?.title ?? '');
  const [content, setContent] = useState(editingPost?.content ?? '');
  const [media, setMedia] = useState<DraftMedia[]>(() => (editingPost?.media ?? []).map((item) => ({
    ...item, objectKey: item.objectKey || undefined, id: crypto.randomUUID(), preview: item.url,
  })));
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [formError, setFormError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const objectUrls = useRef(new Set<string>());
  const canPost = [...new Map([...myCommunities, ...communities]
    .map((community) => [community.name, community])).values()]
    .filter((community) => ['OWNER', 'MODERATOR', 'MEMBER'].includes(community.currentUserRole) && community.status === 'ACTIVE');
  const selectedCommunity = canPost.find((community) => community.name === communityName);

  useEffect(() => {
    const urls = objectUrls.current;
    return () => { urls.forEach((url) => URL.revokeObjectURL(url)); urls.clear(); };
  }, []);

  const acceptFiles = (files: File[]) => {
    if (busy) return;
    const valid = files.filter((file) => ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'].includes(file.type) && file.size > 0 && file.size <= 10 * 1024 * 1024);
    if (valid.length !== files.length) toast('Chỉ hỗ trợ JPG, PNG, WebP và MP4, tối đa 10 MB mỗi tệp.', 'error');
    if (media.length + valid.length > 20) { toast('Mỗi bài viết có tối đa 20 tệp đính kèm.', 'error'); return; }
    const sizeError = imageRequestError([...media.flatMap(item => item.file ? [item.file] : []), ...valid]);
    if (sizeError) { toast(sizeError, 'error'); return; }
    setMedia((items) => [...items, ...valid.map((file) => {
      const url = URL.createObjectURL(file); objectUrls.current.add(url);
      return { id: crypto.randomUUID(), objectKey: `local/${crypto.randomUUID()}`, type: file.type === 'video/mp4' ? 'VIDEO' as const : 'IMAGE' as const, file, preview: url, url, position: items.length, inlineImage: false };
    })]);
  };
  const move = (index: number, direction: number) => setMedia((items) => {
    const next = [...items]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; return next;
  });
  const inlineKeys = markdownImageKeys(content);
  const onInlineImage = (file: File): PostImage | null => {
    const sizeError = imageRequestError([...media.flatMap(item => item.file ? [item.file] : []), file]);
    if (sizeError) { toast(sizeError, 'error'); return null; }
    const url = URL.createObjectURL(file); objectUrls.current.add(url);
    const image = { id: crypto.randomUUID(), objectKey: `local/${crypto.randomUUID()}`, type: 'IMAGE' as const,
      file, preview: url, url, position: media.length, inlineImage: true };
    setMedia(items => [...items, image]);
    return image;
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!selectedCommunity) { toast('Hãy chọn một cộng đồng bạn đã tham gia.', 'error'); return; }
    if (!title.trim()) { toast('Vui lòng nhập tiêu đề bài viết.', 'error'); return; }
    if (type === 'TEXT' && !content.trim() && !media.length) { toast('Vui lòng nhập nội dung hoặc đính kèm ảnh hay video.', 'error'); return; }
    if (inlineKeys.some((key) => !media.some((item) => item.objectKey === key))) { toast('Ảnh chèn trong nội dung phải có trong danh sách media.', 'error'); return; }
    setBusy(true);
    onBusyChange?.(true);
    setFormError('');
    try {
      const attachments: PostMediaInput[] = [];
      const files: File[] = [];
      for (const item of media) {
        if (!item.objectKey) throw new Error('Tệp đính kèm không có mã tham chiếu. Hãy chọn lại tệp.');
        const fileIndex = item.file ? files.push(item.file) - 1 : undefined;
        attachments.push({ type: item.type, objectKey: item.objectKey, fileIndex, caption: item.caption ?? undefined });
      }
      const input = {
        communityName: selectedCommunity.name, title: title.trim(), type, content, linkUrl: editingPost?.linkUrl ?? undefined,
        media: attachments, files,
      };
      const post = editingPost ? await editPost(editingPost.id, input) : await addPost(input);
      toast(editingPost ? 'Đã cập nhật bài viết.' : 'Đã đăng bài viết.', 'success');
      onSaved(post);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu bài viết.';
      setFormError(message); toast(message, 'error');
    }
    finally { setBusy(false); onBusyChange?.(false); }
  };

  const resolvedMedia: PostMedia[] = media.map((item, position) => ({
    ...item, objectKey: item.objectKey || null, url: item.preview || item.url, position,
    inlineImage: !!item.objectKey && inlineKeys.includes(item.objectKey),
  }));
  return (
    <form onSubmit={submit} className="post-composer" aria-busy={busy}>
      <fieldset disabled={busy} className="post-composer-fields">
        {editingPost ? <p className="post-composer-help">Cộng đồng · c/{editingPost.communityName}</p> :
          <CommunityPicker communities={canPost} selected={selectedCommunity} onSelect={setCommunityName} />}
        {communityName && !selectedCommunity && !editingPost &&
          <p className="post-composer-help" role="status">Chọn cộng đồng đã tham gia để đăng bài.</p>}
        <label>
          <span className="post-composer-label">Tiêu đề <span>{title.length}/300</span></span>
          <input aria-label="Tiêu đề bài viết" value={title} maxLength={300} required
            onChange={(event) => setTitle(event.target.value)} placeholder="Đặt tiêu đề cho bài viết" />
        </label>
        <div className="post-composer-section"><h2>Nội dung bài viết</h2></div>
        <MarkdownEditor value={content} onChange={setContent} images={resolvedMedia.filter((item) => item.type === 'IMAGE')}
          onImage={onInlineImage} imageLimitReached={media.length >= 20} />
        <div className="post-composer-section"><h2>Ảnh và video <span>{media.length}/20</span></h2><p>Sắp xếp các tệp theo thứ tự bạn muốn hiển thị.</p></div>
        <div className="post-image-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
          event.preventDefault(); acceptFiles(Array.from(event.dataTransfer.files));
        }}>
          <ImagePlus size={24} /><p>Kéo ảnh hoặc video vào đây, hoặc chọn từ thiết bị</p><span>Tối đa 20 tệp · JPG, PNG, WebP, MP4 · 10 MB/tệp · Tổng mỗi lần gửi tối đa 55 MB</span>
          <Button type="button" variant="secondary" disabled={media.length >= 20} onClick={() => fileInput.current?.click()}>Chọn ảnh hoặc video</Button>
          <input ref={fileInput} type="file" hidden multiple accept="image/jpeg,image/png,image/webp,video/mp4"
            onChange={(event) => { acceptFiles(Array.from(event.target.files || [])); event.target.value = ''; }} />
        </div>
        <div className="post-image-drafts">{media.map((item, index) => <section key={item.id} className="post-image-draft">
          {item.type === 'VIDEO' ? <VideoPlayer src={item.preview || httpUrl(item.url)} label="Xem trước video" /> : <img src={item.preview || item.url} alt={`Ảnh ${index + 1}`} />}
          <div><span>{index + 1} / {media.length}</span><span>{item.file ? 'Tệp mới · Chưa gửi' : 'Tệp hiện có'}</span></div>
          {item.objectKey && inlineKeys.includes(item.objectKey) && <p className="post-inline-media-note">Đang chèn trong nội dung</p>}
          <div className="post-image-tools">
            <button type="button" aria-label={`Đưa media ${index + 1} lên trước`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowLeft size={16} /></button>
            <button type="button" aria-label={`Đưa media ${index + 1} ra sau`} disabled={index === media.length - 1} onClick={() => move(index, 1)}><ArrowRight size={16} /></button>
            <button type="button" aria-label={`Xóa media ${index + 1}`} onClick={() => {
              if (item.objectKey && inlineKeys.includes(item.objectKey)) { toast('Hãy xóa tham chiếu ảnh trong Markdown trước khi gỡ media.', 'warning'); return; }
              if (item.file && item.preview) {
                URL.revokeObjectURL(item.preview); objectUrls.current.delete(item.preview);
              }
              setMedia((items) => items.filter((current) => current.id !== item.id));
            }}><X size={16} /></button>
          </div>
        </section>)}</div>
        <button type="button" className="post-preview-button" aria-expanded={preview} onClick={() => setPreview(!preview)}>{preview ? 'Ẩn xem trước' : 'Xem trước bài viết'}</button>
        {preview && <section className="post-composer-preview"><h2>{title || 'Tiêu đề bài viết'}</h2>
          <PostBody preview post={{ title, type, content, media: resolvedMedia, linkUrl: editingPost?.linkUrl ?? null }} />
        </section>}
      </fieldset>
      {formError && <p className="post-composer-error" role="alert">{formError} Nội dung của bạn vẫn được giữ lại để thử lại.</p>}
      <footer><span className="post-block-count" role="status">{busy ? 'Đang gửi ảnh và lưu bài viết…' : `${media.length} / 20 tệp`}</span>
        <Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>Hủy</Button>
        <Button type="submit" variant="primary" disabled={busy || !title.trim() || (type === 'TEXT' && !content.trim() && !media.length) || !selectedCommunity}>{busy ? 'Đang lưu…' : editingPost ? 'Lưu thay đổi' : 'Đăng bài'}</Button>
      </footer>
    </form>
  );
}
