# Tasks

## 1. Render the actions without hover on mobile
- [x] 1.1 `const mobile = deviceType() === "mobile"` in `HtmlOption`
- [x] 1.2 `{(hover || mobile) && <div className="actions">` (desktop still hover-only)

## 2. Make them big and always visible on mobile
- [x] 2.1 `.path-option-wrapper.device-mobile .actions .action { opacity: 1; padding: 5px 8px; }`
- [x] 2.2 `... .action .icon-2-wrapper { font-size: 30px; }` (before: the row's inherited font size,
      then Icon2's `scale(0.8)`, so a small grey glyph and no tap target)
- [x] 2.3 `.path-option-wrapper.device-mobile { padding-right: 96px; }` so the name never goes under the icons

## 3. Check it
- [x] 3.1 `npx jest src/components/__tests__/omnibarMobileActions.test.ts` → 2 passed
- [x] 3.2 `npx tsc --noEmit -p tsconfig.json` in `client/` → no error
- [x] 3.3 full client suite `npx jest --watchAll=false` → 23 suites pass, 1 pre-existing failure
      (`src/hooks/api/__tests__/api.test.tsx`, needs the dev server; fails the same on the stashed tree)
- [ ] 3.4 open the omnibar on the phone at ~400 px and tap both icons — NOT RUN here: no browser and no
      device on this box, and the change is not published yet
