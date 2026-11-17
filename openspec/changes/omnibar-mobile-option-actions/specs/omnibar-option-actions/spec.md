# omnibar-option-actions delta

## ADDED Requirements

### Requirement: the omnibar file option carries two actions on mobile
The omnibar option row SHALL render both actions — insert-note-link (`link`) and open-in-floating-window
(`window-restore`) — on every device, mobile included. On mobile they SHALL be rendered without a hover
state, at `font-size: 30px` with `padding: 5px 8px` and `opacity: 1`, and the row SHALL reserve
`padding-right: 96px` so the note name never sits under them.
Source: `client/src/components/OmniBar.component.tsx`, `HtmlOption` (`(hover || mobile)`),
`omnibarPopupCss()` (`.path-option-wrapper.device-mobile`).

#### Scenario: a phone opens the omnibar
- **WHEN** the omnibar is open at a ~400 px width and the user types a note name
- **THEN** each result row shows both icons, always visible, big enough to tap, without a mouse event

#### Scenario: desktop keeps the quiet row
- **WHEN** the same list is rendered at a desktop width
- **THEN** the actions start at `opacity: 0`, reach `opacity: 1` on row hover, and keep their old size

#### Scenario: tapping an action does not open the note
- **WHEN** the user taps the link or the window-restore icon
- **THEN** `e.stopPropagation()` runs first: the note is inserted in the editor, or opened in a floating
  window, and the option is not selected
