---
name: work-backlog
description: Use when the user wants to work through open GitHub issues sequentially — triaging each one and implementing it if self-contained, or reporting back if too complex. Use for "run down the backlog", "work through issues", or "babysit a ralph loop".
---

# Work Backlog

Sequentially triage and implement open GitHub issues, one at a time. Each issue gets its own subagent. Spawn the next subagent only after the previous one finishes.

## Setup

Before starting the loop:

1. Fetch the open issue list:
   ```bash
   gh issue list --state open --json number,title,body --limit 50
   ```
2. Check for uncommitted/unpushed changes:
   ```bash
   git status --short && git status -sb
   ```
   If the working tree is dirty, commit or resolve before starting. Do not begin the loop with uncommitted changes.

## The Loop

For each issue in order, spawn a **single subagent** with this prompt structure:

```
You are working on [project] at [path].

## Your task
Triage GitHub issue #N: "[Title]"
Body: "[Body]"

## Step 1: Verify git state
Run `git status --short`. Only untracked .claude/ files are acceptable.
If tracked files are modified, STOP and report back.

## Step 2: Assess complexity
Read [relevant files for this issue type].
Decide: is this self-contained (implement now) or too complex (report back)?

Self-contained means:
- All needed data/fields already exist, OR extraction pattern is clear from existing code
- No human judgment or live-site research required
- Can be fully implemented and deployed in one session

## Step 3: Act
- If self-contained: use the Skill tool with skill="work-github-issue" and args="N"
- If too complex: report back with a clear explanation. Leave a comment (attributed to claude) on the issue explaining the decision.

## Constraints
- Start on main, and be sure to pull latest
- Use work-github-issue skill (via Skill tool) for implementation
- All changes go through PRs — never commit directly to main (the skill handles this)
```

Wait for the subagent to complete before spawning the next one.

## Complexity Signals

**Likely self-contained:**
- Frontend-only (config tweak, new component, UI polish)
- Backend extraction where the HTML pattern is clearly analogous to an existing extractor
- Fixed/known value sets (e.g., rarity: Common/Uncommon/Rare/Unique)
- Field already indexed — just needs surfacing in the UI

**Likely too complex:**
- Architectural migration (connector swap, index type change)
- Blocked by another unfinished issue
- Requires a design decision the user hasn't made (comment on the issue, as claude, with what extra context is necessary)

## What to Do with Complex Issues

Report back to the user with:
- **Why** it's not self-contained (one specific blocker)
- **What would unblock it** (a design decision, a research step, a prerequisite issue)


## Dirty Git State

Each subagent checks git state on start. If it finds uncommitted changes to tracked files:
- The subagent stops and reports back
- You (the orchestrator) investigate: are these from the previous subagent's work that needs pushing? A failed deploy? An in-progress edit?
- Resolve before spawning the next subagent

## Tracking Progress

Keep a running summary in your responses as issues complete:

| # | Title | Result |
|---|-------|--------|
| N | Title | Done / Too complex: [reason] |

## Crawl Coordination

Crawls take hours and only one can run at a time. During a backlog session with multiple backend-affecting issues, do **not** let each subagent trigger its own crawl. Instead:

- Tell subagents in their prompts: **skip crawl-triggering** — just deploy the backend config changes and note what needs re-crawling.
- After all issues are processed, trigger a single full crawl at the end if any backend changes were made.
- Exception: if only one issue in the session needs a crawl and it's the last one, you can let its subagent trigger it — but check for an active crawl first.

## When to Stop

- All issues have been triaged → report the full summary
- User interrupts → pause and summarize what's been done and what remains
- Three consecutive subagents fail git state check → stop and investigate
