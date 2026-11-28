# Community rules as Markdown

The source for default rules is `src/main/resources/community/default-rules.md`.
Edit this UTF-8 Markdown file to change the default for new communities and for
legacy communities whose stored rules are blank. Restart the backend to reload it.
Existing communities with nonblank custom rules keep their content.

Rules are stored in `community_info.rules` (MySQL TEXT), returned as a JSON string.
POST /communities stores the default when rules are omitted, null or blank.
PATCH /communities/{name} keeps rules when omitted/null; an empty or whitespace-only
string resets the rules to the default. A nonblank string replaces the document.
The existing owner authorization applies to updates.

GET /communities/default-rules returns `{ "rules": "...Markdown..." }` for the
editor reset/preview. It retains the authentication requirement of /communities.
Detail responses resolve blank legacy rules from the same default file.

Normalization removes a leading UTF-8 BOM and converts CRLF/CR line endings to LF.
Indentation, trailing spaces, code blocks, lists and Unicode are preserved.
Plain text is valid Markdown. The backend does not generate or render HTML.
Maximum input length remains 16000 characters to fit MySQL TEXT with Unicode.

The frontend uses a Markdown textarea with preview and a default reset button on
create and settings, and react-markdown with GFM on the community detail page.
Raw HTML is skipped and unsafe link protocols use the renderer's default filter.

With ddl-auto=update, restart the backend to add the TEXT column if needed.
For manually managed schemas, run schema/community_rules.sql once instead.
The old community_rules table is unused and is not dropped automatically.
