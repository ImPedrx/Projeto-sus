# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

There is no application code here yet. The repository currently contains a single
directory, `.agents/`, which vendors a **Superpowers-style agent skill library** — 30
skills that instruct any agent runtime (Claude Code, Codex, Gemini CLI, Copilot CLI,
Antigravity) on how to do planning, debugging, code review, document generation, and
frontend work.

Two consequences worth internalizing before doing anything:

1. **The "codebase" is prompts, not programs.** Most files are `SKILL.md` markdown with
   YAML frontmatter. The Python/Bash/Node files under `scripts/` are tools that skills
   tell an agent to shell out to — they are not an application with an entry point.
2. **`master` has zero commits.** `git log` fails with "does not have any commits yet".
   Nothing is tracked. Treat any git-history-based workflow (diffs against HEAD, review
   packages, `finishing-a-development-branch`) as unavailable until a first commit exists.

## Environment

Windows + PowerShell is the primary shell, but a large share of the skill tooling is
`#!/usr/bin/env bash` (`start-server.sh`, `sdd-workspace`, `task-brief`,
`review-package`, `find-polluter.sh`). Run those through Git Bash, not PowerShell.
Python scripts need `pyyaml`; `mcp-builder/scripts/requirements.txt` lists that skill's
own deps.

## Commands

There is no build, no lint, and no test suite at the repository level. The runnable
commands all belong to individual skills:

```powershell
# Static file server over the repo root (mainly for previewing generated HTML)
powershell -File .agents/serve.ps1 -Port 8080 -Root .
```

```bash
# --- skill authoring (run from .agents/skills/skill-creator/) ---
python -m scripts.quick_validate <path/to/skill-folder>      # frontmatter + structure check
python -m scripts.package_skill  <path/to/skill-folder>      # build distributable .skill zip
python -m scripts.run_eval  --eval-set <eval.json> --skill-path <skill>   # one eval pass
python -m scripts.run_loop  --eval-set <eval.json> --skill-path <skill> \
    --model <model-id-powering-this-session> --max-iterations 5 --verbose  # description optimizer
python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>

# --- OOXML validation (from .agents/skills/docx/ or .agents/skills/pptx/) ---
python scripts/office/validate.py out.docx --original in.docx   # add --auto-repair to fix
python scripts/office/soffice.py --headless --convert-to pdf out.docx

# --- subagent-driven development helpers (from .agents/skills/subagent-driven-development/) ---
scripts/sdd-workspace  PLAN_FILE                 # resolve/create .superpowers/sdd/<plan>/
scripts/task-brief     PLAN_FILE TASK_NUMBER     # extract one task to a file
scripts/review-package PLAN_FILE BASE HEAD       # commits + stat + diff for a reviewer

# --- brainstorming visual companion (from .agents/skills/brainstorming/) ---
scripts/start-server.sh --project-dir <repo-root>   # prints JSON with the URL
scripts/stop-server.sh

# --- webapp testing (from .agents/skills/webapp-testing/) ---
python scripts/with_server.py --server "npm run dev" --port 5173 -- python your_automation.py
```

`quick_validate` is the closest thing to a test for a skill you edit: it verifies
`SKILL.md` exists, starts with `---`, and parses as YAML frontmatter. Run it on any skill
folder you touch.

## Skill anatomy

Every skill is a directory under `.agents/skills/<name>/` containing `SKILL.md` with
exactly two frontmatter fields:

```yaml
---
name: <matches the directory name>
description: <when to use it — this is the only text an agent sees before loading>
---
```

The `description` is load-bearing: agent runtimes list skills by name + description only,
and decide from that whether to read the body. That is why `skill-creator` ships an eval
harness (`run_loop.py`) purely for optimizing description wording against a set of trigger
queries. Changing a description changes when the skill fires — don't reword one casually.

Bodies stay short and delegate depth to sibling files (`references/*.md`, `rules/*.md`,
`scripts/`), which the agent reads on demand. Follow that pattern rather than growing
`SKILL.md`.

## The process-skill pipeline

`using-superpowers` is the entry point: it declares that a relevant skill must be invoked
*before* any response, including clarifying questions, and that **process skills outrank
implementation skills** — a process skill sets the approach, then domain skills
(`frontend-design`, `shadcn`, …) carry it out.

The skills chain into one workflow, and the artifact paths are how they hand off:

```
brainstorming        → docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md
writing-plans        → docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md
executing-plans           (no subagents available)
  or subagent-driven-development (preferred when subagents exist)
                     → .superpowers/sdd/<plan-basename>/  (briefs, reports, ledger)
requesting-code-review / receiving-code-review
finishing-a-development-branch
```

Two invariants in that layout matter:

- The SDD workspace is **per plan**, not flat. A stale ledger at the old flat path
  `.superpowers/sdd/progress.md` gets misread as current progress and makes a controller
  skip whole task sequences.
- The workspace lives in the working tree, not under `.git/`, because Claude Code denies
  agent writes inside `.git/` — which would block an implementer subagent from writing its
  report. A self-ignoring `.gitignore` keeps it out of `git status`.

`systematic-debugging` is the other common process entry point ("fix this bug" →
systematic-debugging first, then domain skills), and `test-driven-development` and
`verification-before-completion` gate implementation and completion respectively.

## Editing gotchas

- **`docx/scripts/office/` and `pptx/scripts/office/` are byte-identical duplicates**
  (`diff -rq` is clean), including the full ECMA/ISO-29500 XSD schema set. A fix to a
  validator, helper, or `soffice.py` must be mirrored into both trees or the two skills
  silently diverge.
- Skills reference each other by `superpowers:<name>` and by relative path
  (`../using-superpowers/references/codex-tools.md`). Renaming or moving a skill directory
  breaks both — grep for the old name across `.agents/skills/` before renaming.
- `using-superpowers/references/` holds per-runtime adaptations (codex, gemini, pi,
  antigravity). Behavior that differs by host runtime belongs there, not inlined into
  individual skills.
- Skills are written to be portable across agent runtimes. Avoid hardcoding Claude
  Code-specific tool names or Windows-only paths into `SKILL.md` bodies.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
