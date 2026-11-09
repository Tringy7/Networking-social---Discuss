# Search

The frontend interprets a prefix at the start of the trimmed query (case insensitive):

| Input | Search target | API |
| --- | --- | --- |
| `Spring Boot` | Post title and Markdown content | `GET /posts?tab=latest&q=Spring%20Boot` |
| `c/react` | Public active communities by name or description | Existing `GET /explore/search?filter=...` |
| `u/an` | Active users by username or display name | `GET /users/search?q=an&page=0&size=20` |

Only the selected search API is called. Prefixes are removed before making API requests. A prefix without a keyword does not trigger a search. Switching the result tab changes the prefix and preserves the keyword. Existing backend authentication requirements remain in place: users/posts require login, community discovery is public.

User search returns `PageResponseDTO<UserSearchResultDTO>` with public fields only (`id`, `username`, `displayName`, `bio`, `avatarUrl`). Matching is case insensitive and treats `%` and `_` as literal characters. Blank queries return an empty page. Page size follows the existing global pagination limit. No schema change is required.

Checks: `./mvnw test`; `node --experimental-strip-types --test src/utils/searchQuery.test.mjs` from frontend; `npm run build`.
