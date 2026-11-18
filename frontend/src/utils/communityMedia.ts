import type { Community, User } from '../types';

export function isCommunityOwner(community: Community, user: User | null, authenticated: boolean): boolean {
  if (!authenticated || !user) return false;
  return community.currentUserRole === 'OWNER' || Boolean((community.ownerId && community.ownerId === user.id)
    || (community.ownerUsername && community.ownerUsername === user.username));
}

/** Visibility only. The upload endpoint must enforce community authorization. */
export function canEditCommunityMedia(community: Community, user: User | null, authenticated: boolean): boolean {
  return isCommunityOwner(community, user, authenticated)
    || Boolean(authenticated && user && community.currentUserRole === 'MODERATOR');
}
