# Testing

Studio ships three test layers. **All results below are from actual executed runs.**

## 1. Static checks

```bash
bunx tsc --noEmit   # strict TypeScript — 0 errors
bun run lint        # eslint (incl. React-Compiler rules) — 0 errors
```

## 2. Unit tests (Vitest)

```bash
bun run test        # 5 files / 36 tests — all passing
```

Coverage focus (pure logic that editors depend on):

- `tests/unit/design-model.test.ts` — DesignDoc creation, JSON round-trip losslessness, id
  uniqueness, element lookup, immutable transforms, chart data linkage
- `tests/unit/history.test.ts` — undo/redo semantics, redo-branch truncation, coalescing,
  depth cap
- `tests/unit/alignment.test.ts` — align-to-selection vs align-to-page, distribution gaps
- `tests/unit/bulk-tokens.test.ts` — `{{token}}` scanning, row application (incl.
  uppercase-aware, image replacement), duplicate detection, missing-value detection
- `tests/unit/brand-kit.test.ts` — conservative kit application + WCAG contrast math

## 3. End-to-end (Playwright)

```bash
E2E_NO_SERVER=1 bunx playwright test   # 12 tests — chromium + mobile — all passing
```

Golden paths verified in a real browser against the running app:

1. App boots to auth (desktop + mobile)
2. Account registration → dashboard
3. Demo sign-in → dashboard
4. Guest → New design (Instagram Post) → canvas editor renders → add text element
5. Template gallery lists seeded templates
6. `/api/health` reports database up

Playwright browsers: `bunx playwright install chromium` (the config also defines a Pixel 7
mobile project covering responsive layout).

## 4. Manual verification performed

- `agent-browser` session: demo login → dashboard → New design → editor → text panel →
  add heading → autosave (`PATCH` persisted `elements: [text]`) → undo enabled
- Collab service smoke test: `mini-services/collab/smoke-test.ts` — 9/9 (join acks,
  presence relay, doc-update relay, no self-echo, leave broadcast, invalid payload rejection)
- Upload security: text file rejected (415), SVG with `<script>` sanitized on round-trip,
  path traversal rejected, unauthenticated upload rejected
- Permission checks: private project cross-user GET → 403; commenter can't PATCH doc → 403

## CI notes

The suites are CI-agnostic (`bun run test`, `bunx playwright test`). Playwright starts its
own dev server unless `E2E_NO_SERVER=1` is set (use it when one is already running).
