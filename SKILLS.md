# SKILLS.md — Claude Code Skills & Slash Commands

This file documents the slash commands and agent skills available in this repository.
Skill definition files live in `.claude/commands/` and `.claude/agents/`.

> **How skills work:** Type `/skill-name` in Claude Code to invoke a skill. Claude Code reads the
> corresponding `.claude/commands/<skill-name>.md` file and executes the instructions.
> Some skills can also be auto-invoked by Claude when it determines they are relevant.

---

## Available Slash Commands

### `/analyze-site`

**File:** `.claude/commands/analyze-site.md`

Crawls the live website at the URL in `site.config.json` and produces a fully-populated config.

**What it does:**
- Navigates to the site and waits for network idle
- Extracts all navigation links, headings, CTAs, and form elements
- Checks for contact forms at `/contact`, `/contact-us`, `/get-in-touch`
- Infers industry from page copy
- Detects auth-gating, SPA patterns, and redirect chains
- Outputs an updated `site.config.json` and an issues checklist

**When to use:** When onboarding a new site, or after a major redesign to verify config accuracy.

---

### `/generate-full-suite`

**File:** `.claude/commands/generate-full-suite.md`

Analyzes the live website and generates a complete POM + test suite tailored to the site's actual HTML.

**What it does:**
1. Runs `/analyze-site` to inspect the live site
2. Creates or updates page object classes in `src/pages/`
3. Generates spec files in `tests/smoke/`, `tests/navigation/`, `tests/forms/`, `tests/functional/`, `tests/visual/`, `tests/responsive/`
4. Adds the new page objects to `src/fixtures/site.fixture.ts`
5. Runs `npx tsc --noEmit` to verify clean compile

**When to use:** After onboarding a new site or when test coverage needs a full refresh.

---

### `/run-smoke`

**File:** `.claude/commands/run-smoke.md`

Runs the `@smoke` test suite and reports results.

**What it does:**
- Executes `npm run test:smoke`
- Captures pass/fail counts and any error messages
- Summarizes the results in a human-readable format
- Flags any critical failures

**When to use:** Quick health check before a deployment or after a site update.

---

### `/update-baseline`

**File:** `.claude/commands/update-baseline.md`

Refreshes visual regression baseline screenshots after intentional design changes.

**What it does:**
- Runs `npm run baseline` (`playwright test --grep @visual --update-snapshots`)
- Reports which snapshots were updated
- Notes the viewport/project each snapshot covers

**When to use:** After a confirmed design change that you want to accept as the new baseline.

---

### `/generate-report`

**File:** `.claude/commands/generate-report.md`

Generates a formatted test results summary from the latest Playwright run.

**What it does:**
- Reads `test-results/results.json`
- Generates a markdown summary with pass/fail breakdown by tag and browser
- Lists any failing tests with their error messages

**When to use:** After a full test run to share results with stakeholders.

---

## Available Agents

Agents are specialized sub-agents that Claude Code can spawn for complex, focused tasks.
Agent definitions live in `.claude/agents/`.

### `site-analyzer`

**File:** `.claude/agents/site-analyzer.md`

Crawls a live website and produces a valid `site.config.json`.

**Invoked by:** The `/analyze-site` command and `/generate-full-suite`.

**Capabilities:**
- Navigate URLs with headless browser
- Inspect DOM: text content, attributes, element counts
- Follow redirects and identify canonical URL
- Dismiss cookie consent banners
- Handle SPAs (waits for `networkidle` + hydration)
- Set viewport for mobile/tablet/desktop inspection

---

### `test-generator`

**File:** `.claude/agents/test-generator.md`

Reads a populated `site.config.json` and generates site-specific Playwright test files.

**Invoked by:** The `/generate-full-suite` command.

**Output:** TypeScript spec files in `tests/custom/<scenario-name>.spec.ts`.

**Conventions:**
- Starts each file with a JSDoc comment explaining what is tested and why it's site-specific
- Tags all tests with `@custom` plus any applicable standard tag
- Follows strict TypeScript (no implicit `any`)
- Does not submit any forms

---

## Hooks

Hooks are shell scripts that run automatically at Playwright lifecycle events.

| Hook file | Trigger | Purpose |
|-----------|---------|---------|
| `.claude/hooks/pre-test.sh` | Before test run | Validates `site.config.json` is present and well-formed |

---

## Adding a New Skill

1. Create `.claude/commands/<skill-name>.md`
2. Write instructions in plain markdown describing what Claude should do step-by-step
3. Add an entry to this file under "Available Slash Commands"
4. Test by typing `/<skill-name>` in Claude Code

For skills that need supporting files (scripts, schemas), create a directory:
`.claude/skills/<skill-name>/SKILL.md` with supporting files alongside it.

---

## Claude Code Rules Directory

Path-scoped rules in `.claude/rules/` load automatically when Claude works with matching files:

| File | Applies to | Content |
|------|-----------|---------|
| (none yet) | — | Add rules here as the project grows |

To add a rule:
```markdown
<!-- .claude/rules/testing.md -->
---
paths:
  - "tests/**/*.spec.ts"
---
# Test File Rules
- Always import from @fixtures/site.fixture, not @playwright/test directly
- Tag every test with at least one test category tag
```
