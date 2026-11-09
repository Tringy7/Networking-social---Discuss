import type { Community, User } from '../types';

/** Visibility only. The upload endpoint must enforce community authorization. */
export function canEditCommunityMedia(community: Community, user: User | null, authenticated: boolean): boolean {
  if (!authenticated || !user) return false;
  const ownsCommunity = Boolean((community.ownerId && community.ownerId === user.id)
    || (community.ownerUsername && community.ownerUsername === user.username));
  return ownsCommunity || community.currentUserRole === 'OWNER' || community.currentUserRole === 'MODERATOR';
}
