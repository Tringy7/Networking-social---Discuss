# Current Post contract

The latest user-edited CreatePostRequestDTO is authoritative: communityName, title, type (TEXT/LINK), content, tags, media and linkUrl.

Service, response, entities, mapper and frontend now follow this contract. PostMedia persists type/objectKey/caption/order; Markdown contains code and inline images. Previous blocks are read through a compatibility adapter and retired on explicit edit. Request block DTOs were removed; the legacy entity remains for safe reads.

See backend/docs/create-post.md for request examples, validation and migration instructions. The new migration is backend/docs/migrations/2026-11-03-post-create-dto.sql. Existing upload supports IMAGE; VIDEO attachment requests return 415 until a video upload pipeline exists.

Frontend production build succeeds. Backend verification is recorded in backend/target/post-create-dto-tests.log. Existing full-project TypeScript errors outside Post remain. Live MySQL/MinIO migration was not performed.
