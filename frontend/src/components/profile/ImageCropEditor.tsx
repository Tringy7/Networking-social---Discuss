import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, ImagePlus, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

export type ProfileImageKind = 'avatar' | 'banner';

interface ImageCropEditorProps {
  kind: ProfileImageKind;
  isOpen: boolean;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (file: File) => Promise<void>;
}

const OUTPUT = {
  avatar: { width: 256, height: 256, ratio: 1, label: '256 × 256 px (1:1)' },
  banner: { width: 1920, height: 640, ratio: 3, label: '1920 × 640 px (3:1)' },
} as const;

export default function ImageCropEditor({ kind, isOpen, isSaving = false, onClose, onSave }: ImageCropEditorProps) {
  const config = OUTPUT[kind];
  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [source, setSource] = useState('');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [saveError, setSaveError] = useState('');
  const [fileError, setFileError] = useState('');
  const baseScale = imageSize.width && stageSize.width
    ? Math.min(stageSize.width / imageSize.width, stageSize.height / imageSize.height)
    : 0;
  const cropRect = useMemo(() => {
    if (!stageSize.width || !stageSize.height) return { x: 0, y: 0, width: 0, height: 0 };
    const width = Math.min(stageSize.width, stageSize.height * config.ratio);
    const height = width / config.ratio;
    return { x: (stageSize.width - width) / 2, y: (stageSize.height - height) / 2, width, height };
  }, [config.ratio, stageSize]);

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setStageSize({
      width: entry.contentRect.width,
      height: entry.contentRect.height,
    }));
    observer.observe(element);
    return () => observer.disconnect();
  }, [isOpen, source]);

  useEffect(() => () => { if (source) URL.revokeObjectURL(source); }, [source]);

  const reset = () => { setOffset({ x: 0, y: 0 }); setZoom(1); setRotation(0); };
  const close = () => { setSource(''); setImageSize({ width: 0, height: 0 }); setSaveError(''); setFileError(''); reset(); onClose(); };
  const selectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFileError('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError('Ảnh không được vượt quá 10 MB.');
      return;
    }
    setFileError('');
    setSource(URL.createObjectURL(file));
    setOffset({ x: 0, y: 0 }); setZoom(1); setRotation(0);
    setSaveError('');
  };

  const save = async () => {
    if (!source || !imageSize.width || !baseScale || !cropRect.width) return;
    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Không thể đọc ảnh đã chọn.'));
        image.src = source;
      });
      const canvas = document.createElement('canvas');
      canvas.width = config.width; canvas.height = config.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Trình duyệt không hỗ trợ chỉnh sửa ảnh.');
      context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
      const outputScale = config.width / cropRect.width;
      const centerX = stageSize.width / 2 + offset.x;
      const centerY = stageSize.height / 2 + offset.y;
      const cropCenterX = cropRect.x + cropRect.width / 2;
      const cropCenterY = cropRect.y + cropRect.height / 2;
      context.translate(canvas.width / 2 + (centerX - cropCenterX) * outputScale,
        canvas.height / 2 + (centerY - cropCenterY) * outputScale);
      context.rotate(rotation * Math.PI / 180);
      const drawnWidth = image.naturalWidth * baseScale * zoom * outputScale;
      const drawnHeight = image.naturalHeight * baseScale * zoom * outputScale;
      context.drawImage(image, -drawnWidth / 2, -drawnHeight / 2, drawnWidth, drawnHeight);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
        (result) => result ? resolve(result) : reject(new Error('Không thể xuất ảnh đã chỉnh sửa.')), 'image/jpeg', 0.94));
      await onSave(new File([blob], kind === 'avatar' ? 'avatar.jpg' : 'profile-banner.jpg', { type: 'image/jpeg' }));
      close();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Không thể lưu ảnh.');
    }
  };

  const moveImage = (event: React.PointerEvent<HTMLDivElement>) => {
    const prior = dragRef.current;
    if (!prior) return;
    setOffset((value) => ({ x: value.x + event.clientX - prior.x, y: value.y + event.clientY - prior.y }));
    dragRef.current = { x: event.clientX, y: event.clientY };
  };

  return <Modal isOpen={isOpen} onClose={() => { if (!isSaving) close(); }}
    title={kind === 'avatar' ? 'Chỉnh sửa ảnh đại diện' : 'Chỉnh sửa ảnh bìa'}
    description={`Khung đầu ra ${config.label}. Kéo ảnh để chọn vùng cần lưu.`} maxWidth={kind === 'avatar' ? 'md' : '2xl'}>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={selectImage} />
    <div className="space-y-5">
      <div ref={stageRef} className={`relative mx-auto w-full max-w-2xl overflow-hidden rounded-xl bg-white touch-none ${kind === 'avatar' ? 'aspect-[4/3]' : 'aspect-[3/2]'}`}
        onPointerDown={(event) => { if (!source) return; event.currentTarget.setPointerCapture(event.pointerId); dragRef.current = { x: event.clientX, y: event.clientY }; }}
        onPointerMove={moveImage} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }}>
        {source && <img src={source} alt="Ảnh gốc" draggable={false} onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
          className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
          style={{ width: imageSize.width * baseScale, height: imageSize.height * baseScale, transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${rotation}deg) scale(${zoom})` }} />}
        {source && cropRect.width > 0 && <div className={`pointer-events-none absolute border-2 border-[var(--color-orange)] shadow-[0_0_0_9999px_rgba(255,255,255,0.72)] ${kind === 'avatar' ? 'rounded-full' : 'rounded-md'}`}
          style={{ left: cropRect.x, top: cropRect.y, width: cropRect.width, height: cropRect.height }} />}
        {!source && <button type="button" onClick={() => inputRef.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[var(--text-secondary)]">
          <ImagePlus className="h-9 w-9 text-[var(--color-orange)]"/><span className="text-sm font-semibold">Chọn ảnh từ thiết bị</span><span className="text-xs">JPG, PNG hoặc WebP · Tối đa 10 MB</span></button>}
      </div>
      {fileError && <p role="alert" className="text-center text-xs text-red-500">{fileError}</p>}
      {source && <>
        <p className="text-center text-xs text-[var(--text-secondary)]">Ảnh gốc hiển thị đầy đủ. Kéo ảnh phía sau khung để căn vị trí.</p>
        {saveError && <p role="alert" className="text-center text-xs text-red-500">{saveError}</p>}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button type="button" onClick={() => setZoom((v) => Math.max(0.1, Number((v - 0.1).toFixed(2))))} className="rounded-lg border border-[var(--border-color)] p-2" aria-label="Thu nhỏ ảnh"><ZoomOut className="h-4 w-4"/></button>
          <input type="range" min="0.1" max="4" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-36 accent-[var(--color-orange)]" aria-label="Mức thu phóng"/>
          <button type="button" onClick={() => setZoom((v) => Math.min(4, Number((v + 0.1).toFixed(2))))} className="rounded-lg border border-[var(--border-color)] p-2" aria-label="Phóng to ảnh"><ZoomIn className="h-4 w-4"/></button>
          <button type="button" onClick={() => setRotation((v) => (v - 90 + 360) % 360)} className="rounded-lg border border-[var(--border-color)] p-2" aria-label="Xoay trái"><RotateCcw className="h-4 w-4"/></button>
          <button type="button" onClick={() => setRotation((v) => (v + 90) % 360)} className="rounded-lg border border-[var(--border-color)] p-2" aria-label="Xoay phải"><RotateCw className="h-4 w-4"/></button>
          <button type="button" onClick={reset} className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-semibold">Reset</button>
          <button type="button" onClick={() => inputRef.current?.click()} className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-semibold">Chọn ảnh khác</button>
        </div>
      </>}
      <div className="flex justify-end gap-2 border-t border-[var(--border-color)] pt-4">
        <Button type="button" variant="secondary" onClick={close} disabled={isSaving}>Hủy</Button>
        <Button type="button" variant="primary" onClick={() => void save()} disabled={!source || isSaving} leftIcon={kind === 'avatar' ? <Camera className="h-4 w-4"/> : <ImageIcon className="h-4 w-4"/>}>{isSaving ? 'Đang lưu...' : kind === 'avatar' ? 'Lưu ảnh' : 'Lưu ảnh bìa'}</Button>
      </div>
    </div>
  </Modal>;
}
