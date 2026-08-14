# crumb_QA_Agentic_Solution

> Playwright + TypeScript regression test suite for [Crumb](https://crumbraise.com/) —
> a B2B SaaS donation management platform. Agentic test generation and execution powered by Claude Code.

---

## What This Repo Does

This repository contains a comprehensive automated QA framework that tests every discoverable
feature of `crumbraise.com` without creating accounts or submitting forms. Tests are organized
by concern, tagged for selective execution, and written using the **Page Object Model (POM)**
design pattern with **TypeScript strict mode**.

Claude Code agents can analyze the live site, generate tests, run smoke checks, and update
visual baselines — all via slash commands.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| [Playwright](https://playwright.dev/) `^1.44` | Browser automation (Chromium, Firefox, WebKit) |
| TypeScript `^5.4` | Strongly-typed test code |
| ESLint + `@typescript-eslint` | Linting |
| Claude Code | Agentic test generation and analysis |
| GitHub Actions | CI/CD — runs tests on every PR |

---

## Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later
- **Git**
- A Claude Code subscription (for agentic features — optional for running tests manually)

---

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/<your-org>/crumb_QA_Agentic_Solution.git
cd crumb_QA_Agentic_Solution

# 2. Install dependencies
npm install

# 3. Install Playwright browsers
npx playwright install --with-deps

# 4. Verify the configuration
cat site.config.json
```

> **SSL note:** `crumbraise.com` may have an expired TLS certificate. The Playwright config sets
> `ignoreHTTPSErrors: true` so tests run against the site regardless. This is expected for a
> QA-only framework — do not disable this flag without first confirming the cert is renewed.

---

## Running Tests

```bash
# All tests
npm test

# By category
npm run test:smoke         # @smoke — site up, title, no JS errors
npm run test:navigation    # @navigation — nav links, routing, mobile menu
npm run test:forms         # @forms — form fields, validation (no submission)
npm run test:visual        # @visual — screenshot regression
npm run test:responsive    # @responsive — layout at breakpoints

# Headed browser (visible browser window, good for debugging)
npm run test:headed

# View HTML report after a test run
npm run report

# TypeScript type-check (no emit)
npm run typecheck

# Lint
npm run lint
```

---

## Project Structure

```
crumb_QA_Agentic_Solution/
├── site.config.json            # Site URL, flags (hasContactForm, skipVisual, etc.)
├── playwright.config.ts        # Browser projects: desktop, mobile, tablet
├── global-setup.ts             # Pre-suite reachability check
├── CLAUDE.md                   # Claude Code instructions (imports AGENTS.md)
├── AGENTS.md                   # AI agent instructions (all tools)
├── SKILLS.md                   # Documentation of slash commands and agents
│
├── src/
│   ├── pages/                  # Page Object Model classes
│   │   ├── base.page.ts        # BasePage — shared helpers
│   │   ├── home.page.ts        # HomePage
│   │   ├── navigation.page.ts  # NavigationPage
│   │   └── contact.page.ts     # ContactFormPage
│   ├── fixtures/
│   │   └── site.fixture.ts     # Custom test fixture (imports page objects)
│   ├── utils/
│   │   ├── link-checker.ts     # HTTP HEAD link checker
│   │   └── visual-helper.ts    # Cookie banner dismissal, screenshot helpers
│   └── types/
│       └── site-config.types.ts # SiteConfig TypeScript interface
│
├── tests/
│   ├── smoke/                  # @smoke tests
│   ├── navigation/             # @navigation tests
│   ├── forms/                  # @forms tests
│   ├── functional/             # @functional tests (business features)
│   ├── visual/                 # @visual tests (screenshot regression)
│   └── responsive/             # @responsive tests (layout breakpoints)
│
├── .claude/
│   ├── agents/                 # Claude Code sub-agent definitions
│   ├── commands/               # Slash command skill files
│   └── hooks/                  # Shell hooks (pre-test validation)
│
└── .github/
    ├── workflows/
    │   ├── ci.yml              # Playwright CI — runs on every PR
    │   └── claude.yml          # Claude Code GitHub Action (@claude mentions)
    ├── ISSUE_TEMPLATE/         # Bug report and test request templates
    ├── PULL_REQUEST_TEMPLATE.md
    └── CODEOWNERS
```

---

## Claude Code Slash Commands

Type these in Claude Code (terminal or IDE) to trigger agentic workflows:

| Command | What it does |
|---------|-------------|
| `/analyze-site` | Crawl `crumbraise.com`, extract structure, update `site.config.json` |
| `/generate-full-suite` | Analyze site + generate complete POM classes and test files |
| `/run-smoke` | Run `@smoke` tests and summarize results |
| `/update-baseline` | Refresh visual regression screenshots after a design change |
| `/generate-report` | Format latest test results as a human-readable summary |

---

## Architecture: Page Object Model

Every page or major site section has a corresponding class in `src/pages/`.
All page classes extend `BasePage` and follow these rules:

- **Locators** are `readonly Locator` properties declared on the class
- **Methods** represent user actions (navigate, click, fill, scroll) — never assertions
- **No `expect()`** inside page objects — assertions belong only in test files
- **Tests** import `{ test, expect }` from `@fixtures/site.fixture` (not from `@playwright/test`)

```typescript
// src/pages/example.page.ts
import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/base.page';
import type { SiteConfig } from '@types/site-config.types';

export class ExamplePage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page, config: SiteConfig) {
    super(page, config);
    this.heading = page.locator('h1').first();
  }

  async scrollToFeatures(): Promise<void> {
    await this.page.locator('[id*="features" i], section').first().scrollIntoViewIfNeeded();
  }
}
```

---

## Contributor Rules

### What you MUST do

- Read `site.config.json` first to get the URL and flags
- Fetch the live site (`WebFetch`) before writing any selectors — use real HTML
- Add new page objects to `src/fixtures/site.fixture.ts`
- Tag every test with at least one: `@smoke`, `@navigation`, `@forms`, `@functional`, `@visual`, `@responsive`
- Run `npx tsc --noEmit` before committing
- Run `npm run lint` before committing

### What you MUST NOT do

- Submit any form
- Create accounts, log in, or enter real credentials
- Hardcode `https://crumbraise.com` in test files — use `siteConfig.url` or `baseURL`
- Put `expect()` assertions inside page object classes
- Use `page.waitForTimeout()` for delays over 500ms
- Use TypeScript `any` without an explicit disable comment explaining why

