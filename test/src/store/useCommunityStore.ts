import { create } from 'zustand';
import { Community, CommunityMember, CommunityCategory } from '../types';
import { MOCK_COMMUNITIES, MOCK_MEMBERS } from '../mocks/mockData';

interface CommunityState {
  communities: Community[];
  members: Record<string, CommunityMember[]>;
  joinCommunity: (communityName: string) => void;
  leaveCommunity: (communityName: string) => void;
  createCommunity: (data: {
    name: string;
    displayName: string;
    description: string;
    category: CommunityCategory;
    visibility: 'PUBLIC' | 'PRIVATE';
    avatarUrl?: string;
    bannerUrl?: string;
  }) => Community;
  updateCommunity: (communityName: string, data: Partial<Community>) => void;
  banCommunity: (communityName: string) => void;
  unbanCommunity: (communityName: string) => void;
  updateMemberRole: (communityName: string, memberId: string, role: 'OWNER' | 'MODERATOR' | 'MEMBER') => void;
  banMember: (communityName: string, memberId: string) => void;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  communities: MOCK_COMMUNITIES,
  members: {
    'lap-trinh-viet-nam': MOCK_MEMBERS,
  },

  joinCommunity: (communityName) => {
    set((state) => ({
      communities: state.communities.map((c) =>
        c.name === communityName
          ? { ...c, memberCount: c.memberCount + 1, currentUserRole: 'MEMBER' as const }
          : c
      ),
    }));
  },

  leaveCommunity: (communityName) => {
    set((state) => ({
      communities: state.communities.map((c) =>
        c.name === communityName
          ? { ...c, memberCount: Math.max(0, c.memberCount - 1), currentUserRole: 'NONE' as const }
          : c
      ),
    }));
  },

  createCommunity: (data) => {
    const newCommunity: Community = {
      id: `comm_${Date.now()}`,
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      category: data.category,
      visibility: data.visibility,
      avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&auto=format&fit=crop&q=80',
      bannerUrl: data.bannerUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
      status: 'ACTIVE',
      memberCount: 1,
      currentUserRole: 'OWNER',
      ownerId: 'usr_me_01',
      ownerUsername: 'huutri_dev',
      createdAt: new Date().toISOString(),
      rules: [
        { id: 'r1', title: 'Tôn trọng thành viên', description: 'Giao tiếp hòa nhã, lịch sự.' },
        { id: 'r2', title: 'Nội dung đúng chủ đề', description: 'Đăng bài phù hợp với định hướng cộng đồng.' }
      ],
    };

    set((state) => ({ communities: [newCommunity, ...state.communities] }));
    return newCommunity;
  },

  updateCommunity: (communityName, data) => {
    set((state) => ({
      communities: state.communities.map((c) =>
        c.name === communityName ? { ...c, ...data } : c
      ),
    }));
  },

  banCommunity: (communityName) => {
    set((state) => ({
      communities: state.communities.map((c) =>
        c.name === communityName ? { ...c, status: 'BANNED' as const } : c
      ),
    }));
  },

  unbanCommunity: (communityName) => {
    set((state) => ({
      communities: state.communities.map((c) =>
        c.name === communityName ? { ...c, status: 'ACTIVE' as const } : c
      ),
    }));
  },

  updateMemberRole: (communityName, memberId, role) => {
    const currentList = get().members[communityName] || MOCK_MEMBERS;
    set((state) => ({
      members: {
        ...state.members,
        [communityName]: currentList.map((m) =>
          m.id === memberId ? { ...m, role } : m
        ),
      },
    }));
  },

  banMember: (communityName, memberId) => {
    const currentList = get().members[communityName] || MOCK_MEMBERS;
    set((state) => ({
      members: {
        ...state.members,
        [communityName]: currentList.map((m) =>
          m.id === memberId ? { ...m, status: 'BANNED' as const } : m
        ),
      },
    }));
  },
}));
