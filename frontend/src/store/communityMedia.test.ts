import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { communityService } from '../services';
import { setApiSessionAuthenticated } from '../services/apiClient';
import type { Community, User } from '../types';
import { canEditCommunityMedia } from '../utils/communityMedia';
import { useCommunityStore } from './useCommunityStore';

const community: Community = {
  id: '42', name: 'lap-trinh', displayName: 'Lập trình', description: 'Existing description',
  avatarUrl: '/old-avatar.jpg', bannerUrl: '/old-banner.jpg', category: 'Lập trình',
  visibility: 'PUBLIC', status: 'ACTIVE', memberCount: 12, currentUserRole: 'OWNER',
  ownerId: 'owner-id', ownerUsername: 'owner', createdAt: '2026-01-01', rules: [],
};
const user: User = {
  id: 'viewer-id', username: 'viewer', displayName: 'Viewer', email: '', avatarUrl: '', bannerUrl: '',
  bio: '', privacy: { showDateOfBirth: false, showLocation: false, showPostsOnProfile: false },
  role: 'USER', status: 'ACTIVE', createdAt: '', karma: 0,
};
const file = new File(['image'], 'crop.jpg', { type: 'image/jpeg' });
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); setApiSessionAuthenticated(false); });

describe('community media permissions', () => {
  it.each(['OWNER', 'MODERATOR', 'MEMBER', 'NONE'] as const)('uses confirmed community role %s', (role) => {
    expect(canEditCommunityMedia({ ...community, currentUserRole: role }, user, true))
      .toBe(role === 'OWNER' || role === 'MODERATOR');
  });
  it('recognizes the owner from detail data even when preview role is unavailable', () => {
    const detail = { ...community, currentUserRole: 'NONE' as const };
    expect(canEditCommunityMedia(detail, { ...user, id: community.ownerId }, true)).toBe(true);
    expect(canEditCommunityMedia(detail, { ...user, username: community.ownerUsername }, true)).toBe(true);
  });
  it('does not grant rights from a global admin role, blank identities, or an expired session', () => {
    expect(canEditCommunityMedia({ ...community, currentUserRole: 'NONE' }, { ...user, role: 'ADMIN' }, true)).toBe(false);
    expect(canEditCommunityMedia({ ...community, currentUserRole: 'NONE', ownerId: '', ownerUsername: '' }, { ...user, id: '', username: '' }, true)).toBe(false);
    expect(canEditCommunityMedia(community, user, false)).toBe(false);
    expect(canEditCommunityMedia(community, null, true)).toBe(false);
  });
});

describe('community media cache updates', () => {
  beforeEach(() => useCommunityStore.setState({ communities: [community], myCommunities: [community] }));
  it.each(['Avatar', 'Banner'] as const)('commits %s to both caches only after success without replacing role or other media', async (kind) => {
    const key = kind === 'Avatar' ? 'avatarUrl' : 'bannerUrl';
    let finish!: (value: Community) => void;
    vi.spyOn(communityService, `upload${kind}`).mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const uploading = useCommunityStore.getState()[`upload${kind}`](community.name, file);
    expect(useCommunityStore.getState().communities[0]).toEqual(community);
    finish({ ...community, [key]: '/new-media.jpg', currentUserRole: 'NONE', description: 'Not part of this change' });
    await uploading;
    for (const cache of ['communities', 'myCommunities'] as const) {
      expect(useCommunityStore.getState()[cache][0]).toEqual({ ...community, [key]: '/new-media.jpg' });
    }
  });
  it.each(['Avatar', 'Banner'] as const)('preserves both caches after a rejected %s upload', async (kind) => {
    vi.spyOn(communityService, `upload${kind}`).mockRejectedValue(new Error('Forbidden'));
    await expect(useCommunityStore.getState()[`upload${kind}`](community.name, file)).rejects.toThrow('Forbidden');
    expect(useCommunityStore.getState().communities).toEqual([community]);
    expect(useCommunityStore.getState().myCommunities).toEqual([community]);
  });
  it.each(['list', 'listByCategory', 'search', 'mine', 'getByName'] as const)('retains a successful upload when an older %s request finishes later', async (method) => {
    let finish!: () => void;
    if (method === 'getByName') {
      vi.spyOn(communityService, method).mockReturnValue(new Promise((resolve) => { finish = () => resolve(community); }));
    } else {
      vi.spyOn(communityService, method).mockReturnValue(new Promise((resolve) => { finish = () => resolve([community]); }));
    }
    vi.spyOn(communityService, 'uploadAvatar').mockResolvedValue({ ...community, avatarUrl: '/new-avatar.jpg' });
    vi.spyOn(communityService, 'uploadBanner').mockResolvedValue({ ...community, bannerUrl: '/new-banner.jpg' });
    const store = useCommunityStore.getState();
    const refreshing = method === 'list' ? store.hydrate() : method === 'listByCategory' ? store.hydrateByCategory('lap-trinh')
      : method === 'search' ? store.hydrateSearch('lap-trinh') : method === 'mine' ? store.hydrateMine() : store.hydrateCommunity(community.name);
    await store.uploadAvatar(community.name, file);
    await store.uploadBanner(community.name, file);
    finish();
    await refreshing;
    expect(useCommunityStore.getState().communities[0]).toMatchObject({ avatarUrl: '/new-avatar.jpg', bannerUrl: '/new-banner.jpg' });
  });
});

describe('community multipart API contract', () => {
  it.each(['Avatar', 'Banner'] as const)('uploads %s by encoded name with cookies and browser-generated boundary', async (kind) => {
    const fetch = vi.fn().mockResolvedValue(response(community));
    vi.stubGlobal('fetch', fetch);
    const result = await communityService[`upload${kind}`]('lập trình', file);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`http://localhost:8080/communities/l%E1%BA%ADp%20tr%C3%ACnh/${kind.toLowerCase()}`);
    expect(init).toMatchObject({ method: 'PUT', credentials: 'include' });
    expect(init.headers).toBeUndefined();
    expect(init.body).toBeInstanceOf(FormData);
    expect([...init.body.keys()]).toEqual(['file']);
    expect(init.body.get('file').name).toBe('crop.jpg');
    expect(result).toMatchObject({ id: '42', avatarUrl: community.avatarUrl, bannerUrl: community.bannerUrl });
  });
  it('refreshes an expired access cookie and retries the same multipart body', async () => {
    setApiSessionAuthenticated(true);
    const fetch = vi.fn().mockResolvedValueOnce(response({ code: 'ACCESS_TOKEN_EXPIRED' }, 401))
      .mockResolvedValueOnce(response({})).mockResolvedValueOnce(response(community));
    vi.stubGlobal('fetch', fetch);
    await communityService.uploadBanner(community.name, file);
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      'http://localhost:8080/communities/lap-trinh/banner', 'http://localhost:8080/auth/refresh',
      'http://localhost:8080/communities/lap-trinh/banner',
    ]);
    expect(fetch.mock.calls[0][1].body).toBe(fetch.mock.calls[2][1].body);
    expect(fetch.mock.calls.every(([, init]) => init.credentials === 'include')).toBe(true);
  });
  it.each([401, 403, 413, 422, 500])('propagates HTTP %s without committing a new image', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ message: 'Upload rejected' }, status)));
    await expect(communityService.uploadAvatar(community.name, file)).rejects.toMatchObject({ status });
  });
  it('reports network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(communityService.uploadBanner(community.name, file)).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });
});
