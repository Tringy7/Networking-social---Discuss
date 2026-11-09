export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_REQUEST_BYTES = 55 * 1024 * 1024;

export function imageRequestError(files: Pick<File, 'size' | 'name'>[], metadata: unknown = {}): string | undefined {
  const metadataBytes = new Blob([JSON.stringify(metadata) ?? '']).size;
  const estimatedBytes = files.reduce((size, file) => size + file.size + new Blob([file.name]).size + 1024, 0)
    + metadataBytes + 64 * 1024;
  if (estimatedBytes > MAX_IMAGE_REQUEST_BYTES) return 'Tổng dung lượng mỗi lần gửi tối đa 55 MB, bao gồm nội dung và ảnh. Vui lòng bớt ảnh hoặc giảm dung lượng.';
}

export function assertImageRequestSize(files: Pick<File, 'size' | 'name'>[], metadata: unknown): void {
  const error = imageRequestError(files, metadata);
  if (error) throw new Error(error);
}
