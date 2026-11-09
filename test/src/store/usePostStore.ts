import { create } from 'zustand';
import { Post, Comment } from '../types';
import { MOCK_POSTS, MOCK_COMMENTS, CURRENT_MOCK_USER } from '../mocks/mockData';

interface PostState {
  posts: Post[];
  comments: Record<string, Comment[]>;
  toggleHeart: (postId: string) => void;
  toggleSave: (postId: string) => void;
  addPost: (postData: {
    communityName: string;
    communityDisplayName: string;
    communityAvatar: string;
    title: string;
    content: string;
    tags?: string[];
    mediaUrl?: string;
    mediaType?: 'image' | 'code' | 'link';
    codeSnippet?: { language: string; code: string };
  }) => Post;
  deletePost: (postId: string) => void;
  addComment: (postId: string, content: string, parentCommentId?: string) => void;
  toggleCommentHeart: (postId: string, commentId: string) => void;
  isCreateModalOpen: boolean;
  targetCommunityName?: string;
  openCreateModal: (communityName?: string) => void;
  closeCreateModal: () => void;
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: MOCK_POSTS,
  comments: MOCK_COMMENTS,
  isCreateModalOpen: false,
  targetCommunityName: undefined,

  openCreateModal: (communityName) => {
    set({ isCreateModalOpen: true, targetCommunityName: communityName });
  },

  closeCreateModal: () => {
    set({ isCreateModalOpen: false, targetCommunityName: undefined });
  },

  toggleHeart: (postId) => {
    set((state) => ({
      posts: state.posts.map((p) => {
        if (p.id === postId) {
          const isHearted = !p.isHearted;
          return {
            ...p,
            isHearted,
            heartCount: isHearted ? p.heartCount + 1 : Math.max(0, p.heartCount - 1),
          };
        }
        return p;
      }),
    }));
  },

  toggleSave: (postId) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, isSaved: !p.isSaved } : p
      ),
    }));
  },

  addPost: (postData) => {
    const newPost: Post = {
      id: `post_${Date.now()}`,
      communityName: postData.communityName,
      communityDisplayName: postData.communityDisplayName,
      communityAvatar: postData.communityAvatar,
      author: {
        id: CURRENT_MOCK_USER.id,
        username: CURRENT_MOCK_USER.username,
        displayName: CURRENT_MOCK_USER.displayName,
        avatarUrl: CURRENT_MOCK_USER.avatarUrl,
        role: CURRENT_MOCK_USER.role,
      },
      title: postData.title,
      content: postData.content,
      tags: postData.tags || [],
      mediaUrl: postData.mediaUrl,
      mediaType: postData.mediaType,
      codeSnippet: postData.codeSnippet,
      heartCount: 0,
      commentCount: 0,
      isHearted: false,
      isSaved: false,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({ posts: [newPost, ...state.posts] }));
    return newPost;
  },

  deletePost: (postId) => {
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== postId),
    }));
  },

  addComment: (postId, content, parentCommentId) => {
    const newComment: Comment = {
      id: `cmt_${Date.now()}`,
      postId,
      author: {
        id: CURRENT_MOCK_USER.id,
        username: CURRENT_MOCK_USER.username,
        displayName: CURRENT_MOCK_USER.displayName,
        avatarUrl: CURRENT_MOCK_USER.avatarUrl,
        isAuthor: true,
      },
      content,
      parentCommentId: parentCommentId || null,
      heartCount: 0,
      isHearted: false,
      replies: [],
      createdAt: new Date().toISOString(),
    };

    const currentPostComments = get().comments[postId] || [];

    if (parentCommentId) {
      // Add nested reply
      const updatedComments = currentPostComments.map((c) => {
        if (c.id === parentCommentId) {
          return {
            ...c,
            replies: [...(c.replies || []), newComment],
          };
        }
        return c;
      });
      set((state) => ({
        comments: { ...state.comments, [postId]: updatedComments },
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
        ),
      }));
    } else {
      set((state) => ({
        comments: {
          ...state.comments,
          [postId]: [newComment, ...currentPostComments],
        },
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
        ),
      }));
    }
  },

  toggleCommentHeart: (postId, commentId) => {
    const currentPostComments = get().comments[postId] || [];
    const toggleInList = (list: Comment[]): Comment[] => {
      return list.map((c) => {
        if (c.id === commentId) {
          const isHearted = !c.isHearted;
          return {
            ...c,
            isHearted,
            heartCount: isHearted ? c.heartCount + 1 : Math.max(0, c.heartCount - 1),
          };
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: toggleInList(c.replies) };
        }
        return c;
      });
    };

    set((state) => ({
      comments: {
        ...state.comments,
        [postId]: toggleInList(currentPostComments),
      },
    }));
  },
}));
