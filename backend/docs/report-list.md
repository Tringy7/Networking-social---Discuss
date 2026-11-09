# Report lists — separate APIs

Admin only:
- GET /reports/posts
- GET /reports/comments
- GET /reports/communities

Owner/Moderator with ACTIVE membership of that community, or Admin:
- GET /reports/community/{name}/posts
- GET /reports/community/{name}/comments

Example: GET /reports/posts?status=PENDING&communityName=java&page=0&size=20
Example: GET /reports/community/java/comments?status=PENDING&page=0&size=20

All return PageResponseDTO<ReportResponseDTO>. Optional status: PENDING, RESOLVED, REJECTED. page defaults to 0 (minimum 0); size defaults to 20 (1–100). Sort: createdAt DESC, id DESC. Each endpoint queries and paginates a single table using Spring Data JPA. No UNION or in-memory merging.

communityName is an optional exact name filter for Admin endpoints, normalized by CommunitySupport. Community routes take their scope only from the path. Reports about the community itself are restricted to the Admin communities endpoint.

GET /reports and GET /reports/community/{name} have been removed. targetType is no longer a list parameter: the route specifies the type. POST /reports is unchanged and still requires targetType.

401 unauthenticated; 403 insufficient role or membership; 404 missing community for community routes; 400 invalid enums or pagination. Hidden/deleted content remains included for moderation history. No schema changes. No frontend integration included; existing frontend list service paths must be updated when reports are enabled.
