# Admin APIs

All routes below require an authenticated ADMIN. The existing access-token cookie
or Bearer header is used. Missing/invalid credentials return 401; a regular USER
receives 403. Errors use the existing `{status, message}` response format.

## Structure

| Group | Controller | Admin service | Domain services |
| --- | --- | --- | --- |
| Statistics | AdminController | AdminService | UserService, CommunityService, PostService, CommentService |
| Users | ManageUserController | AdminUserService | UserService, PublicUserProfileService |
| Communities | ManageCommunityController | AdminCommunityService | CommunityService |
| Posts | ManagePostController | AdminPostService | PostQueryService, PostService |
| Comments | ManageCommentController | AdminCommentService | CommentQueryService, CommentService |
| Reports | ManageReportController | AdminReportService | PostReportQueryService, CommentReportQueryService, CommunityReportQueryService, ReportReviewService |
| Categories | ManageCategoryController | AdminCategoryService | CategoryService |
| Activity | ManageActivityLogController | AdminActivityLogService | ActivityLogService |

Admin services call domain services. Repositories and query specifications remain
in their domain modules. Successful mutations and their audit record commit in
one transaction; failed operations do not create success records.

## Pagination and validation

User, community, post, comment, report and activity lists return `PageResponseDTO`:
`content`, `page`, `size`, `totalElements`, `totalPages`, `first`, `last`, `empty`.
Defaults: `page=0&size=10&sort=createdAt,desc`; the shared resolver caps size at 50.
The category list returns an array ordered by name. IDs must be positive.
Search endpoints require nonblank `search` of at most 200 characters. Matching is
a trimmed, case-insensitive literal substring (special wildcard characters do not
act as wildcards). Invalid enum values, bodies and parameters return 400.
An omitted list filter includes all values. Unknown records return 404.

## Statistics

`GET /admin/stats` returns `{data: {users, communities, posts, comments}}`.
User/community counts contain `total`, `active`, `suspended`; post/comment counts
contain `total`. Counts include all stored records. User totals can exceed
active + suspended because pending/deleted users also exist.

## Users

| Method | Route | Result |
| --- | --- | --- |
| GET | /admin/users | PageResponseDTO<AdminResponse.UserItem> |
| GET | /admin/users/search | Same list, filtered by username/email |
| GET | /admin/users/{userId} | PublicUserProfileResponseDTO from existing profile service |
| PATCH | /admin/users/{userId}/lock | 200 + ApiResponse |
| PATCH | /admin/users/{userId}/unlock | 200 + ApiResponse |

Lock returns `{"message":"User account id 2 locked successfully"}`; unlock returns
`{"message":"User account id 2 unlocked successfully"}`. Both return HTTP 200,
including repeated requests when the account is already in the requested state.

List/search accept `status=ACTIVE|SUSPENDED` and `role=USER|ADMIN`.
LOCKED is represented as SUSPENDED in the list. Without a status filter,
PENDING and DELETED values are preserved. Passwords/tokens are never returned.
Role is available for display and filtering only. Updating user roles is currently
unavailable. An administrator cannot lock their own account. Repeated lock/unlock
calls are idempotent.

## Communities

| Method | Route | Result |
| --- | --- | --- |
| GET | /admin/communities | PageResponseDTO<CommunityDetailResponseDTO> |
| GET | /admin/communities/search | Same list, filtered by name |
| GET | /admin/communities/{communityId} | CommunityDetailResponseDTO |
| PATCH | /admin/communities/{communityId}/lock | 204; sets BANED |
| PATCH | /admin/communities/{communityId}/unlock | 204; sets ACTIVE |

List/search accept `status=ACTIVE|BANED` and `visibility=PUBLIC|PRIVATE`.
`BANED` retains the spelling of the current database enum. Lists and details
include private and banned communities for inspection. Detail includes owner,
resolved images, category, rules and active member count. Locking preserves
community content and memberships.

## Posts

| Method | Route | Result |
| --- | --- | --- |
| GET | /admin/posts | PageResponseDTO<PostResponseDTO> |
| GET | /admin/posts/search | Same list, filtered by title/content |
| GET | /admin/posts/{id} | PostResponseDTO |
| DELETE | /admin/posts/{id} | 204; soft delete |

