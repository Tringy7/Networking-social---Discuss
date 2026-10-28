// Runtime validation coverage for demo content and local-only interactions.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { demoComments, demoNotifications, demoPosts } from '../mocks/demoContent';
import { messageService, userService } from '../services';
import { useNotificationStore } from './useNotificationStore';
import { usePostStore } from './usePostStore';

describe('demo posts', () => {
  beforeEach(() => {
    usePostStore.setState({
      posts: demoPosts.map((post) => ({ ...post })),
      savedPosts: demoPosts.filter((post) => post.isSaved).map((post) => ({ ...post })),
      comments: { 'demo-post-react-query': demoComments },
    });
  });

  it('hydrates the feed with demo posts without a posts API', async () => {
    await usePostStore.getState().hydrate();

    expect(usePostStore.getState().posts.map((post) => post.id)).toContain('demo-post-react-query');
  });

  it('updates likes and saved posts locally', async () => {
    await usePostStore.getState().toggleHeart('demo-post-react-query');
    await usePostStore.getState().toggleSave('demo-post-react-query');

    const state = usePostStore.getState();
    expect(state.posts.find((post) => post.id === 'demo-post-react-query')).toMatchObject({
      isHearted: true,
      isSaved: false,
    });
    expect(state.savedPosts.some((post) => post.id === 'demo-post-react-query')).toBe(false);
  });

  it('creates posts and comments locally when the posts API is unavailable', async () => {
    const post = await usePostStore.getState().addPost({
      communityName: 'lap-trinh-viet-nam',
      communityDisplayName: 'Lập trình Việt Nam',
      communityAvatar: '',
      author: {
        id: 'demo-current-user',
        username: 'ban',
        displayName: 'Bạn',
        avatarUrl: '',
      },
      title: 'Bài viết mẫu mới',
      content: 'Nội dung bài viết mẫu.',
    });

    await usePostStore.getState().addComment(post.id, 'Bình luận mẫu.');

    expect(usePostStore.getState().posts[0]).toMatchObject({
      id: post.id,
      title: 'Bài viết mẫu mới',
      commentCount: 1,
    });
    expect(usePostStore.getState().comments[post.id][0].content).toBe('Bình luận mẫu.');
  });
});

describe('demo notifications', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      notifications: demoNotifications.map((notification) => ({ ...notification })),
    });
  });

  it('marks demo notifications as read locally', async () => {
    await useNotificationStore.getState().markRead('demo-notification-reply');

    expect(
      useNotificationStore.getState().notifications.find(
        (notification) => notification.id === 'demo-notification-reply'
      )?.isRead
    ).toBe(true);
  });

  it('updates notification preferences locally', () => {
    useNotificationStore.getState().updatePreferences({ emailDigest: true });

    expect(useNotificationStore.getState().preferences.emailDigest).toBe(true);
  });
});

describe('demo conversations', () => {
  it('loads mock conversations and sends a message locally', async () => {
    const conversations = await messageService.list();
    const conversation = conversations[0];
    const sentMessage = await messageService.send(conversation.id, 'Tin nhắn kiểm tra.');
    const updatedConversation = await messageService.get(conversation.id);

    expect(updatedConversation.messages[updatedConversation.messages.length - 1]).toMatchObject({
      id: sentMessage.id,
      text: 'Tin nhắn kiểm tra.',
      isMe: true,
    });
    expect(updatedConversation.lastMessage).toBe('Tin nhắn kiểm tra.');
  });
});

describe('user profile API paths', () => {
  it('loads public profiles from the UserController route and maps its DTO', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        userId: 42,
        username: 'linhnguyen',
        joinedAt: '2025-01-02T03:04:05',
        profile: {
          displayName: 'Linh Nguyễn',
          bio: 'Xin chào',
          avatar: 'https://example.test/avatar.png',
          banner: 'https://example.test/banner.png',
          dateOfBirth: null,
          gender: 'FEMALE',
          location: 'Hà Nội',
        },
        statistics: { postCount: 2, commentCount: 3, communityCount: 1 },
      }), { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);

    try {
      const profile = await userService.getPublicProfile('linhnguyen');

      expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/user/linhnguyen');
      expect(profile).toMatchObject({
        id: '42',
        username: 'linhnguyen',
        displayName: 'Linh Nguyễn',
        bio: 'Xin chào',
        avatarUrl: 'https://example.test/avatar.png',
        location: 'Hà Nội',
        karma: 2,
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
