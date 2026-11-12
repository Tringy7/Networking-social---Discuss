# Admin read APIs

All endpoints require an authenticated ADMIN. Authentication uses the existing
access_token cookie or Authorization: Bearer header. Missing/invalid credentials
return 401; authenticated users without ADMIN return 403.

## GET /admin/stats

Returns `{ "data": { "users": { "total": 0, "active": 0, "suspended": 0 },
"communities": { "total": 0, "active": 0, "suspended": 0 },
"posts": { "total": 0 }, "comments": { "total": 0 } } }`.

Counts include all stored records, including soft-deleted posts/comments/users.
User total can exceed active + suspended because PENDING and DELETED also exist.
Suspended counts map to existing user LOCKED and community BANED states.

## GET /admin/users

Query parameters:

| Parameter | Default | Validation |
| --- | --- | --- |
| page | 0 | Zero-based page index |
| size | 10 | Page size, capped at 50 by the shared pagination configuration |
| sort | createdAt,desc | Spring Pageable sort parameter |
| status | omitted | ACTIVE or SUSPENDED; omitted includes all states |

Invalid status values return 400 using the existing backend error format.
Pagination follows the shared Spring Pageable resolver behavior, including
fallbacks for invalid page/size values. Results default to createdAt descending.

Response uses the shared `PageResponseDTO`: `content` (array), `page`, `size`,
`totalElements`, `totalPages`, `first`, `last`, `empty`. The response page remains
zero-based to match this endpoint's request; `size` reflects the resolved page size.
Each item exposes only id, username, email, displayName, avatarUrl,
role, status, createdAt. Missing profile fields are null. LOCKED is returned as
SUSPENDED; PENDING and DELETED are preserved when no status filter is supplied.
Timestamps retain the application's existing LocalDateTime format.
Empty results return 200 with an empty array and totalPages 0.

Example: `GET /admin/users?page=0&size=10&status=ACTIVE`.
The list endpoint does not perform keyword searches.

## GET /admin/users/search

Search users by username/email using a trimmed, case-insensitive literal substring.
Uses a separate search request DTO and service method. The required `search`
parameter must be nonblank and at most 200 characters; missing, empty or whitespace
keywords return 400. Supports the same optional page, size, sort and status parameters and
returns the same PageResponseDTO as the list endpoint.

Example: `GET /admin/users/search?page=0&size=10&search=an&status=ACTIVE`.

## GET /admin/users/{userId}

Returns the existing `UserInfoResponseDTO` directly, without a `data` wrapper:
username, email, role, status, createdAt, updatedAt, profile and privacySettings.
Profile includes displayName, bio, avatar, banner, dateOfBirth, gender and location;
avatar/banner use the existing UserMapper to resolve MinIO URLs. Privacy settings
include showDateOfBirth and showLocation. Missing profile/privacy records are null.
Passwords and tokens are never included.

The ID must be a positive Long; invalid IDs return 400, unknown users return 404
(`USER_NOT_FOUND`). Admins can inspect users in any status, including LOCKED,
PENDING and DELETED. Status uses the existing DTO enum (`LOCKED` rather than the
list endpoint's `SUSPENDED` label).

Example: `GET /admin/users/123`.

User list, search and detail logic live in `ManageUserService`, exposed through
`ManageUserController`. `AdminService` and `AdminController` handle statistics.

## Manual verification

With the backend and database running:

1. Call all admin endpoints without credentials: expect 401.
2. Call all admin endpoints with a USER token: expect 403.
3. Call all admin endpoints with an ADMIN token: expect 200 and the response fields above.
4. Compare statistics against database counts, including LOCKED users and BANED communities.
5. Search a known username/email with mixed case; verify only matching users appear.
6. Filter SUSPENDED; verify only LOCKED users appear and passwords/tokens are absent.
7. Try status=LOCKED: expect 400. Verify page=0 selects the first page and size=101 is capped at 50.
8. Use /admin/users/search to search a nonexistent value or request a page beyond the last: expect an empty array.
9. Fetch an existing user's ID, including a LOCKED user: expect UserInfoResponseDTO
   for that user, with no password/token fields. Check null profile/privacy handling.
10. Fetch an unknown positive ID: expect 404; use 0, -1 or a nonnumeric ID: expect 400.

