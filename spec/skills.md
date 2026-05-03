# Agentic Skills & Behaviors Index

> **LLM Context & Usage Guide**
> This document is the authoritative index for all `.agents/skills/` installed in this project. It defines the "mental models" and technical standards that agents must adopt when working in this codebase.
>
> - **Template Lifecycle**: If this file contains the default list of skills or placeholders, you MUST first verify which skills are actually installed in `.agents/skills/` and update this document to match the project's specific toolkit.
> - **How to use**: Before generating, reviewing, or refactoring code, consult this file to determine which skills are active and their top priority rules.
> - **How to act on it**: Load the relevant skill into your context along with any listed under **Pairs With**.
> - **How to update**: When installing or updating a skill, strictly follow the `Unified Writing Format Template` documented below.

## Quick Index

[Replace this list with links to the specific skills installed in the project]

- [1- skill-name](#1--skill-name): Brief hint of the skill's purpose.

---

## Document Pattern

The skills follow a specific structure to indicate their depth and organization:

- **Only `SKILL.md`**: The full content of the skill is in one file.
- **`SKILL.md` + `AGENTS.md`**: `SKILL.md` is the summary; `AGENTS.md` is the full instruction set.
- **`SKILL.md` + folders**: Folders (`examples`, `rules`, etc.) contain supporting assets guided by `SKILL.md`.

## Unified Writing Format Template

When adding or updating skills, you MUST follow this exact structure:

```markdown
### [Skill Number]- [skill-directory-name]

**Structure**: [e.g., Only `SKILL.md` | `SKILL.md` + `AGENTS.md`]
**Triggers**: [comma-separated keyword tags]
**Pairs With**: [related skill names]
**Summary**:
[1-2 sentence philosophical summary]

- [Feature/Coverage Bullet 1]
- [Feature/Coverage Bullet 2]
- [Pattern/Edge Case Bullet 3]
- [Tooling/Architecture Bullet 4]

**Top 5 Rules (By Priority)**:

1. [Highest impact rule]
2. [Second most critical rule]
3. [Third most critical rule]
4. [Fourth most critical rule]
5. [Fifth most critical rule]
```

---

## Skills

[This section will be populated with the specific skills relevant to the project once they are verified or installed. Below is a placeholder example of how a skill should be documented.]

### 1- project-specific-skill

**Structure**: Only `SKILL.md`
**Triggers**: [trigger words]
**Pairs With**: [related skills]
**Summary**:
[Brief summary of the skill's purpose and how it impacts the codebase.]

- [Summary of key features]
- [Summary of key techniques]
- [Summary of practical application]
- [Summary of architectural impact]

**Top 5 Rules (By Priority)**:

1. [Critical rule 1]
2. [Critical rule 2]
3. [Critical rule 3]
4. [Critical rule 4]
5. [Critical rule 5]
