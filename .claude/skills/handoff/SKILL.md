---
name: handoff
description: Compact the current conversation into a handoff for another agent to pick up.
argument-hint: "What will the next session be used for?"
---

Write a handoff summarising the current conversation so a fresh agent can continue the work, conversation will be compacted.

Include a "suggested skills" section in the document, which suggests skills that the agent should invoke, and include the current scope of work and what's next, and what principles or workflows are established with the user in current conversation that should carry forward.

Do not duplicate content already captured in other artifacts (CLAUDE.md, AGENTS.md), only reference and guide the agent on where to look, do not bloat the agent's context window.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor accordingly.