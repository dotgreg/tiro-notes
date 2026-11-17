# Omnibar option actions are visible and big on mobile

## Why
On the phone (tiro notes in Termux) the omnibar file options carry two actions: the link icon
("insert note link in the current note") and the window-restore icon ("open note in a floating window").
`HtmlOption` renders them only when `hover` is true, and `hover` is set by `onMouseEnter`/`onMouseLeave`.
A phone never fires a mouse enter on an option row, so on mobile the two actions never exist in the DOM,
and the user cannot insert a note link or open a note in a popup from the omnibar at all.
When they do appear (desktop) they are grey glyphs at the row's own font size, then scaled 0.8 by `Icon2`:
no usable tap target.

## What changes
| File | Change |
|---|---|
| `client/src/components/OmniBar.component.tsx` | `HtmlOption` renders the actions when `hover` is true OR the device is mobile (`const mobile = deviceType() === "mobile"`) |
| same file, `omnibarPopupCss()` | new `.path-option-wrapper.device-mobile` block: `opacity: 1` on every action, `padding: 5px 8px`, `font-size: 30px` on `.icon-2-wrapper`, `padding-right: 96px` on the wrapper so the note name never sits under the icons |

## What does not change
Desktop behaviour is untouched: actions still fade in on row hover (`opacity: 0` → `1`), same size, same
`margin-left: 8px`. The click handlers, `getApi` calls (`insertText`, `floatingPanel.create`), the search
result options (no actions), and the mobile preview panel (`deviceType() !== "mobile"`) are untouched.

## Impact and risk
Risk: on a ~400 px screen the option row loses 96 px of text width. Handled: `.path-option-wrapper` keeps
`word-break: break-word`, so long note names wrap under the reserve instead of overflowing.
Verified in `client/src/components/__tests__/omnibarMobileActions.test.ts`: both rules survive the real
emotion/stylis compile at 400 px width, and the desktop hover rules survive at 1200 px.
