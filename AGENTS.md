# AGENTS.md — AI Agent Instructions for crumb_QA_Agentic_Solution

This file is read by AI coding agents (GitHub Copilot, Devin, Cursor, OpenAI Codex, etc.).
Claude Code reads `CLAUDE.md` instead; that file imports this one and adds Claude-specific instructions.

---

## Repo Purpose

Playwright + TypeScript regression test suite for [Crumb](https://crumbraise.com/) — a B2B SaaS donation
management platform. Tests cover smoke, navigation, forms, functional, visual, and responsive scenarios
using the **Page Object Model (POM)** design pattern and **OOP** principles.

**Target site:** `https://crumbraise.com`  
**SSL note:** The site's certificate may be expired; `ignoreHTTPSErrors: true` is set in `playwright.config.ts`.

---

## Architecture

```
site.config.json          ← Single source of truth for site URL and flags
playwright.config.ts      ← Browser projects (desktop, mobile, tablet)
src/
  pages/                  ← POM classes — one per page/section (extend BasePage)
  fixtures/site.fixture.ts← Custom test fixture; all tests import from here
  utils/                  ← Shared helpers (link checker, visual helper)
  types/                  ← TypeScript interfaces
tests/
  smoke/                  ← @smoke — site up, title, no JS errors
  navigation/             ← @navigation — nav links, routing, mobile menu
  forms/                  ← @forms — field presence, validation (no submission)
  functional/             ← @functional — business features, CTAs, content
  visual/                 ← @visual — screenshot regression
  responsive/             ← @responsive — layout at breakpoints
.claude/
  agents/                 ← Claude Code sub-agent definitions
  commands/               ← Slash command skill files
  hooks/                  ← Shell hooks (pre-test validation)
```

---

## Non-Negotiable Rules

| Rule | Why |
|------|-----|
| Never submit any form | Avoids sending real data to third-party endpoints |
| Never create an account or log in | Site is public; `auth.required: false` in config |
| Never hardcode `https://crumbraise.com` in tests | Use `siteConfig.url` or Playwright's `baseURL` |
| No `expect()` inside page object classes | Assertions belong only in test files |
| No `page.waitForTimeout()` (>500ms) | Use Playwright auto-waiting or `waitForSelector` |
| No `any` type without a `// eslint-disable` comment explaining why | Strict TypeScript mode |
| Run `npx tsc --noEmit` before finishing | Ensures clean compile |

---

## How to Run Tests

```bash
# Install
npm install
npx playwright install --with-deps

# Run all tests
npm test

# Run by tag
npm run test:smoke
npm run test:navigation
npm run test:forms
npm run test:visual
npm run test:responsive

# Run with headed browser (debugging)
npm run test:headed

# Update visual regression baselines
npm run baseline

# TypeScript check
npm run typecheck

# Lint
npm run lint
```

---

## Writing Page Objects

Every page or major section gets its own class in `src/pages/`:

```typescript
// src/pages/example.page.ts
import { type Locator } from '@playwright/test';
import { BasePage } from '@pages/base.page';

export class ExamplePage extends BasePage {
  readonly heading: Locator;
  readonly ctaButton: Locator;

  constructor(page: Page, config: SiteConfig) {
    super(page, config);
    this.heading = page.locator('h1').first();
    this.ctaButton = page.getByRole('link', { name: /get started/i }).first();
  }

  async clickCTA(): Promise<void> {
    await this.ctaButton.click();
  }
}
```

Rules:
- Extend `BasePage` from `@pages/base.page`
- Locators are `readonly Locator` class properties
- Methods represent actions (navigate, click, fill, scroll) — NOT assertions
- No `expect()` calls inside page objects

---

## Writing Tests

```typescript
// tests/functional/example.spec.ts
import { test, expect } from '@fixtures/site.fixture';

test.describe('Example Feature @functional', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.navigate();
  });

  test('hero heading is visible @functional', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible();
  });
});
```

Rules:
- Import `{ test, expect }` from `@fixtures/site.fixture` (not `@playwright/test`)
- Tag every test with at least one: `@smoke`, `@navigation`, `@forms`, `@functional`, `@visual`, `@responsive`
- Use `siteConfig.url` instead of hardcoded URLs
- Keep each test independent (no shared state between tests)

---

## Adding a New Page to the Fixture

1. Create `src/pages/<name>.page.ts`
2. Add it to `src/fixtures/site.fixture.ts`:
   - Import the class
   - Add a property to the `Fixtures` interface
   - Add the fixture setup in `test.extend<Fixtures>({ ... })`
3. Run `npx tsc --noEmit` to verify types

---

## TypeScript Path Aliases

Configured in `tsconfig.json`:

| Alias | Resolves to |
|-------|-------------|
| `@pages/*` | `src/pages/*` |
| `@fixtures/*` | `src/fixtures/*` |
| `@utils/*` | `src/utils/*` |
| `@site-types/*` | `src/types/*` |

---

## Test Tags Reference

| Tag | When to use |
|-----|-------------|
| `@smoke` | Site loads, title present, no console errors |
| `@navigation` | Nav links, routing, menus, breadcrumbs |
| `@forms` | Form fields, validation, accessibility |
| `@functional` | Business features: CTAs, sections, content, flows |
| `@visual` | Screenshot regression with `toHaveScreenshot()` |
| `@responsive` | Viewport-specific layout checks |
| `@custom` | Site-specific tests that don't fit other categories |

---

## Site Config Flags

| Flag | Effect |
|------|--------|
| `hasContactForm: true` | Enables form tests |
| `skipVisual: false` | Visual regression tests run |
| `skipForms: false` | Form tests run |
| `auth.required: false` | No login needed; do not attempt authentication |

---

## Known Issues

- SSL certificate for `crumbraise.com` may be expired — `ignoreHTTPSErrors: true` is set in Playwright config
- `expectedNavItems` is currently empty in `site.config.json`; run `/analyze-site` to populate it
- Visual baselines must be regenerated after any intentional design change: `npm run baseline`
