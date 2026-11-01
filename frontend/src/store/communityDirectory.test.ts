import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { communityService } from '../services';
import { useCommunityStore } from './useCommunityStore';
import type { Community } from '../types';

const community = (id: string, role: Community['currentUserRole']): Community => ({
  id, name: id, displayName: id, description: '', avatarUrl: '', bannerUrl: '',
  category: 'Lập trình', visibility: 'PUBLIC', status: 'ACTIVE', memberCount: 1,
  currentUserRole: role, ownerId: '', ownerUsername: '', createdAt: '2026-01-01', rules: [],
});

describe('personal community directory', () => {
  beforeEach(() => useCommunityStore.setState({ communities: [], myCommunities: [] }));
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('keeps owned/joined API results when Explore replaces its search results', async () => {
    vi.spyOn(communityService, 'mine').mockResolvedValue([community('owned', 'OWNER'), community('joined', 'MEMBER')]);
    vi.spyOn(communityService, 'search').mockResolvedValue([community('unrelated', 'NONE')]);
    await useCommunityStore.getState().hydrateMine();
    await useCommunityStore.getState().hydrateSearch('unrelated');
    expect(useCommunityStore.getState().communities.map((c) => c.id)).toEqual(['unrelated']);
    expect(useCommunityStore.getState().myCommunities.map((c) => c.id)).toEqual(['owned', 'joined']);
  });

  it('counts overlapping owned/joined entries once and retains the owner role', async () => {
    vi.spyOn(communityService, 'mine').mockResolvedValue([community('same', 'OWNER'), community('same', 'MEMBER')]);
    await useCommunityStore.getState().hydrateMine();
    expect(useCommunityStore.getState().myCommunities).toHaveLength(1);
    expect(useCommunityStore.getState().myCommunities[0].currentUserRole).toBe('OWNER');
  });

  it('retains membership if leaving fails', async () => {
    useCommunityStore.setState({ myCommunities: [community('joined', 'MEMBER')] });
    vi.spyOn(communityService, 'leave').mockRejectedValue(new Error('Không thể rời nhóm'));
    await expect(useCommunityStore.getState().leaveCommunity('joined')).rejects.toThrow();
    expect(useCommunityStore.getState().myCommunities).toHaveLength(1);
  });

  it('preserves the API moderator role, pagination and identifier fallback', async () => {
    const fetchMock = vi.fn(async (input: unknown) => {
      const path = String(input);
      const page = path.includes('/user/me/owned') ? { content: [], totalPages: 1 }
        : path.includes('page=1') ? { content: [community('second-page', 'MEMBER')], totalPages: 2 }
        : { content: [{ ...community('raw-name', 'MODERATOR'), displayName: '  ' }], totalPages: 2 };
      return new Response(JSON.stringify(page), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const results = await communityService.mine();
    expect(results[0]).toMatchObject({ displayName: 'raw-name', currentUserRole: 'MODERATOR' });
    expect(results).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8080/user/me/joined?page=1&size=100', expect.objectContaining({ method: 'GET' }));
  });
});
