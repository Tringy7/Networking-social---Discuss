import { create } from 'zustand';
import type { Post, PostInput, Comment } from '../types';
import { postService } from '../services';

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
  hydrateSaved: () => Promise<void>;
  loadPost: (id: string) => Promise<Post>;
  loadComments: (id: string) => Promise<void>;
  vote: (id: string, type: 'UP' | 'DOWN' | null) => Promise<void>;
  toggleSave: (id: string) => Promise<void>;
  addPost: (input: PostInput) => Promise<Post>;
  editPost: (id: string, input: PostInput) => Promise<Post>;
  deletePost: (id: string) => Promise<void>;
  addComment: (id: string, content: string, parent?: string) => Promise<void>;
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

let feedRequest = 0;
let session = 0;
export const usePostStore = create<PostState>((set, get) => ({
  posts: [], feedIds: [], feedTab: 'for-you', feedPage: 0, hasMore: false, loading: false,
  savedPosts: [], comments: {}, isCreateModalOpen: false,
  reset: () => { session++; feedRequest++; set({ posts: [], feedIds: [], savedPosts: [], comments: {},
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
    if (generation === session) set((state) => ({ posts: merge(state.posts, [post]) }));
    return post;
  },
  deletePost: async (id) => {
    const generation = session;
    await postService.delete(id);
    if (generation === session) set((state) => ({ posts: state.posts.filter((post) => post.id !== id), feedIds: state.feedIds.filter((item) => item !== id) }));
  },
  hydrateSaved: async () => { set({ savedPosts: [] }); },
  loadComments: async () => { /* Comment API has not been implemented; never synthesize demo comments. */ },
  vote: async (id, type) => {
    const generation = session;
    const post = await postService.vote(id, type);
    if (generation === session) set((state) => ({
      posts: merge(state.posts, [post]),
      savedPosts: state.savedPosts.map((item) => item.id === id ? post : item),
    }));
  },
  toggleSave: unsupported, addComment: unsupported, toggleCommentHeart: unsupported,
  openCreateModal: (name) => set({ isCreateModalOpen: true, targetCommunityName: name, editingPost: undefined }),
  openEditModal: (post) => set({ isCreateModalOpen: true, targetCommunityName: post.communityName, editingPost: post }),
  closeCreateModal: () => set({ isCreateModalOpen: false, targetCommunityName: undefined, editingPost: undefined }),
}));
