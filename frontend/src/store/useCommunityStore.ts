import { create } from 'zustand';
import { Community, CommunityMember } from '../types';
import { communityService } from '../services';

interface CommunityInput {
  name: string;
  description: string;
  categoryId: number;
  visibility: 'PUBLIC' | 'PRIVATE';
  avatarFile?: File;
  bannerFile?: File;
}

interface CommunityState {
  communities: Community[];
  members: Record<string, CommunityMember[]>;
  hydrate: () => Promise<void>;
  hydrateByCategory: (slug: string) => Promise<void>;
  hydrateCommunity: (communityName: string) => Promise<void>;
  hydrateMine: () => Promise<void>;
  hydrateMembers: (communityName: string) => Promise<void>;
  joinCommunity: (communityName: string) => Promise<void>;
  leaveCommunity: (communityName: string) => Promise<void>;
  uploadAvatar: (communityName: string, file: File) => Promise<void>;
  uploadBanner: (communityName: string, file: File) => Promise<void>;
  createCommunity: (data: CommunityInput) => Promise<Community>;
  updateCommunity: (communityName: string, data: Partial<Community>) => Promise<void>;
  banCommunity: (communityName: string) => Promise<void>;
  unbanCommunity: (communityName: string) => Promise<void>;
  updateMemberRole: (
    communityName: string,
    username: string,
    role: 'OWNER' | 'MODERATOR' | 'MEMBER'
  ) => Promise<void>;
  kickMember: (communityName: string, username: string) => Promise<void>;
  transferOwnership: (communityName: string, username: string) => Promise<void>;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  communities: [],
  members: {},

  hydrate: async () => {
    const communities = await communityService.list();
    set((state) => ({
      communities: communities.map((community) => {
        const existing = state.communities.find((item) => item.id === community.id);
        return existing && existing.currentUserRole !== 'NONE'
          ? { ...community, currentUserRole: existing.currentUserRole }
          : community;
      }),
    }));
  },

  hydrateByCategory: async (slug) => {
    const communities = await communityService.listByCategory(slug);
    set((state) => ({
      communities: communities.map((community) => {
        const existing = state.communities.find((item) => item.id === community.id);
        return existing && existing.currentUserRole !== 'NONE'
          ? { ...community, currentUserRole: existing.currentUserRole }
          : community;
      }),
    }));
  },

  hydrateCommunity: async (communityName) => {
    const community = await communityService.getByName(communityName);
    if (!community) return;
    set((state) => {
      const existing = state.communities.find((item) => item.name === communityName);
      const hydrated = existing && existing.currentUserRole !== 'NONE'
        ? { ...community, currentUserRole: existing.currentUserRole }
        : community;
      return {
        communities: [hydrated, ...state.communities.filter((item) => item.name !== communityName)],
      };
    });
  },

  hydrateMine: async () => {
    const mine = await communityService.mine();
    set((state) => {
      const mineById = new Map(mine.map((community) => [community.id, community]));
      const others = state.communities
        .filter((community) => !mineById.has(community.id))
        .map((community) => ({ ...community, currentUserRole: 'NONE' as const }));
      return { communities: [...mineById.values(), ...others] };
    });
  },

  hydrateMembers: async (communityName) => {
    const members = await communityService.members(communityName);
    set((state) => ({ members: { ...state.members, [communityName]: members } }));
  },

  joinCommunity: async (communityName) => {
    await communityService.join(communityName);
    set((state) => ({
      communities: state.communities.map((community) => community.name === communityName
        ? {
            ...community,
            currentUserRole: 'MEMBER',
            memberCount: community.memberCount + 1,
          }
        : community),
    }));
    void Promise.all([get().hydrate(), get().hydrateMine()]).catch(() => undefined);
  },

  leaveCommunity: async (communityName) => {
    await communityService.leave(communityName);
    set((state) => ({
      communities: state.communities.map((community) => community.name === communityName
        ? {
            ...community,
            currentUserRole: 'NONE',
            memberCount: Math.max(0, community.memberCount - 1),
          }
        : community),
    }));
    void Promise.all([get().hydrate(), get().hydrateMine()]).catch(() => undefined);
  },

  uploadAvatar: async (communityName, file) => {
    const updated = await communityService.uploadAvatar(communityName, file);
    set((state) => ({
      communities: state.communities.map((item) => item.name === communityName ? {
        ...item,
        avatarUrl: updated.avatarUrl,
      } : item),
    }));
  },

  uploadBanner: async (communityName, file) => {
    const updated = await communityService.uploadBanner(communityName, file);
    set((state) => ({
      communities: state.communities.map((item) => item.name === communityName ? {
        ...item,
        bannerUrl: updated.bannerUrl,
      } : item),
    }));
  },

  createCommunity: async (data) => {
    const created = await communityService.create({
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      visibility: data.visibility,
    });
    if (data.avatarFile) await communityService.uploadAvatar(created.name, data.avatarFile);
    if (data.bannerFile) await communityService.uploadBanner(created.name, data.bannerFile);
    set((state) => ({
      communities: [created, ...state.communities.filter((item) => item.id !== created.id)],
    }));
    return created;
  },

  updateCommunity: async (communityName, data) => {
    const updated = await communityService.update(communityName, data);
    set((state) => ({
      communities: state.communities.map((community) =>
        community.name === communityName ? updated : community
      ),
    }));
  },

  updateMemberRole: async (communityName, memberId, role) => {
    if (role === 'MODERATOR') await communityService.appointModerator(communityName, memberId);
    else if (role === 'MEMBER') await communityService.removeModerator(communityName, memberId);
    await get().hydrateMembers(communityName);
  },

  kickMember: async (communityName, username) => {
    await communityService.kickMember(communityName, username);
    await get().hydrateMembers(communityName);
  },

  transferOwnership: async (communityName, username) => {
    await communityService.transferOwnership(communityName, username);
    await Promise.all([get().hydrateMembers(communityName), get().hydrateCommunity(communityName)]);
  },

  banCommunity: async () => {
    throw new Error('API khóa cộng đồng chưa được khai báo trong backend.');
  },

  unbanCommunity: async () => {
    throw new Error('API mở khóa cộng đồng chưa được khai báo trong backend.');
  },

}));
