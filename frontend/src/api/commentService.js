import { apiClient } from './client';
export const commentService = {
  list: (postId) => apiClient.get(`/posts/${postId}/comments`),
  createComment: ({ postId, parentId = null, content }) =>
    apiClient.post('/comments', { postId, parentId, content }),
  updateComment: (commentId, content) =>
    apiClient.patch(`/comments/${commentId}`, { content }),
  deleteComment: (commentId) => apiClient.delete(`/comments/${commentId}`),
};
