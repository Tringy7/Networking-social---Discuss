# Targeted DISCUSS refinement — latest pass

This pass follows the latest targeted brief and supersedes the previous profile layout below. The attachment supplied text only; no reference screenshot was present, so the described earlier DISCUSS anatomy was restored and reviewed in browser screenshots.

- Profile: full-width top banner, overlapping avatar, identity/actions underneath, activity tabs and a right-side Giới thiệu panel. Existing image menus, crop dialogs, profile privacy and upload handlers remain connected. Mobile stacks these sections.
- Navigation: removed sidebar Settings and Đổi giao diện entries. Settings retain their horizontal section navigation and header user-menu access. A shared ThemeToggle icon appears once per main, authentication and administration header, with an accessible name and native tooltip; it uses the existing persisted settings store. Narrow guest headers retain login and the page's registration entry points.
- Settings: neutral selected top tab, matching canvas and overview rows; removed the duplicate theme chooser. Accent, density, font, motion and navigation preferences remain available.
- Content: gray code surfaces in both themes, separate inline-code treatment and scrollable multiline blocks. Bảng tin gains a compact discussion icon. Discovery descriptions now use two lines with consistent card/footer geometry.
- Preview: one original local SVG image post is gated by import.meta.env.DEV inside the existing fallback demo dataset. It never replaces API-backed posts. Confirmed its identifier is absent from production JS.

Verification: production build passes (existing initial-chunk size warning remains); 7/7 tests pass; 66 route/layout checks and 50 interaction checks pass. Browser review covers light/dark, desktop 1366/1440/1920, tablet 768 and mobile 390, plus guest header bounds at 320. Production inspector reports 0 failures/0 warnings at 1440/768/390. Screenshot artifacts and browser findings are under `.taste-skill/targeted-routes` and `.taste-skill/targeted-production`. Authenticated checks use browser-only fixtures; live backend authentication/upload end-to-end checks require a running backend and account. Routes, backend and API contracts are unchanged.

Lint was run: 129 existing legacy JSX errors remain. ESLint currently targets JS/JSX only; no static TypeScript check is configured. `redesign-skill` and `output-skill` remain unavailable after searching installed user/Codex/plugin and project-local skill directories; neither was used. The installed project `design-taste-frontend` skill guided browser verification.

Files touched in this targeted pass: `src/social.css`, `src/pages/profile/UserProfilePage.tsx` (restored to its tracked structure), `src/components/ui/ThemeToggle.tsx`, `src/components/layout/Navbar.tsx`, `src/components/layout/Sidebar.tsx`, `src/layouts/AuthLayout.tsx`, `src/layouts/AdminLayout.tsx`, `src/pages/settings/AppearanceSettingsPage.tsx`, `src/pages/settings/GeneralSettingsPage.tsx`, `src/pages/home/HomePage.tsx`, `src/components/community/CommunityCard.tsx`, `src/mocks/demoContent.ts`, and `public/images/discuss-state-map.svg`.

---

# Unified social canvas and layout consistency

Current pass: one neutral canvas, shared geometry, standardized discovery cards, compact three-region profiles and visible semantic feedback. The older refinement notes below describe the preceding pass.

- Shared layout tokens define a 64px header, 248px expanded navigation, 28/36px desktop gutters and a 300/320px contextual rail. Home and Post Detail use the same grid; a browser assertion verifies matching primary-column x position and width.
- Resting post, context, community and settings wrappers were flattened to a shared canvas with subtle dividers. Both themes use a coordinated common canvas.
- Discovery uses one consistent anatomy regardless of result count or cover availability: one anatomy independent of result count, fixed avatar dimensions, two-line name region, truncated identifier, three-line description region and aligned footer actions. Browser assertions verify equal heights and action alignment.
- Profiles place identity and supported tabs centrally, with banner/avatar controls, bio and privacy-aware facts in the right information panel. All crop dialogs, uploads and role actions remain connected to their original handlers. No reference screenshot was attached; the supplied text's three-region structure guided implementation.
- Desktop and mobile share `components/ui/NotificationBadge.tsx`; actual unread counts support 99+ with contrasting, unclipped badges. Unread rows and selected navigation/tabs have stronger emphasis. Toasts name their semantic state, retain recognizable icons and use semantic borders. Removed the unconditional message dot and unsupported navbar karma presentation.

Verification: production build passed; existing tests 7/7 passed; 66 route/layout browser checks and 39 interaction checks passed. The production home inspector reported 0 failures and 0 warnings at 1440/768/390px. Representative light/dark/profile/thread/discovery screens were opened and reviewed. Route paths are preserved. No API/service, backend or legacy JSX files changed. Existing ESLint still reports 129 legacy JSX errors; no static TypeScript check is configured. Authenticated browser checks use isolated fixtures, so live backend end-to-end validation remains outstanding. The build retains the existing initial-chunk size warning.

Additional checks verified badges at 0/9/99/120 unread items on desktop and mobile, long-text discovery-card alignment, and all four semantic toast labels. These use browser-only fixtures, never production data replacements. Result-count-specific card layout exceptions were removed. Administration now shares the 248px navigation width and canvas gutters.

Primary files: `src/index.css`, `src/social.css`, `pages/post/PostDetailPage.tsx`, `pages/profile/UserProfilePage.tsx`, `components/community/CommunityCard.tsx`, `components/layout/Sidebar.tsx`, `components/layout/Navbar.tsx`, `components/layout/MobileNavigation.tsx`, `components/ui/NotificationBadge.tsx`, `pages/notifications/NotificationsPage.tsx`, and `components/ui/ToastContainer.tsx`.

---

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
