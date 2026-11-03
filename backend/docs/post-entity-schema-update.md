# Post content and media schema update

New databases use the simplified entity mappings directly. For existing MySQL databases, stop application writes and back up the database before migrating. Hibernate `ddl-auto=update` does not rename columns or convert legacy documents.

Before changing the schema:

- Convert legacy `post_contents.code`, `code_language`, `link_url` and ordered `post_blocks` into the `content` Markdown document. Preserve code whitespace, choose a Markdown fence longer than backtick runs in the code, and retain image object keys as `![caption](post-image:KEY)`. Verify converted documents before dropping any old data.
- Resolve duplicate `post_contents.post_id` values.
- Resolve duplicate `post_media.object_key` values: upload a separate copy for each post and update its Markdown references. Each key now belongs to at most one post.
- Resolve media rows with null keys or display orders; URL-only attachments must be uploaded to managed storage first.

Useful preflight queries:

```sql
SELECT post_id, COUNT(*) FROM post_contents GROUP BY post_id HAVING COUNT(*) > 1;
SELECT object_key, COUNT(*) FROM post_media GROUP BY object_key HAVING COUNT(*) > 1;
SELECT id FROM post_media WHERE object_key IS NULL OR display_order IS NULL;
```

After preflight and document conversion, adapt the following to the actual schema. Run once, before starting the updated application. Do not run against a fresh schema that already has `type`.

```sql
ALTER TABLE post_media RENAME COLUMN media_type TO type;
ALTER TABLE post_media
    MODIFY object_key VARCHAR(500) NOT NULL,
    MODIFY display_order INT NOT NULL,
    DROP COLUMN media_url,
    DROP COLUMN inline_image,
    DROP COLUMN created_at,
    ADD CONSTRAINT uk_post_media_object_key UNIQUE (object_key);
```

Check `SHOW CREATE TABLE post_contents` and add a unique constraint on `post_id` if none exists. After verifying converted content, the unused `link_url`, `code`, `code_language` columns and `post_blocks` table can be removed. Keep the backup until existing posts have been checked.

The response still includes derived media URLs and `inlineImage` for frontend compatibility; these are computed from object keys and Markdown rather than persisted. The response `linkUrl` is now null; links belong in Markdown.
