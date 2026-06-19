# Code Context

## Files Retrieved

1. `plugins/timer/timer.plugin.js` (lines 1-65) — Plugin definition, configuration schema, and entry points for bar/tag/background/backend modules
2. `plugins/timer/timer.bg.js` (lines 1-49) — Background cron script (~60s interval), notification with countdown bar, end-sound playback
3. `plugins/timer/timer.lib.js` (lines 1-143) — Core timer library (start/stop/log timer, history management, timeline logging)
4. `plugins/timer/timer.bar.js` (lines 1-175) — Bottom bar UI, options generation, stats display
5. `client/src/managers/audio.manager.ts` (lines 1-70) — `tiroApi.audio.play()` and `tiroApi.audio.stop()` implementation
6. `client/src/managers/plugin.manager.ts` (lines 1-97) — Background plugin cron execution, `evalPluginCode` with parameter injection
7. `client/src/hooks/api/plugin.api.hook.tsx` (lines 1-165) — Plugin API types, `iPluginConfig`, `iPluginDescription`, marketplace fetching
8. `client/src/components/settingsView/generatePluginsMarketplaceHtml.js` (lines 1-160) — Plugin configuration UI rendering (checkbox/text fields)
9. `client/src/components/settingsView/pluginsMarketplacePopup.component.tsx` (lines 1-75) — Marketplace popup with `onSettingChange` callback
10. `plugins/calendar/calendar.bg.js` (lines 1-60) — Reference bg plugin showing `tiroApi.audio.play()` with callback pattern

## Key Code

### Audio API (no looping support)
`client/src/managers/audio.manager.ts` (lines 7-44):
```ts
const playAudio = (mp3Path: string, opts?:{
    cache?:boolean,
    start?:number
    time?:number
}) => {
    getApi(api => {
        api.ressource.fetch(mp3Path, (content, localPath) => {
            audioCurr.obj = new Audio(localPath);
            audioCurr.obj.load();
            audioCurr.obj.play();
            // ...
        }, {returnsPathOnly: true, disableCache: !cache})
    })
}
```
- **No looping support** — creates a single `Audio` element, calls `.play()` once
- Single global `audioCurr.obj` — concurrent plays overwrite each other
- Options `start` and `time` exist but are commented out (not functional)

### Timer BG sound playback (end-of-countdown only)
`plugins/timer/timer.bg.js` (lines 44-48):
```js
// last notif with sound
if (p.diff < 0) {
    // ... completion notification
    if (p.diff > - (60 * 60 * 1000)) tiroApi.audio.play("https://assets.mixkit.co/active_storage/sfx/2344/2344.wav")    
    return s.isEnabled = false
}
```
- Plays a **hardcoded** Mixkit WAV URL on timer completion
- Does NOT read `timer-sound` or `timer-custom-sound-url` config values
- Only plays once when timer expires (diff < 0)

### Plugin Configuration Schema
`plugins/timer/timer.plugin.js` (lines 15-18):
```js
configuration: [
  {type: "checkbox", id:"timer-sound", description: "At the end of the countdown, play a sound"},
  {type: "text", id:"timer-custom-sound-url", description: "Sound to be played at the end of the countdown, should be an absolute link and a mp3 like: <br/> http://website.com/mymp3.mp3 "}
]
```
- Supports `checkbox` and `text` field types
- Each field has `type`, `id`, `description`

### Plugin Config Storage (NOT YET IMPLEMENTED)
`client/src/components/settingsView/pluginsMarketplacePopup.component.tsx` (line 27):
```ts
onSettingChange: (p) => {console.log("onSettingChange", p)}
```
- **Critical finding**: `onSettingChange` only logs to console — plugin configuration values are **NOT persisted or stored anywhere**
- Configuration UI is rendered by `generatePluginsMarketplaceHtml.js` (checkboxes/text inputs work) but values are lost on reload
- No mechanism exists for bg plugins to read `timer-sound` or `timer-custom-sound-url` at runtime

