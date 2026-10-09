import { apiClient } from './client';

/**
 * Post & Vote API Service
 * Handles Post (Module 4) & Vote (Module 6) operations
 */

export const postService = {
  /**
   * Tạo bài viết mới
   */
  createPost: async (postData, authorId) => {
    await apiClient.delay(200);
    const { communityId, title, content, tags } = postData;

    if (!title || !content || !communityId) {
      throw new Error('Vui lòng nhập đầy đủ tiêu đề, nội dung và chọn cộng đồng!');
    }

    const newPost = {
      id: `post-${Date.now()}`,
      communityId,
      authorId,
      title: title.trim(),
      content: content.trim(),
      tags: Array.isArray(tags) ? tags : [],
      upvotes: 1, // Tác giả tự động upvote mặc định
      downvotes: 0,
      voteScore: 1,
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      commentsCount: 0,
    };

    return newPost;
  },

  /**
   * Chỉnh sửa bài viết của mình
   */
  updatePost: async (postId, updates) => {
    await apiClient.delay(200);
    return {
      postId,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Xóa bài viết
   */
  deletePost: async (postId) => {
    await apiClient.delay(150);
    return { success: true, postId };
  },

  /**
   * Ghim / Bỏ ghim bài viết (Mod, Owner, Admin)
   */
  togglePinPost: async (postId, isPinned) => {
    await apiClient.delay(150);
    return { postId, isPinned: !isPinned };
  },

  /**
   * Báo cáo bài viết vi phạm
   */
  reportPost: async (reportData) => {
    await apiClient.delay(200);
    const { postId, reporterId, communityId, reason, note } = reportData;

    if (!reason) {
      throw new Error('Vui lòng chọn lý do báo cáo!');
    }

    const newReport = {
      id: `rep-${Date.now()}`,
      postId,
      reporterId,
      communityId,
      reason,
      note: note || '',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    return newReport;
  },

  /**
   * Bình chọn Upvote / Downvote
   * voteType: 1 (upvote), -1 (downvote), 0 (cancel/remove vote)
   */
  votePost: async (postId, userId, voteType, currentVote = 0) => {
    await apiClient.delay(100);
    return {
      postId,
      userId,
      newVote: voteType === currentVote ? 0 : voteType, // Toggle off if clicked again
    };
  }
};
