import { create } from 'zustand';
import { Post, Comment } from '../types';
import { POSTS_AVAILABLE, commentService, postService } from '../services';
import { demoComments, demoPosts } from '../mocks/demoContent';

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
    communityDisplayName: string;
    communityAvatar: string;
    author: Post['author'];
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

function findComment(comments: Comment[], commentId: string): Comment | undefined {
  for (const comment of comments) {
    if (comment.id === commentId) return comment;
    const reply = comment.replies ? findComment(comment.replies, commentId) : undefined;
    if (reply) return reply;
  }
  return undefined;
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: POSTS_AVAILABLE ? [] : demoPosts.map((post) => ({ ...post })),
  savedPosts: POSTS_AVAILABLE
    ? []
    : demoPosts.filter((post) => post.isSaved).map((post) => ({ ...post })),
  comments: POSTS_AVAILABLE ? {} : { 'demo-post-react-query': demoComments },
  isCreateModalOpen: false,
  targetCommunityName: undefined,

  hydrate: async (tab = 'for-you') => {
    if (POSTS_AVAILABLE) set({ posts: await postService.list(tab) });
  },

  hydrateSaved: async () => {
    if (POSTS_AVAILABLE) {
      set({ savedPosts: await postService.listSaved() });
      return;
    }
    set({ savedPosts: get().posts.filter((post) => post.isSaved) });
  },

  loadPost: async (postId) => {
    const existing = get().posts.find((post) => post.id === postId);
    if (existing) return existing;
    const post = POSTS_AVAILABLE
      ? await postService.getById(postId)
      : demoPosts.find((item) => item.id === postId);
    if (!post) throw new Error('Không tìm thấy bài viết.');
    set((state) => ({ posts: [post, ...state.posts] }));
    return post;
  },

  loadComments: async (postId) => {
    if (!POSTS_AVAILABLE && get().comments[postId]) return;
    const comments = POSTS_AVAILABLE
      ? await commentService.list(postId)
      : postId === 'demo-post-react-query' ? demoComments : [];
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
    const result = POSTS_AVAILABLE
      ? await postService.toggleHeart(postId, post.isHearted)
      : { isHearted: !post.isHearted };
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
    const post = get().posts.find((item) => item.id === postId)
      ?? get().savedPosts.find((item) => item.id === postId);
    if (!post) throw new Error('Không tìm thấy bài viết.');
    const result = POSTS_AVAILABLE
      ? await postService.toggleSave(postId)
      : { isSaved: !post.isSaved };
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
    const post: Post = POSTS_AVAILABLE
      ? await postService.create({
          communityName: postData.communityName,
          title: postData.title,
          content: postData.content,
          tags: postData.tags,
          mediaUrl: postData.mediaUrl,
          mediaType: postData.mediaType,
          codeSnippet: postData.codeSnippet,
        })
      : {
          ...postData,
          id: `demo-post-${Date.now()}`,
          heartCount: 0,
          commentCount: 0,
          isHearted: false,
          isSaved: false,
          createdAt: new Date().toISOString(),
        };
    set((state) => ({ posts: [post, ...state.posts] }));
    return post;
  },

  deletePost: async (postId) => {
    if (POSTS_AVAILABLE) await postService.delete(postId);
    set((state) => ({
      posts: state.posts.filter((post) => post.id !== postId),
      savedPosts: state.savedPosts.filter((post) => post.id !== postId),
      comments: Object.fromEntries(
        Object.entries(state.comments).filter(([id]) => id !== postId)
      ),
    }));
  },

  addComment: async (postId, content, parentCommentId) => {
    const comment = POSTS_AVAILABLE
      ? await commentService.create(postId, content, parentCommentId)
      : {
          id: `demo-comment-${Date.now()}`,
          postId,
          author: {
            id: 'demo-current-user',
            username: 'ban',
            displayName: 'Bạn',
            avatarUrl: '',
          },
          content,
          parentCommentId: parentCommentId ?? null,
          heartCount: 0,
          isHearted: false,
          createdAt: new Date().toISOString(),
        };
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
    const existing = findComment(get().comments[postId] ?? [], commentId);
    if (!existing) throw new Error('Không tìm thấy bình luận.');
    const result = POSTS_AVAILABLE
      ? await commentService.toggleHeart(postId, commentId)
      : { isHearted: !existing.isHearted };
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
