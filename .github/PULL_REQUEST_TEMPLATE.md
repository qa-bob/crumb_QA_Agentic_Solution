# Pull Request

## Summary

<!-- What does this PR add, fix, or change? 1-3 sentences. -->

## Type of Change

- [ ] New tests (new spec file or new `test()` blocks)
- [ ] Page object update (new page class or updated locators/methods)
- [ ] Bug fix (test was failing or producing false results)
- [ ] Visual baseline update (`__snapshots__/` changes)
- [ ] Config / infrastructure (playwright.config.ts, package.json, CI, etc.)
- [ ] Documentation (README, AGENTS.md, SKILLS.md, CLAUDE.md)

---

## Test Checklist

- [ ] All new tests are tagged (`@smoke`, `@navigation`, `@forms`, `@functional`, `@visual`, and/or `@responsive`)
- [ ] No form submissions — tests only interact with fields, they do not submit
- [ ] No hardcoded `https://crumbraise.com` URLs — tests use `siteConfig.url` or `baseURL`
- [ ] No `expect()` calls inside page object classes
- [ ] No `page.waitForTimeout()` over 500ms
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] `npm run lint` passes with no errors

## Tests Run Locally

<!-- Which test commands did you run? Paste a short summary of results. -->

```
npm run test:smoke       → X passed, Y failed
npm run test:navigation  → X passed, Y failed
```

## Visual Baselines

- [ ] No visual test changes — baselines unchanged
- [ ] Visual changes are intentional — baselines updated with `npm run baseline` and committed

## Reviewer Notes

<!-- Anything the reviewer should pay special attention to? -->