---

## CI / CD

Tests run automatically on every pull request via `.github/workflows/ci.yml`.

The pipeline:
1. Installs Node dependencies and Playwright browsers
2. Runs `npx tsc --noEmit` (type-check)
3. Runs the full test suite in parallel across Chromium desktop, mobile Chrome, and tablet
4. Uploads the HTML report as a GitHub Actions artifact (kept 14 days)

To trigger Claude Code on a PR, comment `@claude <your request>` on the PR.

---

## Visual Regression Baselines

Visual tests compare screenshots against baselines stored in `__snapshots__/`.
Baselines are committed to the repo and must be updated intentionally:

```bash
# After a confirmed design change:
npm run baseline
git add __snapshots__/
git commit -m "chore: update visual regression baselines"
```

Run `/update-baseline` in Claude Code for a guided workflow.

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `SITE_URL` | `site.config.json → url` | Override the target URL (useful for staging) |
| `CI` | (unset) | When set, enables stricter retries and disables `--headed` |

---

## Known Issues

| Issue | Status | Notes |
|-------|--------|-------|
| SSL certificate expired on `crumbraise.com` | Active | `ignoreHTTPSErrors: true` set in config |
| `expectedNavItems` empty in `site.config.json` | Open | Run `/analyze-site` to populate |
| Visual baselines not yet committed | Open | Run `npm run baseline` after first successful run |
