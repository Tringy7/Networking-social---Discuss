# DISCUSS: friendly community UI refinement

The approved direction is **Modern Friendly Community Social Network**, replacing the earlier editorial treatment. This refines the existing application rather than replacing its architecture.

## What changed

- **One friendly font:** Nunito Sans, with Vietnamese glyph support, replaces Be Vietnam Pro and Newsreader. Interface weights are 400–600; the wordmark uses 700. Feed titles are 19px (18px on mobile), post content is 15px, metadata is 12–13px, and page titles are 24–26px. Code remains monospace.
- **Social conversations:** a 40px author avatar, recognizable community identity, author names and relative timestamps, short expandable previews, familiar like/comment/save/share controls, larger in-flow media, and one soft surface per post.
- **Community participation:** reusable Join/Leave controls call the existing Zustand membership actions from discovery cards and the feed rail. Pending/error feedback and guest login redirects are preserved. Discovery uses cards for multiple communities and a compact horizontal presentation for a single desktop result.
- **Softer shared system:** neutral light surfaces, neutral charcoal Dark Mode, moderate corners, subtle borders, orange primary actions, and readable action text across all existing accent choices. Avatar fallback colors remain stable for each displayed identity.
- **Familiar navigation:** Home, Explore, profile, notifications, messages and settings retain their routes. The existing collapsible sidebar and mobile navigation are preserved. Search, dropdowns, dialogs and controls share softer geometry.
- **Other active screens:** social profile/activity composition, welcoming split-screen authentication, conversation-style post detail and comments, cleaner settings, and management screens using the same type and palette.
- **Fast feedback:** Framer Motion remains in place for reactions, tabs, sidebar, membership labels and overlays. Route and list entrances are short opacity transitions. System reduced-motion and saved motion preferences are respected.

Shared tokens and base behavior live in `src/index.css`; the application presentation is in `src/social.css`. Existing internal selector names remain compatible with the active components; they no longer imply a serif/editorial appearance.

## Verification

| Check | Result |
| --- | --- |
| Production build | Passed |
| Existing Vitest tests | 7/7 passed |
| Route/layout browser checks | 66 passed; no horizontal overflow, empty main regions, missing titles or unnamed visible buttons |
| Interaction browser checks | 27/27 passed |
| Final production home inspector at 1440 / 768 / 390px | 0 failures, 0 warnings |
| Active TS/TSX/CSS Taste source scan | 0 failures; warnings concern existing palettes, floating overlay shadows, hexadecimal formatting and punctuation |
| Existing ESLint command | Still reports 129 pre-existing errors in untouched legacy JSX |
| Existing route path comparison | All 39 explicit paths preserved |
| Legacy JSX, API/service and backend changes | None |
| `git diff --check` | Passed |

The browser sweep includes representative layouts at 1366, 1440, 1920, 768 and 390px and representative Light and Dark Mode screens. All final production-inspector screenshots were opened and reviewed. Additional community, profile, authentication, thread and dark-mode screenshots were reviewed and refined.

Interaction checks cover sidebar collapse/expand; like/unlike; bookmark state; preview expansion; URL sorting; composer opening/focus/Escape; theme and preference persistence; avatar crop-editor access; community wizard access/Escape; mobile inbox navigation; mobile drawer opening/Escape; admin access denial; discovery Join/Leave; feed-rail Join; and rendered social typography and identity visibility.

Public routes were checked on the production preview. Authenticated layouts and membership interactions use isolated browser-only fixtures. These fixtures are not shipped and do not replace API data in the application. Live authentication/refresh, real image uploads and backend mutations still require an account and running backend for end-to-end validation. There is no configured TypeScript compiler or type-check script; the production build verifies transpilation, not static TypeScript correctness.

The existing demo post/notification/message modes and their visible notices remain unchanged. No new fake content, metrics, online counts, photographs or generated media were added to the application. Existing user-selectable accent palettes remain available.

## Visual review

The feed now answers “what are my communities sharing?” through people, community names and conversation controls. Post content, rather than a display headline, leads the hierarchy. Related metadata stays grouped above each post and actions stay below it. Tablet uses the full feed width; mobile preserves the readable column and bottom navigation.

Review corrections: replaced article bylines with two-line social headers; removed quotation-style side panels and heavy title rules; reduced list entrance movement; kept single-community results compact; and placed profile activity beside a concise social introduction panel. Empty banners do not invent imagery or activity.

The installed `design-taste-frontend` skill and its app-screen guidance were used. The user's approved social direction takes precedence over the prior `editorial-greeting` sheet and its font/composition choices. No new random direction or visual asset was introduced. Local browser artifacts are ignored by Git under `.taste-skill/social-before`, `.taste-skill/social-after`, and `.taste-skill/social-routes`.
