import { create } from 'zustand';
import { Post, Comment } from '../types';
import { commentService, postService } from '../services';

interface PostState {
  posts: Post[];
  savedPosts: Post[];
  comments: Record<string, Comment[]>;
  hydrate: (tab?: string) => Promise<void>;
  hydrateSaved: () => Promise<void>;
  loadPost: (postId: string) => Promise<Post>;
  loadComments: (postId: string) => Promise<void>;
  toggleHeart: (postId: string) => Promise<void>;
  toggleSave: (postId: string) => Promise<void>;
  addPost: (postData: {
    communityName: string;
    title: string;
    content: string;
    tags?: string[];
    mediaUrl?: string;
    mediaType?: Post['mediaType'];
    codeSnippet?: Post['codeSnippet'];
  }) => Promise<Post>;
  deletePost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string, parentCommentId?: string) => Promise<void>;
  toggleCommentHeart: (postId: string, commentId: string) => Promise<void>;
  isCreateModalOpen: boolean;
  targetCommunityName?: string;
  openCreateModal: (communityName?: string) => void;
  closeCreateModal: () => void;
}

function appendReply(comments: Comment[], parentId: string, reply: Comment): Comment[] {
  return comments.map((comment) => {
    if (comment.id === parentId) {
      return { ...comment, replies: [...(comment.replies ?? []), reply] };
    }
    return {
      ...comment,
      replies: comment.replies ? appendReply(comment.replies, parentId, reply) : comment.replies,
    };
  });
}

function updateCommentReaction(
  comments: Comment[],
  commentId: string,
  isHearted: boolean
): Comment[] {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      return {
        ...comment,
        isHearted,
        heartCount: Math.max(0, comment.heartCount + (isHearted ? 1 : -1)),
      };
    }
    return {
      ...comment,
      replies: comment.replies
        ? updateCommentReaction(comment.replies, commentId, isHearted)
        : comment.replies,
    };
  });
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  savedPosts: [],
  comments: {},
  isCreateModalOpen: false,
  targetCommunityName: undefined,

  hydrate: async (tab = 'for-you') => {
    const posts = await postService.list(tab);
    set({ posts });
  },

  hydrateSaved: async () => {
    const savedPosts = await postService.listSaved();
    set({ savedPosts });
  },

  loadPost: async (postId) => {
    const existing = get().posts.find((post) => post.id === postId);
    if (existing) return existing;
    const post = await postService.getById(postId);
    if (!post) throw new Error('Không tìm thấy bài viết.');
    set((state) => ({ posts: [post, ...state.posts] }));
    return post;
  },

  loadComments: async (postId) => {
    const comments = await commentService.list(postId);
    set((state) => ({ comments: { ...state.comments, [postId]: comments } }));
  },

  openCreateModal: (communityName) => {
    set({ isCreateModalOpen: true, targetCommunityName: communityName });
  },

  closeCreateModal: () => {
    set({ isCreateModalOpen: false, targetCommunityName: undefined });
  },

  toggleHeart: async (postId) => {
    const state = get();
    const post = state.posts.find((item) => item.id === postId)
      ?? state.savedPosts.find((item) => item.id === postId);
    if (!post) throw new Error('Không tìm thấy bài viết.');
    const result = await postService.toggleHeart(postId, post.isHearted);
    const updatePost = (item: Post) => item.id === postId
      ? {
          ...item,
          isHearted: result.isHearted,
          heartCount: Math.max(0, item.heartCount + (result.isHearted ? 1 : -1)),
        }
      : item;
    set((current) => ({
      posts: current.posts.map(updatePost),
      savedPosts: current.savedPosts.map(updatePost),
    }));
  },

  toggleSave: async (postId) => {
    const result = await postService.toggleSave(postId);
    set((state) => {
      const posts = state.posts.map((post) =>
        post.id === postId ? { ...post, isSaved: result.isSaved } : post
      );
      const savedPost = posts.find((post) => post.id === postId)
        ?? state.savedPosts.find((post) => post.id === postId);
      const updatedSavedPost = savedPost ? { ...savedPost, isSaved: result.isSaved } : undefined;
      const savedPosts = result.isSaved
        ? updatedSavedPost && !state.savedPosts.some((post) => post.id === postId)
          ? [updatedSavedPost, ...state.savedPosts]
          : state.savedPosts
        : state.savedPosts.filter((post) => post.id !== postId);
      return { posts, savedPosts };
    });
  },

  addPost: async (postData) => {
    const post = await postService.create(postData);
    set((state) => ({ posts: [post, ...state.posts] }));
    return post;
  },

  deletePost: async (postId) => {
    await postService.delete(postId);
    set((state) => ({
      posts: state.posts.filter((post) => post.id !== postId),
      savedPosts: state.savedPosts.filter((post) => post.id !== postId),
    }));
  },

  addComment: async (postId, content, parentCommentId) => {
    const comment = await commentService.create(postId, content, parentCommentId);
    set((state) => {
      const comments = state.comments[postId] ?? [];
      const updatedComments = parentCommentId
        ? appendReply(comments, parentCommentId, comment)
        : [comment, ...comments];
      return {
        comments: { ...state.comments, [postId]: updatedComments },
        posts: state.posts.map((post) =>
          post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post
        ),
      };
    });
  },

  toggleCommentHeart: async (postId, commentId) => {
    const result = await commentService.toggleHeart(postId, commentId);
    set((state) => ({
      comments: {
        ...state.comments,
        [postId]: updateCommentReaction(
          state.comments[postId] ?? [],
          commentId,
          result.isHearted
        ),
      },
    }));
  },
}));
