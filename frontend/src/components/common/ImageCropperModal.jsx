import React, { useState, useRef, useEffect } from 'react';
import Modal from '../common/Modal';
import { ZoomIn, ZoomOut, RotateCw, Check, X, Loader2 } from 'lucide-react';

export default function ImageCropperModal({
  isOpen,
  onClose,
  imageFile,
  targetType = 'avatar', // 'avatar' | 'banner'
  onConfirmCrop,
  loading = false,
}) {
  const [imageSrc, setImageSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Kích thước chuẩn đầu ra theo yêu cầu tutorial:
  // Avatar: 256x256 (tỉ lệ 1:1)
  // Banner: 1500x500 (tỉ lệ 3:1)
  const isAvatar = targetType === 'avatar';
  const targetWidth = isAvatar ? 256 : 1500;
  const targetHeight = isAvatar ? 256 : 500;
  const aspectRatio = targetWidth / targetHeight;

  // Khung xem trước (viewport crop box kích thước trong modal)
  const previewBoxWidth = isAvatar ? 280 : 420;
  const previewBoxHeight = isAvatar ? 280 : 140;

  useEffect(() => {
    if (!imageFile) {
      setImageSrc(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImageSrc(objectUrl);
    setZoom(1);
    setPosition({ x: 0, y: 0 });

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleApplyCrop = () => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    // Tính toán tỉ lệ giữa khung preview và kích thước ảnh thực tế
    const displayedWidth = img.clientWidth * zoom;
    const displayedHeight = img.clientHeight * zoom;

    // Tỉ lệ scale sang output
    const scaleFactorX = targetWidth / previewBoxWidth;
    const scaleFactorY = targetHeight / previewBoxHeight;

    // Vẽ ảnh lên canvas theo đúng vị trí người dùng kéo và zoom
    ctx.imageSmoothingQuality = 'high';
    
    // Tọa độ vẽ
    const drawX = (position.x + (previewBoxWidth - displayedWidth) / 2) * scaleFactorX;
    const drawY = (position.y + (previewBoxHeight - displayedHeight) / 2) * scaleFactorY;
    const drawW = displayedWidth * scaleFactorX;
    const drawH = displayedHeight * scaleFactorY;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    // Xuất ra file Blob webp/png chất lượng cao
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const croppedFile = new File(
          [blob],
          isAvatar ? 'avatar.webp' : 'banner.webp',
          { type: 'image/webp' }
        );
        onConfirmCrop(croppedFile);
      },
      'image/webp',
      0.92
    );
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title={isAvatar ? 'Căn chỉnh & Cắt ảnh đại diện' : 'Căn chỉnh & Cắt ảnh bìa'}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Kéo ảnh để chọn vùng hiển thị và dùng thanh trượt để phóng to/thu nhỏ (Ảnh sẽ được cố định kích thước chuẩn{' '}
          <strong className="text-slate-700">{targetWidth}x{targetHeight}px</strong>).
        </p>

        {/* Khung tương tác cắt ảnh */}
        <div className="flex justify-center p-4 bg-slate-950 rounded-2xl overflow-hidden select-none">
          <div
            ref={containerRef}
            className={`relative overflow-hidden cursor-grab active:cursor-grabbing border-2 border-dashed border-indigo-400/80 shadow-2xl flex items-center justify-center ${
              isAvatar ? 'rounded-full' : 'rounded-xl'
            }`}
            style={{
              width: `${previewBoxWidth}px`,
              height: `${previewBoxHeight}px`,
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop preview"
              draggable={false}
              className="max-w-none transition-transform duration-75 pointer-events-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                maxHeight: isAvatar ? '160%' : '200%',
              }}
            />
          </div>
        </div>

        {/* Thanh điều khiển zoom */}
        <div className="flex items-center gap-3 px-2">
          <ZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="range"
            min={0.8}
            max={3.0}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
          <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPosition({ x: 0, y: 0 });
            }}
            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg text-xs font-medium shrink-0 cursor-pointer"
            title="Đặt lại vị trí"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{loading ? 'Đang tải lên...' : 'Cắt & Lưu ảnh'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
