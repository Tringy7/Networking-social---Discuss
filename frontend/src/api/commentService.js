import { apiClient } from './client';

/**
 * Comment API Service
 * Handles Comments & Nested Replies (Module 5)
 */

export const commentService = {
  /**
   * Tạo bình luận hoặc trả lời (reply)
   */
  createComment: async ({ postId, authorId, parentId = null, content }) => {
    await apiClient.delay(180);
    if (!content || !content.trim()) {
      throw new Error('Nội dung bình luận không được để trống!');
    }

    const newComment = {
      id: `cmt-${Date.now()}`,
      postId,
      authorId,
      parentId,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return newComment;
  },

  /**
   * Chỉnh sửa bình luận của mình
   */
  updateComment: async (commentId, content) => {
    await apiClient.delay(150);
    if (!content || !content.trim()) {
      throw new Error('Nội dung bình luận không được để trống!');
    }
    return {
      commentId,
      content: content.trim(),
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Xóa bình luận (Bởi tác giả hoặc Mod/Owner/Admin)
   */
  deleteComment: async (commentId) => {
    await apiClient.delay(120);
    return { success: true, commentId };
  }
};
