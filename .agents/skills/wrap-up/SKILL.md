---
name: wrap-up
description: End-of-session log. Write to spec/sessions/. Verify all file paths.
---

# Wrap Up

Run at the end of every work session or before context gets compacted.

1. Ask user to provide current time and date.
2. Check `spec/sessions/` for a file matching today's date (DD-MM).
   - If found: append new entries into the existing Completed, Decisions, and Blockers sections. Do NOT add a new session header. Extend the Time range on the existing header (e.g. `12:16 AM–02:13 AM`).
   - If not found: create one using `SESSION_TEMPLATE.md` structure.
3. Write only what is true and verified. One line per entry. No in-progress noise.
4. Decisions: log only irreversible or architectural choices.
5. Blockers: number them. Strike through + date any resolved ones.
6. Verify every file path or line number cited actually exists before writing.
7. Confirm: "Session logged.
