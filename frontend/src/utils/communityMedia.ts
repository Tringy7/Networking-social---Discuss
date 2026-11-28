import type { Community, User } from '../types';

export function isCommunityOwner(community: Community, user: User | null, authenticated: boolean): boolean {
  if (!authenticated || !user) return false;
  // Detail responses contain the current owner even when they omit membership roles.
  // User IDs from JSON can be numbers while community IDs are normalized strings.
  // Username also supports sessions whose user response omits the numeric ID.
  if (community.ownerUsername) return community.ownerUsername === user.username;
  if (community.ownerId) return String(community.ownerId) === String(user.id);
  return community.currentUserRole === 'OWNER';
}

/** Visibility only. The upload endpoint must enforce community authorization. */
export function canEditCommunityMedia(community: Community, user: User | null, authenticated: boolean): boolean {
  if (!authenticated || !user) return false;
  return isCommunityOwner(community, user, authenticated) || community.currentUserRole === 'MODERATOR';
}
