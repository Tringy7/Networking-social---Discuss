import { useState } from 'react';
import Modal from '../ui/Modal';
import { usePostStore } from '../../store/usePostStore';
import PostComposer from './PostComposer';

export default function PostComposerModal() {
  const { closeEditModal, editingPost } = usePostStore();
  const [busy, setBusy] = useState(false);
  return <Modal isOpen={!!editingPost} onClose={closeEditModal} closeDisabled={busy}
    title="Chỉnh sửa bài viết" maxWidth="4xl">
    {editingPost && <PostComposer key={editingPost.id} editingPost={editingPost}
      onCancel={closeEditModal} onSaved={closeEditModal} onBusyChange={setBusy} />}
  </Modal>;
}
