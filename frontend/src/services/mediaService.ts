const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const MINIO_ENDPOINT = import.meta.env.VITE_MINIO_ENDPOINT || 'http://localhost:9000';
const MINIO_BUCKET = import.meta.env.VITE_MINIO_BUCKET || 'discuss-media';

export interface FileUploadResponse {
  objectKey: string;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  contentType: string;
  size: number;
}

export interface PostImageKeys {
  large: string;
  medium: string;
  thumb: string;
  largeUrl: string;
  mediumUrl: string;
  thumbUrl: string;
  width: number;
  height: number;
}

export interface AvatarKeys {
  avatar: string;
  avatarUrl: string;
  size: number;
}

export interface CoverKeys {
  cover: string;
  coverUrl: string;
  width: number;
  height: number;
}

/**
 * Upload ảnh bài viết tối ưu đa kích thước (large, medium, thumb) theo chuẩn Facebook/Instagram
 */
export async function uploadPostImage(file: File): Promise<PostImageKeys> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/media/images`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(errorData || `Upload post image failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Upload avatar vuông cắt từ giữa ảnh
 */
export async function uploadAvatar(file: File, size: number = 400): Promise<AvatarKeys> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/media/avatar?size=${size}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(errorData || `Upload avatar failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Upload ảnh bìa cắt chuẩn tỉ lệ 16:9
 */
export async function uploadCover(file: File): Promise<CoverKeys> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/media/cover`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(errorData || `Upload cover failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Upload single media file (gốc)
 */
export async function uploadMedia(file: File, folder: string = 'posts'): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await fetch(`${API_BASE_URL}/media/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(errorData || `Upload failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Upload multiple media files (gốc)
 */
export async function uploadMultipleMedia(files: File[], folder: string = 'posts'): Promise<FileUploadResponse[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('folder', folder);

  const response = await fetch(`${API_BASE_URL}/media/upload/multiple`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(errorData || `Upload failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Helper lấy URL đầy đủ từ objectKey
 */
export function getMediaUrl(objectKeyOrUrl?: string): string {
  if (!objectKeyOrUrl) return '';
  if (objectKeyOrUrl.startsWith('http://') || objectKeyOrUrl.startsWith('https://')) {
    return objectKeyOrUrl;
  }
  const cleanEndpoint = MINIO_ENDPOINT.endsWith('/') ? MINIO_ENDPOINT.slice(0, -1) : MINIO_ENDPOINT;
  return `${cleanEndpoint}/${MINIO_BUCKET}/${objectKeyOrUrl}`;
}
