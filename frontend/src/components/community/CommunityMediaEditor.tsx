import React, { useRef, useState } from 'react';
import ImageCropEditor from '../profile/ImageCropEditor';
import type { ProfileImageKind } from '../profile/ImageCropEditor';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { canEditCommunityMedia } from '../../utils/communityMedia';

interface Props {
  communityName: string;
  kind: ProfileImageKind;
  onClose: () => void;
}

export default function CommunityMediaEditor({ communityName, kind, onClose }: Props) {
  const [uploading, setUploading] = useState(false);
  const pending = useRef(false);
  const notify = useToastStore((state) => state.addToast);

  return <ImageCropEditor kind={kind} entity="community" isOpen isSaving={uploading} onClose={onClose}
    onSave={async (file) => {
      if (pending.current) throw new Error('Ảnh đang được lưu.');
      const { user, isAuthenticated } = useAuthStore.getState();
      const store = useCommunityStore.getState();
      const community = store.communities.find((item) => item.name === communityName);
      if (!community || !canEditCommunityMedia(community, user, isAuthenticated)) {
        throw new Error('Bạn không có quyền thay đổi ảnh cộng đồng này.');
      }
      pending.current = true;
      setUploading(true);
      try {
        await (kind === 'avatar' ? store.uploadAvatar : store.uploadBanner)(communityName, file);
        notify(kind === 'avatar' ? 'Đã cập nhật ảnh đại diện cộng đồng.' : 'Đã cập nhật ảnh bìa cộng đồng.', 'success');
      } catch (error) {
        notify(error instanceof Error ? error.message : 'Không thể lưu ảnh cộng đồng.', 'error');
        throw error;
      } finally {
        pending.current = false;
        setUploading(false);
      }
    }} />;
}