List/search accept `status=PUBLISHED|HIDDEN|DELETED` and `communityName`.
Unlike the public feed, management queries include private/banned communities
and hidden/deleted posts. Admin deletion supports hidden posts and records
`deletedAt` and `deletedByUserId`; an author cannot restore a post deleted by admin.
Deleting an already deleted post returns 204 without changing deletion metadata.

## Comments

| Method | Route | Result |
| --- | --- | --- |
| GET | /admin/comments | PageResponseDTO<CommentResponseDTO> |
| GET | /admin/comments/search | Same list, filtered by content |
| GET | /admin/comments/{id} | CommentResponseDTO |
| DELETE | /admin/comments/{id} | 204; soft delete |

List/search accept `status=VISIBLE|HIDDEN|DELETED`, `communityName` and `postId`.
Management queries include comments in private/banned communities and on
hidden/deleted posts. Deletion supports hidden comments, sets `deletedAt`, and
replaces content with `[deleted]`, preserving the existing comment deletion rule.
Original deleted comment text is therefore unavailable. Repeated deletion returns
204 without changing the deletion timestamp.

## Reports

| Method | Route | Result |
| --- | --- | --- |
| GET | /admin/reports?type=POST | PageResponseDTO<ReportResponseDTO> |
| GET | /admin/reports/{type}/{reportId} | ReportResponseDTO |
| PATCH | /admin/reports/{type}/{reportId}/resolve | Updated ReportResponseDTO |
| PATCH | /admin/reports/{type}/{reportId}/reject | Updated ReportResponseDTO |

`type` is required and must be POST, COMMENT or COMMUNITY. The ID is local to that
report type. Lists support `status=PENDING|RESOLVED|REJECTED` and `communityName`.
The existing GET /reports/posts, /reports/comments and /reports/communities remain
available for compatibility, including community-staff report lists.

Review body: `{"resolutionNote":"Reviewed and removed the violating content."}`.
The note is required, nonblank and at most 2000 characters. Review sets status,
reviewer, timestamp, note and `action` (REVIEWED or REJECTED). A pessimistic row
lock permits only one transition from PENDING. Reviewing a handled report returns
409; missing reports return 404. Resolve records the decision; it does not
automatically delete content or ban a community. Use the corresponding moderation
API for that action before resolving, if needed.

## Categories

| Method | Route | Result |
| --- | --- | --- |
| GET | /admin/categories | CategoryResponseDTO[] |
| POST | /admin/categories | 201 + CategoryResponseDTO |
| PATCH | /admin/categories/{id} | CategoryResponseDTO |
| DELETE | /admin/categories/{id} | 204 |

Create/update body: `{"name":"Programming","slug":"programming"}`. Both fields
are required for create and update, max 100 characters each. Slugs use lowercase
letters, digits and single hyphens between segments. Duplicate names/slugs return
409. Deleting a category still used by any community returns 409. No automatic
reassignment is performed. Public GET /categories keeps its existing JSON shape.

## Activity logs

`GET /admin/activity-logs` returns `PageResponseDTO<AdminActivityLogResponseDTO>`.
Optional filters: `actorUserId`, `action`, `targetType`. Each record contains id,
actorUserId, actorUsername, action, targetType, targetId, note, createdAt. Records
have no update/delete API. Only mutations through the admin facades are logged;
old historical actions and public user/staff actions are not backfilled.

Actions: LOCK_USER, UNLOCK_USER, LOCK_COMMUNITY,
UNLOCK_COMMUNITY, DELETE_POST, DELETE_COMMENT, RESOLVE_REPORT, REJECT_REPORT,
CREATE_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY. Report target types are
POST_REPORT, COMMENT_REPORT, COMMUNITY_REPORT; other target types are USER,
COMMUNITY, POST, COMMENT, CATEGORY.

## Schema and verification

New schema: `admin_activity_logs`; nullable `resolution_note` and `action` columns
on post_reports, comment_reports and community_reports. The project's existing
`spring.jpa.hibernate.ddl-auto=update` applies these additions on startup. Existing
report rows retain null notes/actions. No existing data is deleted by setup.

Run `mvn test` for report transitions, category constraints,
method-security enforcement and request validation/pagination tests. Tests do not
require running MySQL, Redis or MinIO. Request examples are in `admin.http`.
For live verification, use an ADMIN session and also confirm 401/403 with missing
credentials/USER credentials; check combined filters, hidden content, repeated
mutations and audit rows. Backend APIs are ready for frontend integration; this
change does not enable the new controls in the UI.
