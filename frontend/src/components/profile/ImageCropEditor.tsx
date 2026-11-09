import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, ImagePlus, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

export type ProfileImageKind = 'avatar' | 'banner';
type CropCorner = 'nw' | 'ne' | 'sw' | 'se';
type CropRect = { x: number; y: number; width: number; height: number };
const cropCorners: { corner: CropCorner; label: string }[] = [
  { corner: 'nw', label: 'trên trái' }, { corner: 'ne', label: 'trên phải' },
  { corner: 'sw', label: 'dưới trái' }, { corner: 'se', label: 'dưới phải' },
];

interface ImageCropEditorProps {
  kind: ProfileImageKind;
  entity?: 'user' | 'community';
  isOpen: boolean;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (file: File) => Promise<void>;
}

const OUTPUT = {
  avatar: { width: 256, height: 256, ratio: 1, label: '256 × 256 px (1:1)' },
  banner: { width: 1920, height: 480, ratio: 4, label: '1920 × 480 px (4:1)' },
} as const;

export default function ImageCropEditor({ kind, entity = 'user', isOpen, isSaving = false, onClose, onSave }: ImageCropEditorProps) {
  const config = entity === 'community' && kind === 'avatar'
    ? { ...OUTPUT.avatar, width: 512, height: 512, label: '512 × 512 px (1:1)' }
    : OUTPUT[kind];
  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; pointerId: number; target: 'image' | 'crop' | 'resize'; corner?: CropCorner; rect?: CropRect } | null>(null);
  const savingRef = useRef(false);
  const [processing, setProcessing] = useState(false);
  const busy = isSaving || processing;
  const [source, setSource] = useState('');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropPosition, setCropPosition] = useState({ x: 0.5, y: 0.5 });
  const [cropScale, setCropScale] = useState(0.85);
  const [dragging, setDragging] = useState<'image' | 'crop' | 'resize' | null>(null);
  const [saveError, setSaveError] = useState('');
  const [fileError, setFileError] = useState('');
  const baseScale = imageSize.width && stageSize.width
    ? Math.min(stageSize.width / imageSize.width, stageSize.height / imageSize.height)
    : 0;
  const cropRect = useMemo(() => {
    if (!stageSize.width || !stageSize.height) return { x: 0, y: 0, width: 0, height: 0 };
    const width = Math.min(stageSize.width, stageSize.height * config.ratio) * cropScale;
    const height = width / config.ratio;
    return { x: (stageSize.width - width) * cropPosition.x, y: (stageSize.height - height) * cropPosition.y, width, height };
  }, [config.ratio, stageSize, cropPosition, cropScale]);

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

  const reset = () => {
    dragRef.current = null;
    setDragging(null);
    setOffset({ x: 0, y: 0 }); setZoom(1); setRotation(0);
    setCropPosition({ x: 0.5, y: 0.5 }); setCropScale(0.85);
  };
  const close = () => { setSource(''); setImageSize({ width: 0, height: 0 }); setSaveError(''); setFileError(''); reset(); onClose(); };
  const requestClose = () => { if (!busy && !savingRef.current) close(); };
  const selectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || busy) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFileError('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError('Ảnh không được vượt quá 10 MB.');
      return;
    }
    setFileError('');
    setImageSize({ width: 0, height: 0 });
    setSource(URL.createObjectURL(file));
    reset();
    setSaveError('');
  };

  const save = async () => {
    if (savingRef.current || busy || !source || !imageSize.width || !baseScale || !cropRect.width) return;
    savingRef.current = true;
    setProcessing(true);
    setSaveError('');
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
    } finally { savingRef.current = false; setProcessing(false); }
  };

  const moveCrop = (dx: number, dy: number) => {
    const availableX = stageSize.width - cropRect.width;
    const availableY = stageSize.height - cropRect.height;
    setCropPosition((value) => ({
      x: availableX > 0 ? Math.max(0, Math.min(1, value.x + dx / availableX)) : 0.5,
      y: availableY > 0 ? Math.max(0, Math.min(1, value.y + dy / availableY)) : 0.5,
    }));
  };
  const resizeCrop = (corner: CropCorner, original: CropRect, dx: number, dy: number) => {
    const directionX = corner.endsWith('e') ? 1 : -1;
    const directionY = corner.startsWith('s') ? 1 : -1;
    const anchorX = directionX === 1 ? original.x : original.x + original.width;
    const anchorY = directionY === 1 ? original.y : original.y + original.height;
    const maxWidth = Math.min(stageSize.width, stageSize.height * config.ratio);
    const limit = Math.min(directionX === 1 ? stageSize.width - anchorX : anchorX,
      (directionY === 1 ? stageSize.height - anchorY : anchorY) * config.ratio);
    // Project the pointer onto the fixed-ratio diagonal, keeping the opposite corner still.
    const change = (directionX * dx + directionY * dy / config.ratio) / (1 + 1 / config.ratio ** 2);
    const width = Math.max(Math.min(maxWidth * 0.35, limit), Math.min(limit, original.width + change));
    const height = width / config.ratio;
    const x = directionX === 1 ? anchorX : anchorX - width;
    const y = directionY === 1 ? anchorY : anchorY - height;
    setCropScale(width / maxWidth);
    setCropPosition({
      x: stageSize.width > width ? Math.max(0, Math.min(1, x / (stageSize.width - width))) : 0.5,
      y: stageSize.height > height ? Math.max(0, Math.min(1, y / (stageSize.height - height))) : 0.5,
    });
  };
  const startDrag = (event: React.PointerEvent<HTMLElement>, target: 'image' | 'crop' | 'resize', corner?: CropCorner) => {
    if (!source || !imageSize.width || busy || dragRef.current || !event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId, target, corner, rect: target === 'resize' ? { ...cropRect } : undefined };
    setDragging(target);
  };
  const moveSelection = (event: React.PointerEvent<HTMLDivElement>) => {
    const prior = dragRef.current;
    if (!prior || prior.pointerId !== event.pointerId || busy) return;
    const dx = event.clientX - prior.x;
    const dy = event.clientY - prior.y;
    if (prior.target === 'resize' && prior.corner && prior.rect) {
      resizeCrop(prior.corner, prior.rect, dx, dy);
      return;
    }
    if (prior.target === 'crop') moveCrop(dx, dy);
    else setOffset((value) => ({ x: value.x + dx, y: value.y + dy }));
    dragRef.current = { ...prior, x: event.clientX, y: event.clientY };
  };
  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(null);
  };

  return <Modal isOpen={isOpen} onClose={requestClose} closeDisabled={busy}
    title={`${kind === 'avatar' ? 'Chỉnh sửa ảnh đại diện' : 'Chỉnh sửa ảnh bìa'}${entity === 'community' ? ' cộng đồng' : ''}`}
    description={`Khung đầu ra ${config.label}. Kéo khung cắt để chọn vùng cần lưu.${kind === 'banner' ? ' Giữ nội dung chính ở giữa để hiển thị tốt trên điện thoại.' : ''}`} maxWidth={kind === 'avatar' ? 'md' : '2xl'}>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={busy} onChange={selectImage} />
    <div data-ui="crop-editor" className="image-crop-editor space-y-4" aria-busy={busy}>
      <fieldset disabled={busy} className="min-w-0 space-y-4">
      {/* The white canvas matches the JPEG background when a crop includes space outside the image. */}
      <div ref={stageRef} className={`relative mx-auto w-full max-w-2xl overflow-hidden rounded-xl bg-white touch-none ${source ? dragging === 'image' ? 'cursor-grabbing' : 'cursor-grab' : ''} ${kind === 'avatar' ? 'aspect-[4/3]' : 'aspect-[2/1]'}`}
        role="group" aria-label="Căn vị trí ảnh bằng phím mũi tên" tabIndex={source && !busy ? 0 : -1}
        onKeyDown={(event) => {
          if (!source || busy || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
          event.preventDefault();
          const step = event.shiftKey ? 1 : 10;
          setOffset((value) => ({ x: value.x + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0), y: value.y + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0) }));
        }}
        onPointerDown={(event) => startDrag(event, 'image')}
        onPointerMove={moveSelection} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
        {source && <img src={source} alt="Ảnh gốc" draggable={false}
          onError={() => { setFileError('Không thể đọc ảnh. Hãy chọn một ảnh JPG, PNG hoặc WebP hợp lệ.'); setSource(''); }}
          onLoad={(event) => {
            const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
            if (width * height > 40000000) { setFileError('Ảnh vượt giới hạn 40 triệu điểm ảnh.'); setSource(''); return; }
            setImageSize({ width, height });
          }}
          className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
          style={{ width: imageSize.width * baseScale, height: imageSize.height * baseScale, transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${rotation}deg) scale(${zoom})` }} />}
        {source && cropRect.width > 0 && <div role="group" aria-label="Khung cắt ảnh, kéo hoặc dùng phím mũi tên để di chuyển" tabIndex={busy ? -1 : 0}
          className={`crop-selection absolute touch-none rounded-md border-2 border-[var(--color-orange)] ${dragging === 'crop' ? 'cursor-grabbing' : 'cursor-move'}`}
          onPointerDown={(event) => startDrag(event, 'crop')}
          onKeyDown={(event) => {
            if (busy || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
            event.preventDefault(); event.stopPropagation();
            const step = event.shiftKey ? 1 : 10;
            moveCrop(event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0,
              event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0);
          }}
          style={{ left: cropRect.x, top: cropRect.y, width: cropRect.width, height: cropRect.height, boxShadow: '0 0 0 9999px color-mix(in srgb, var(--bg-main) 72%, transparent)' }}>
          {kind === 'avatar' && <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full border border-white/80" />}
          {cropCorners.map(({ corner, label }) => <button key={corner} type="button" disabled={busy}
            className={`crop-resize-handle crop-resize-handle--${corner}`}
            aria-label={`Đổi kích thước khung từ góc ${label}`} title="Kéo góc để đổi kích thước khung"
            onPointerDown={(event) => startDrag(event, 'resize', corner)}
            onKeyDown={(event) => {
              if (busy || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
              event.preventDefault(); event.stopPropagation();
              const step = event.shiftKey ? 1 : 10;
              resizeCrop(corner, cropRect, event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0,
                event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0);
            }} />)}
        </div>}
        {!source && <button type="button" onClick={() => inputRef.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[var(--text-secondary)]">
          <ImagePlus className="h-9 w-9 text-[var(--color-orange)]"/><span className="text-sm font-semibold">Chọn ảnh từ thiết bị</span><span className="text-xs">JPG, PNG hoặc WebP · Tối đa 10 MB</span></button>}
      </div>
      {fileError && <p role="alert" className="text-center text-sm text-[var(--color-danger)]">{fileError}</p>}
      {source && <>
        <p className="text-center text-xs text-[var(--text-secondary)]">Kéo góc để đổi kích thước, kéo khung để chọn vùng cắt; kéo bên ngoài khung để di chuyển ảnh. Có thể dùng phím mũi tên để căn chỉnh.</p>
        <label className="flex flex-wrap items-center justify-center gap-3 text-xs text-[var(--text-secondary)]">
          <span>Kích thước khung</span>
          <input type="range" min="35" max="100" step="1" value={Math.round(cropScale * 100)} onChange={(event) => setCropScale(Number(event.target.value) / 100)} aria-label="Kích thước khung cắt" className="w-36 accent-[var(--color-orange)]" />
          <span className="w-9 tabular-nums">{Math.round(cropScale * 100)}%</span>
        </label>
        {saveError && <p role="alert" className="text-center text-sm text-[var(--color-danger)]">{saveError}</p>}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button type="button" onClick={() => setZoom((v) => Math.max(0.1, Number((v - 0.1).toFixed(2))))} className="rounded-lg border border-[var(--border-color)] p-2" aria-label="Thu nhỏ ảnh"><ZoomOut className="h-4 w-4"/></button>
          <input type="range" min="0.1" max="4" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-36 accent-[var(--color-orange)]" aria-label="Mức thu phóng"/>
          <button type="button" onClick={() => setZoom((v) => Math.min(4, Number((v + 0.1).toFixed(2))))} className="rounded-lg border border-[var(--border-color)] p-2" aria-label="Phóng to ảnh"><ZoomIn className="h-4 w-4"/></button>
          <button type="button" onClick={() => setRotation((v) => (v - 90 + 360) % 360)} className="rounded-lg border border-[var(--border-color)] p-2" aria-label="Xoay trái"><RotateCcw className="h-4 w-4"/></button>
          <button type="button" onClick={() => setRotation((v) => (v + 90) % 360)} className="rounded-lg border border-[var(--border-color)] p-2" aria-label="Xoay phải"><RotateCw className="h-4 w-4"/></button>
          <button type="button" onClick={reset} className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-semibold">Đặt lại</button>
          <button type="button" onClick={() => inputRef.current?.click()} className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-semibold">Chọn ảnh khác</button>
        </div>
      </>}
      </fieldset>
      <div className="flex justify-end gap-2 border-t border-[var(--border-color)] pt-4">
        <Button type="button" variant="secondary" onClick={requestClose} disabled={busy}>Hủy</Button>
        <Button type="button" variant="primary" onClick={() => void save()} disabled={!source || !imageSize.width || !baseScale} isLoading={busy} leftIcon={kind === 'avatar' ? <Camera className="h-4 w-4"/> : <ImageIcon className="h-4 w-4"/>}>{busy ? 'Đang lưu...' : kind === 'avatar' ? 'Lưu ảnh' : 'Lưu ảnh bìa'}</Button>
      </div>
    </div>
  </Modal>;
}