### BG Plugin Execution
`client/src/managers/plugin.manager.ts` (line 92):
```ts
evalPluginCode(p, {tiroApi:api, bgState:state})
```
- BG plugins receive `tiroApi` and `bgState` as injected parameters
- `config` object in bg.js comes from the `fetchEval` call in plugin definition (e.g., `{libUrl, disableCache}`)
- BG plugins can access `tiroApi.userSettings` through the injected `tiroApi`

### BG Plugin Config Pattern
`plugins/calendar/calendar.bg.js` (lines 5-7):
```js
let disableCache = (config.disableCache === "true" || config.disableCache === true) ? true : false
tiroApi.ressource.fetchEval(config.libUrl, {tiroApi}, {disableCache: disableCache}, () => { ... })
```
- `config` in bg.js = whatever is passed in `fetchEval` from the plugin definition
- To add new config values, pass them in the `config` object of the plugin definition's `fetchEval` call

## Architecture

```
timer.plugin.js (plugin definition)
  ├── plugin_infos.configuration → defines UI fields (checkbox, text)
  ├── timer.bar.js → bottom bar UI, stats, start/stop/log actions
  ├── timer.ctag.js → custom tag rendering
  ├── timer.bg.js → background cron (~60s), notifications, end-sound
  └── timer.lib.js → shared logic (startTimer, stopTimer, logTimer, history)

Audio flow:
  timer.bg.js → tiroApi.audio.play(url) → audio.manager.ts → new Audio(localPath).play()

Plugin config flow (current):
  plugin_infos.configuration → marketplace popup renders fields → onSettingChange logs only (NOT stored)

Plugin config flow (needed):
  plugin_infos.configuration → marketplace popup → persist to userSettings → bg plugin reads from tiroApi.userSettings.get()
```

## Existing Sound Assets
- **No .mp3 or .wav files** found in the project
- End-sound uses a **remote CDN URL**: `https://assets.mixkit.co/active_storage/sfx/2344/2344.wav`
- Calendar plugin also uses Mixkit CDN: `https://assets.mixkit.co/active_storage/sfx/2870/2870.wav`

## Key Findings for Tictac Feature

1. **Audio API**: `tiroApi.audio.play()` plays once, no looping. For tictac, call once per notification interval (~60s).
2. **No bundled sounds**: All sounds use remote CDN URLs. No local audio assets exist.
3. **Config values not accessible at runtime**: Plugin configuration fields render in the marketplace popup but values are NOT persisted. Either:
   - Extend the config persistence system (use `userSettings`)
   - Pass values via `bgState.vars` (timer.bg.js already uses `bgState.vars` for `isEnabled`)
   - Hardcode a default URL (like the current end-sound)
4. **Bg plugin interval**: `background_exec_interval_in_min: 0.01` (~600ms) but effective ~60s due to 1-minute cron in plugin.manager.ts
5. **Notification timing**: `timer.bg.js` emits notification every execution with `hideAfter: 65` (seconds)

## Start Here
`plugins/timer/timer.bg.js` — This is where tictac sound playback would be added. The notification emission loop (line 42) is the insertion point for tictac sound.

## Clarifying Questions for User

**Q1: Tictac sound source?**
- (a) User provides their own URL like end-sound config (new config field)
- (b) Include a default tictac MP3 bundled in plugin folder
- (c) Use a free CDN sound URL as default (like current Mixkit approach)

**Q2: Tictac frequency?**
- (a) Every notification update (~60s based on bg cron interval)
- (b) Every minute countdown tick (would require more frequent bg execution)
- (c) Configurable interval

**Q3: Config structure?**
- (a) Add separate checkbox+text fields (`timer-tictac-sound` checkbox + `timer-tictac-sound-url` text)
- (b) Reuse existing `timer-sound` checkbox to also enable tictac
- (c) Single checkbox toggle only, no custom URL
- Note: Plugin config persistence needs to be implemented first (currently `onSettingChange` only logs)
