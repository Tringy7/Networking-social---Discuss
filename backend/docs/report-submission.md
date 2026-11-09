# POST /reports

Authentication: existing access_token cookie or Authorization: Bearer token. Only active users can submit reports.

```json
{"targetType":"POST","targetId":123,"reason":"SPAM","description":"Repeated advertising"}
```

- targetType: POST, COMMENT, COMMUNITY. targetId: positive database ID.
- reason: SPAM, HARASSMENT, HATE_SPEECH, INAPPROPRIATE_CONTENT, MISINFORMATION, OTHER.
- description: optional, maximum 2000 characters; required and nonblank for OTHER.
- Reporter and community are derived by the server; initial status is PENDING.
- Private communities require active membership, matching the existing post read policy.
- Hidden/deleted content, unavailable parent posts and inactive communities cannot be reported.

Responses: 201 created; 400 invalid body; 401 unauthenticated; 404 target missing or inaccessible; 409 same reporter has a PENDING report for the same target.

Example response (timestamps follow the existing backend LocalDateTime convention):

```json
{"id":10,"targetType":"POST","targetId":123,"communityName":"java","reporterUsername":"alice","reason":"SPAM","description":"Repeated advertising","status":"PENDING","action":null,"resolutionNote":null,"resolvedBy":null,"resolvedAt":null,"createdAt":"2026-11-08T12:00:00"}
```

Storage uses the existing post_reports, comment_reports and community_reports tables. Each gains a nullable description VARCHAR(2000) column through the existing ddl-auto=update configuration. Existing rows are preserved. Deployments without automatic schema updates must add these three columns first.

IDs are scoped to targetType because the three existing tables have separate sequences. Retain both id and targetType; a future moderation endpoint must disambiguate report types.

Duplicate checks and inserts run in a READ_COMMITTED transaction with a pessimistic write lock on the reporter row, serializing concurrent submissions by that user. This endpoint does not modify reported content.

Only submission is implemented. List/moderation APIs and frontend wiring are outside this change; REPORTS_AVAILABLE remains false.
