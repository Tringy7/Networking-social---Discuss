import apiClient from './apiClient';

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

export interface StoredPostImage {
  objectKey: string;
  url: string;
  contentType: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Uploads a cropped post image and returns its persisted media URL.
 */
export async function uploadPostImage(file: File): Promise<StoredPostImage> {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.post<StoredPostImage>('/media/post-image', formData);
}

/**
 * Upload avatar vuông cắt từ giữa ảnh
 */
export async function uploadAvatar(file: File, size: number = 400): Promise<AvatarKeys> {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.post<AvatarKeys>(`/media/avatar?size=${size}`, formData);
}

/**
 * Upload ảnh bìa cắt chuẩn tỉ lệ 16:9
 */
export async function uploadCover(file: File): Promise<CoverKeys> {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.post<CoverKeys>('/media/cover', formData);
}

/**
 * Upload single media file (gốc)
 */
export async function uploadMedia(file: File, folder: string = 'posts'): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  return apiClient.post<FileUploadResponse>('/media/upload', formData);
}

/**
 * Upload multiple media files (gốc)
 */
export async function uploadMultipleMedia(files: File[], folder: string = 'posts'): Promise<FileUploadResponse[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('folder', folder);

  return apiClient.post<FileUploadResponse[]>('/media/upload/multiple', formData);
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
