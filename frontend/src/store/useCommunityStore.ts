import { create } from 'zustand';
import { Community, CommunityMember, CommunityCategory } from '../types';
import { communityService } from '../services';

interface CommunityInput {
  name: string;
  displayName: string;
  description: string;
  category: CommunityCategory;
  visibility: 'PUBLIC' | 'PRIVATE';
  avatarUrl?: string;
  bannerUrl?: string;
}

interface CommunityState {
  communities: Community[];
  members: Record<string, CommunityMember[]>;
  hydrate: () => Promise<void>;
  hydrateMine: () => Promise<void>;
  hydrateMembers: (communityName: string) => Promise<void>;
  joinCommunity: (communityName: string) => Promise<void>;
  leaveCommunity: (communityName: string) => Promise<void>;
  createCommunity: (data: CommunityInput) => Promise<Community>;
  updateCommunity: (communityName: string, data: Partial<Community>) => Promise<void>;
  banCommunity: (communityName: string) => Promise<void>;
  unbanCommunity: (communityName: string) => Promise<void>;
  updateMemberRole: (
    communityName: string,
    memberId: string,
    role: 'OWNER' | 'MODERATOR' | 'MEMBER'
  ) => Promise<void>;
  banMember: (communityName: string, memberId: string) => Promise<void>;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  communities: [],
  members: {},

  hydrate: async () => {
    const communities = await communityService.list();
    set({ communities });
  },

  hydrateMine: async () => {
    const mine = await communityService.mine();
    set((state) => ({
      communities: [
        ...mine,
        ...state.communities.filter((community) => !mine.some((item) => item.id === community.id)),
      ],
    }));
  },

  hydrateMembers: async (communityName) => {
    const members = await communityService.members(communityName);
    set((state) => ({ members: { ...state.members, [communityName]: members } }));
  },

  joinCommunity: async (communityName) => {
    await communityService.join(communityName);
    await get().hydrate();
  },

  leaveCommunity: async (communityName) => {
    await communityService.leave(communityName);
    await get().hydrate();
  },

  createCommunity: async (data) => {
    const created = await communityService.create({
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      category: data.category,
      visibility: data.visibility,
      avatarUrl: data.avatarUrl,
      bannerUrl: data.bannerUrl,
    });
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

  banCommunity: async (communityName) => {
    await communityService.setStatus(communityName, 'BANNED');
    await get().hydrate();
  },

  unbanCommunity: async (communityName) => {
    await communityService.setStatus(communityName, 'ACTIVE');
    await get().hydrate();
  },

  updateMemberRole: async (communityName, memberId, role) => {
    await communityService.updateMemberRole(communityName, memberId, role);
    await get().hydrateMembers(communityName);
  },

  banMember: async (communityName, memberId) => {
    await communityService.setMemberStatus(communityName, memberId, 'BANNED');
    await get().hydrateMembers(communityName);
  },
}));
