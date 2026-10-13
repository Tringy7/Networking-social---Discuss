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

/**
 * Upload single media file (image/video) to Spring Boot -> MinIO
 */
export async function uploadMedia(file: File, folder: string = 'posts'): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await fetch(`${API_BASE_URL}/media/upload`, {
    method: 'POST',
    body: formData,
    // Note: don't set Content-Type header manually; browser sets it with boundary
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(errorData || `Upload failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Upload multiple media files
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
 * Helper to construct public URL from an objectKey (or returns full URL if already full)
 */
export function getMediaUrl(objectKeyOrUrl?: string): string {
  if (!objectKeyOrUrl) return '';
  if (objectKeyOrUrl.startsWith('http://') || objectKeyOrUrl.startsWith('https://')) {
    return objectKeyOrUrl;
  }
  const cleanEndpoint = MINIO_ENDPOINT.endsWith('/') ? MINIO_ENDPOINT.slice(0, -1) : MINIO_ENDPOINT;
  return `${cleanEndpoint}/${MINIO_BUCKET}/${objectKeyOrUrl}`;
}
