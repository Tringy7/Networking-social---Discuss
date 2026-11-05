import { create } from 'zustand';
import type { Post, PostInput, Comment } from '../types';
import { postService, commentService, type CommentMutationResponse } from '../services';
import { useAuthStore } from './useAuthStore';

interface PostState {
  posts: Post[];
  feedIds: string[];
  feedTab: string;
  feedPage: number;
  hasMore: boolean;
  loading: boolean;
  savedPosts: Post[];
  comments: Record<string, Comment[]>;
  hydrate: (tab?: string) => Promise<void>;
  loadMore: () => Promise<void>;
  loadCommunityPosts: (name: string, page?: number) => Promise<boolean>;
  loadUserPosts: (username: string, page?: number) => Promise<boolean>;
  hydrateSaved: (page?: number) => Promise<boolean>;
  loadPost: (id: string) => Promise<Post>;
  loadComments: (id: string) => Promise<void>;
  vote: (id: string, type: 'UP' | 'DOWN' | null) => Promise<void>;
  toggleSave: (id: string) => Promise<void>;
  addPost: (input: PostInput) => Promise<Post>;
  editPost: (id: string, input: PostInput) => Promise<Post>;
  deletePost: (id: string) => Promise<void>;
  addComment: (id: string, content: string, parent?: string, files?: File[]) => Promise<void>;
  editComment: (postId: string, commentId: string, content: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  toggleCommentHeart: (postId: string, commentId: string) => Promise<void>;
  isCreateModalOpen: boolean;
  targetCommunityName?: string;
  editingPost?: Post;
  openCreateModal: (name?: string) => void;
  openEditModal: (post: Post) => void;
  closeCreateModal: () => void;
  reset: () => void;
}
const unsupported = async () => { throw new Error('Chức năng này chưa có API hỗ trợ.'); };
const merge = (existing: Post[], incoming: Post[]) =>
  [...existing.filter((post) => !incoming.some((item) => item.id === post.id)), ...incoming];

const commentTree = (rows: CommentMutationResponse[]): Comment[] => {
  const nodes = new Map(rows.map(row => [String(row.id), {
    id: String(row.id), postId: String(row.postId), content: row.content, status: row.status,
    parentCommentId: row.parentId == null ? null : String(row.parentId),
    author: { ...row.author, id: String(row.author.id),
      displayName: row.author.displayName || row.author.username, avatarUrl: row.author.avatarUrl || '' },
    createdAt: row.createdAt, heartCount: 0, replies: [],
    attachments: (row.attachments || []).map(file => ({ ...file, id: String(file.id) })),
  } as Comment]));
  const roots: Comment[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentCommentId && nodes.get(node.parentCommentId);
    if (parent) parent.replies!.push(node); else roots.push(node);
  }
  return roots;
};

let feedRequest = 0;
let session = 0;
let savedRequest = 0;
const saving = new Set<string>();
export const usePostStore = create<PostState>((set, get) => ({
  posts: [], feedIds: [], feedTab: 'for-you', feedPage: 0, hasMore: false, loading: false,
  savedPosts: [], comments: {}, isCreateModalOpen: false,
  reset: () => { session++; feedRequest++; savedRequest++; saving.clear(); set({ posts: [], feedIds: [], savedPosts: [], comments: {},
    hasMore: false, loading: false, isCreateModalOpen: false, editingPost: undefined }); },
  hydrate: async (tab = 'for-you') => {
    const request = ++feedRequest;
    set({ loading: true, feedTab: tab });
    try {
      const page = await postService.list(tab, 0);
      if (request === feedRequest) set((state) => ({ posts: merge(state.posts, page.content), feedIds: page.content.map((post) => post.id),
        feedPage: 0, hasMore: !page.last }));
    } finally { if (request === feedRequest) set({ loading: false }); }
  },
  loadMore: async () => {
    if (get().loading || !get().hasMore) return;
    const request = feedRequest;
    const { feedPage, feedTab } = get();
    set({ loading: true });
    try {
      const page = await postService.list(feedTab, feedPage + 1);
      if (request === feedRequest) set((state) => ({ posts: merge(state.posts, page.content),
        feedIds: [...new Set([...state.feedIds, ...page.content.map((post) => post.id)])], feedPage: page.page, hasMore: !page.last }));
    } finally { if (request === feedRequest) set({ loading: false }); }
  },
  loadCommunityPosts: async (name, number = 0) => {
    const generation = session;
    const page = await postService.listCommunity(name, number);
    if (generation === session) set((state) => ({ posts: merge(number === 0 ? state.posts.filter((post) => post.communityName !== name) : state.posts, page.content) }));
    return !page.last;
  },
  loadUserPosts: async (username, number = 0) => {
    const generation = session;
    const page = await postService.listUser(username, number);
    if (generation === session) set((state) => ({ posts: merge(number === 0 ? state.posts.filter((post) => post.author.username !== username) : state.posts, page.content) }));
    return !page.last;
  },
  loadPost: async (id) => {
    const generation = session;
    const post = await postService.getById(id);
    if (generation === session) set((state) => ({ posts: merge(state.posts, [post]) }));
    return post;
  },
  addPost: async (input) => {
    const generation = session;
    const post = await postService.create(input);
    if (generation === session) set((state) => ({ posts: merge(state.posts, [post]), feedIds: [post.id, ...state.feedIds.filter((id) => id !== post.id)] }));
    return post;
  },
  editPost: async (id, input) => {
    const generation = session;
    const post = await postService.update(id, input);
    if (generation === session) set((state) => ({ posts: merge(state.posts, [post]), savedPosts: state.savedPosts.map((item) => item.id === id ? post : item) }));
    return post;
  },
  deletePost: async (id) => {
    const generation = session;
    await postService.delete(id);
    if (generation === session) set((state) => ({ posts: state.posts.filter((post) => post.id !== id), savedPosts: state.savedPosts.filter((post) => post.id !== id), feedIds: state.feedIds.filter((item) => item !== id) }));
  },
  hydrateSaved: async (number = 0) => {
    const generation = session;
    const request = ++savedRequest;
    const page = await postService.saved(number);
    if (generation === session && request === savedRequest) set((state) => ({
      savedPosts: number === 0 ? page.content : [...state.savedPosts, ...page.content.filter((post) => !state.savedPosts.some((item) => item.id === post.id))],
      posts: merge(state.posts, page.content),
    }));
    return !page.last;
  },
  loadComments: async (id) => {
    const generation = session;
    const rows = await commentService.list(id);
    if (generation === session) set(state => ({ comments: { ...state.comments, [id]: commentTree(rows) } }));
  },
  vote: async (id, type) => {
    const generation = session;
    const post = await postService.vote(id, type);
    if (generation === session) set((state) => ({
      posts: merge(state.posts, [post]),
      savedPosts: state.savedPosts.map((item) => item.id === id ? post : item),
    }));
  },
  toggleSave: async (id) => {
    if (saving.has(id)) return;
    const generation = session;
    const current = get().posts.find((post) => post.id === id) || get().savedPosts.find((post) => post.id === id);
    if (!current) throw new Error('Không tìm thấy bài viết.');
    saving.add(id);
    try {
      const post = await postService.save(id, !current.isSaved);
      if (generation === session) {
        savedRequest++;
        set((state) => ({ posts: merge(state.posts, [post]),
          savedPosts: post.isSaved ? [post, ...state.savedPosts.filter((item) => item.id !== id)] : state.savedPosts.filter((item) => item.id !== id) }));
      }
    } finally { if (generation === session) saving.delete(id); }
  },
  addComment: async (id, content, parent, files) => {
    const generation = session;
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('Vui lòng đăng nhập.');
    await commentService.create(id, content, parent, files);
    if (generation === session) {
      await get().loadComments(id);
      await get().loadPost(id);
    }
  },
  editComment: async (postId, commentId, content) => {
    const generation = session;
    await commentService.update(commentId, content);
    if (generation === session) await get().loadComments(postId);
  },
  deleteComment: async (postId, commentId) => {
    const generation = session;
    await commentService.delete(commentId);
    if (generation === session) {
      await get().loadComments(postId);
      await get().loadPost(postId);
    }
  },
  toggleCommentHeart: unsupported,
  openCreateModal: (name) => set({ isCreateModalOpen: true, targetCommunityName: name, editingPost: undefined }),
  openEditModal: (post) => set({ isCreateModalOpen: true, targetCommunityName: post.communityName, editingPost: post }),
  closeCreateModal: () => set({ isCreateModalOpen: false, targetCommunityName: undefined, editingPost: undefined }),
}));
