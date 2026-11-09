# GET /reports — Admin report list

Requires authentication via the existing access_token cookie or Bearer token and an ACTIVE account with database role ADMIN. Other authenticated users receive 403; unauthenticated requests receive 401.

Example: `GET /reports?status=PENDING&targetType=COMMENT&communityName=java&page=0&size=20`

Optional filters:
- status: PENDING, RESOLVED, REJECTED; omitted means all.
- targetType: POST, COMMENT, COMMUNITY; omitted means all three tables.
- communityName: exact community name, trimmed and lowercased; omitted/blank means all.
- page: zero-based, minimum 0; default 0.
- size: 1–100; default 20.

Returns 200 with PageResponseDTO<ReportResponseDTO>: content, page, size, totalElements, totalPages, first, last, empty. An empty or out-of-range page returns an empty content array. Invalid enums or pagination return 400.

Sort is fixed: createdAt descending, targetType ascending, id descending. Count and pagination run in the database across all selected report types. Hidden/deleted targets and inactive/private communities remain included for moderation.

Report IDs are local to their tables: retain both id and targetType. resolvedBy/resolvedAt map to handledBy/handledAt. action and resolutionNote are null because existing entities do not store these fields. No schema change is needed.

The frontend report flag remains disabled until list/moderation integration is implemented.
