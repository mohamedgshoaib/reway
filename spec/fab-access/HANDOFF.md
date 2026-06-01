# FAB Fresh Conversation Handoff

Use this when starting the next conversation for implementation.

## Suggested Start Prompt

```text
Follow the session start sequence in AGENTS.md, then read spec/fab-access/README.md.
Start with Chunk 1 - Data Model And API only.
Do not implement content script UI yet.
Update spec/fab-access/README.md Progress Tracker after each significant step.
Use required skills from spec/fab-access/README.md before touching matching areas.
```

## Suggested Skills

- `supabase`: schema, generated types, user-scoped data access.
- `next-best-practices`: App Router route handlers and server actions.
- `zod`: query/body validation if adding search or toggle routes with structured parsing.
- `chrome-extension-development`: only if Chunk 1 needs extension route contract checks.
- `grill-me`: any behavior not already locked in `README.md`.

## Current Scope

Implementation has not started.

The next session should begin with Chunk 1 from `spec/fab-access/README.md`:

- add `groups.show_in_fab boolean default true`
- update generated Supabase types
- include `show_in_fab` in dashboard and extension group reads
- add dashboard action/mutation for toggling quick-access visibility
- add explicit `groupId=none` handling for extension bookmark reads
- include favicon/domain fields in extension bookmark list payload
- add user-scoped capped bookmark search for extension FAB
- reuse `/api/bookmarks/visits` if possible for best-effort FAB visit tracking

Stop after Chunk 1 unless the user explicitly asks to continue.

## Carry-Forward Principles

- The FAB is read/access only. No saving, no settings inside the FAB.
- Popup settings own local extension preferences.
- Dashboard owns account-backed group visibility.
- Use extension background for API fetches, cache, tab opening, and visit logging.
- Content script should be Shadow DOM UI only.
- Do not use dashboard cache for extension FAB data.
- Do not include `All Bookmarks` in the FAB.
- Include `No Group` via explicit `groupId=none`.
- Search is server-side, bookmark-only, debounced, capped, and does not call the all-bookmarks list endpoint.

## Reference Files

- `spec/fab-access/README.md`
- `spec/prototypes/fab-access-demo/`
- `extension/manifest.json`
- `extension/background.js`
- `extension/js/api.js`
- `extension/popup.js`
- `extension/popup.css`
- `app/api/extension/groups/route.ts`
- `app/api/extension/bookmarks/route.ts`
- `app/api/bookmarks/visits/route.ts`
- `lib/library/server/reads.ts`
- `lib/bookmark-visits.ts`
