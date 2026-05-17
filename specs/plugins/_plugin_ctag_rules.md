# Plugin Development Rules

## Overview

A plugin in tiro-notes is a modular extension that adds functionality to the system. Plugins are composed of different component types that can be combined:

- **ctag** - Custom tag rendering inline in notes (`<name>.ctag.js`)
- **bar** - Sidebar/toolbar widget (`<name>.bar.js`) 
- **bg** - Background service running on interval (`<name>.bg.js`)
- **backend** - Server-side API endpoint (`<name>.backend.js`)
- **lib** - Shared library for plugin parts (`<name>.lib.js`)
- **plugin** - Registration manifest that ties parts together (`<name>.plugin.js`)

All plugins must reside in the `/plugins/` directory and follow consistent naming and structural conventions.

## Getting Started

To create a new plugin:
1. Create a new directory under `/plugins/` with your plugin name
2. For CTAG-only plugins: create `<plugin-name>/<plugin-name>.ctag.js`
3. For full plugins: create `<plugin-name>/<plugin-name>.plugin.js` and other component files
4. Reference this specification for implementation details

## Plugin Component Types

Plugins can be composed of several different component types:

1. **ctag** - Custom tag rendering inline in notes via `[[tagname]]` delimiters
2. **bar** - Sidebar/toolbar widget that appears in the sidebar
3. **bg** - Background service that runs periodically on an interval
4. **backend** - Server-side API endpoint for backend processing
5. **lib** - Shared library code reused by other plugin components
6. **plugin** - Registration manifest that declares plugin entries and ties components together

A plugin can be as simple as a single `.ctag.js` file or as complex as a combination of all component types. The `.plugin.js` manifest is what registers it with the system and enables discovery.

## File Structure & Naming

Plugin directories follow this pattern:
```
/plugins/
└── <plugin-name>/
    ├── <plugin-name>.ctag.js    (CTAG component)
    ├── <plugin-name>.plugin.js   (Full plugin manifest)
    ├── <plugin-name>.lib.js      (Shared library)
    ├── <plugin-name>.bar.js      (Sidebar component)
    ├── <plugin-name>.bg.js       (Background service)
    ├── <plugin-name>.backend.js  (Backend API)
    └── _common/                  (Shared utilities)
```

### Directory Requirements
- Plugin directory name must match the plugin name used in `[[tagname]]` delimiters
- All plugin files must be placed in the same directory
- The directory must be located directly under `/plugins/`
- Use lowercase kebab-case naming (e.g., `my-plugin`, `data-table`)

## CTAG Entry Point Contract

Every CTAG plugin **must** set `window.initCustomTag` to its main function:

```javascript
window.initCustomTag = myCtagApp
```

The host system (iframe.manager.ts) will call this function after loading the script:
```javascript
let htmlStr = window.initCustomTag(`${innerTag}`, opts)
```

If `window.initCustomTag` is not set, the system retries 3 times with cache disabled.

### Important Notes:
- The function name can be anything, but must be assigned to `window.initCustomTag`
- The function must return a DOM element immediately (synchronous)
- The function must accept exactly two parameters: `(innerTagStr, opts)`
- The host system handles all iframe management and rendering

## Function Signature

CTAG functions always follow this signature:
```javascript
const myCtagApp = (innerTagStr, opts) => {
    // innerTagStr: Raw text between tag delimiters (e.g., content between [[exec]] and [[exec]])
    // opts: Options object from host system:
    //   - base_url: The plugin's directory URL
    //   - plugins_root_url: Root plugins directory URL  
    //   - size: iframe size (e.g., "100%")
    //   - padding: Whether to add padding wrapper
    //   - Any user-defined options
}
```

### Parameter Details:
- **innerTagStr**: The raw content between the custom tag delimiters in markdown notes
- **opts**: Object containing host-provided configuration options

## Lifecycle Pattern

CTAG plugins follow a 4-phase lifecycle:

1. **Synchronous Setup**: Create a placeholder div and prepare internal state
   ```javascript
   const { div, updateContent } = api.utils.createDiv()
   ```

2. **Immediate Return**: Return the placeholder div synchronously
   ```javascript
   return div
   ```

3. **Asynchronous Loading**: Load dependencies, then update content
   ```javascript
   api.utils.loadRessources([...], () => {
       // Main logic here
       updateContent(renderedHtml)
   })
   ```

4. **Finalize**: Resize iframe to fit content
   ```javascript
   setTimeout(() => {
       api.utils.resizeIframe()
   }, 100)
   ```

### Critical Points:
- The function **must return immediately** with a placeholder div
- All heavy lifting happens asynchronously in callbacks
- Always call `updateContent()` with the final HTML when ready
- Use `api.utils.resizeIframe()` to notify host of content size changes

## Host API Reference

The host system provides access to various APIs through the `window.api` object. These are organized into sub-APIs:

### api.file
- documentation
- getContent
- searchReplace
- insertContent
- saveContent
- delete
- move
- create

### api.upload
- documentation
- uploadFile

### api.ressource
- documentation
- delete
- download
- fetch
- frontendFetch
- fetchEval
- fetchUrlArticle
- scanFolder
- unzipFile
- compressImage
- cleanCache

### api.watch
- documentation
- file
- appStatus
- dev.toggleIsConnected

### api.socket
- documentation
- get

### api.cache
- documentation
- get
- set
- cleanRamCache
- getCachePath
- cleanCache

### api.popup
- documentation
- confirm
- show
- prompt
- form.create
- form.readConfigFromNote
- form.getAll
- form.open

### api.files
- documentation
- get
- getPreviews
- search

### api.folders
- documentation
- get
- move
- create
- delete

### api.tabs
- documentation
- get
- close
- openInNewTab
- reorder
- updateTab
- active.get

### api.userSettings
- documentation
- get
- set
- list
- refresh.css.get
- updateSetupJson
- ifNoFolders_triggerDemoDownload
- triggerSetupPopup
- triggerDemoDownload
- refreshUserSettingsFromBackend

### api.history
- documentation
- save
- intervalSave

### api.note
- documentation (via ui.documentation)
- render
- injectLogic
- chunks.chunk
- chunks.merge
- ui.lineJump.jump
- ui.editorAction.dispatch
- ui.editorAction.get
- ui.editorAction.canExecuteAction

### api.search
- documentation
- files.search
- word
- hashtags
- ui.search
- ui.term.set
- ui.term.get

### api.analytics
- documentation
- log
- report

### api.command
- documentation
- exec
- stream

### api.encryption
- documentation
- encryptText
- decryptText
- encryptUrlParam
- decryptUrlParam

### api.plugins
- documentation
- list
- get
- cronCache.set
- marketplace.fetchList

### api.audio
- play
- stop
- documentation

### api.config
- documentation
- get
- getPlatform
- getSync
- getCustomApiToken

### api.performance
- documentation
- getReport

### api.activity
- documentation
- getReport

### api.ai
- documentation
- search
- exec
- setStatus
- getStatus

### api.shared
- functions.smartTable.getObj
- functions.smartTable.updateString

### api.status
- documentation
- isConnected
- ipsServer.get
- ipsServer.set
- ipsServer.getLocal
- searching.get
- searching.set
- refresh.get
- refresh.set
- refresh.increment

### api.lastNotesApi *(optional)*
- documentation
- getAll
- removeFile
- addToHistory

### api.ui.browser
- documentation
- goTo
- files.set
- files.get
- files.active.set
- files.active.getIndex
- files.active.get
- folders.refreshFromBackend
- folders.base
- folders.get
- folders.clean
- folders.scan
- folders.open.get
- folders.open.add
- folders.open.remove
- folders.current.set
- folders.current.get
- folders.current.getSync

### api.ui.floatingPanel
- documentation
- create
- delete
- panels
- openWebpage
- update
- movePanel
- resizePanel
- deminimizePanel
- minimizePanel
- updatePanelLayout
- openFile
- toggleFile
- updateAll
- actionAll
- refreshFromBackend
- pushWindowOnTop
- movePositioninArray
- updateOrderPosition
- resizeWindowIfOutOfWindow

### api.ui.windows
- documentation
- close
- updateWindows
- getIdsFromFile
- active.get
- active.setContent
- active.toggleView

### api.ui.notification
- documentation
- emit
- notifLog

### api.ui.lightbox
- open
- close

### api.ui.textToSpeechPopup
- open
- getStatus
- close

### api.ui.search
- search
- term.set
- term.get

### api.ui.note
- lineJump.jump
- editorAction.dispatch
- editorAction.get
- editorAction.canExecuteAction

### api.ui.notePreviewPopup
- documentation
- open
- close

## Dependency Loading

Dependencies can be local or CDN-hosted:

```javascript
// Local dependencies (relative to plugin directory)
api.utils.loadRessources([
    `${opts.plugins_root_url}/_common/common.lib.js`,  // Shared library
    `${opts.plugins_root_url}/${pluginName}/lib.js`    // Plugin-specific lib
], () => {
    // Dependencies loaded, use them here
})

// CDN dependencies
api.utils.loadScripts([
    'https://cdn.jsdelivr.net/npm/hyperformula/dist/hyperformula.full.min.js'
], () => {
    // HyperFormula loaded, use it
})
```

Access shared libraries via:
```javascript
const commonLib = window._tiroPluginsCommon.commonLib
```

## CSS/Styling

CSS is embedded as a template string and injected into the rendered HTML:

```javascript
const style = `
<style>
    .my-plugin-class {
        /* Custom styles */
    }
</style>
`

updateContent(`
    <div class="my-plugin-container">
        <!-- Content -->
    </div>
    ${style}
`)
```

Use unique class IDs to prevent conflicts:
```javascript
const classId = `myplugin-${api.utils.uuid()}`
```

## Error Handling

Always wrap main logic in try/catch:
```javascript
try {
    // Main logic
    updateContent(renderedHtml)
} catch(e) {
    // Fallback to error display
    updateContent(`<pre>Error: ${e}</pre>`)
}
```

## Help System

Use the common library's help button generator:
```javascript
const helpText = `<h3>Plugin Help</h3><p>Instructions...</p>`
const helpButton = commonLib.generateHelpButton(helpText, "Plugin Help")
updateContent(`Content ${helpButton}`)
```

## Full Plugin Registration

Full plugins require a `.plugin.js` manifest that declares plugin entries:

```javascript
const plugin_infos = {
    versions: [{ version: "0.1.0", date: "DD/MM/YY", comment: "Initial", hash: "..." }],
    description: "Plugin description",
    images: [],
    icon: null,
    configuration: [
        { type: "checkbox", id: "feature-toggle", description: "Enable feature" },
        { type: "text", id: "custom-setting", description: "Custom setting" }
    ]
}

return [
    {
        name: "myplugin",
        type: "tag", // "tag", "bar", "background", "backend"
        code: `[[script]] window.disableCache=true; return api.utils.loadCustomTag("${baseUrl}myplugin.ctag.js", \`{{innerTag}}\`, {size:"100%", padding:false}) [[script]]`,
        plugin_infos
    }
]
```

The `.plugin.js` manifest:
- Must return an array of plugin entry objects
- Each entry has `name`, `type`, `code`, and `plugin_infos`
- Entry types: `"tag"`, `"bar"`, `"background"`, `"backend"`
- The `code` field uses `[[script]]` wrapper for tag entries
- `{{innerTag}}` placeholder is substituted with user content

## Complete Templates

### Minimal CTAG Template
```javascript
const myCtagApp = (innerTagStr, opts) => {
    if (!opts) opts = {}
    const api = window.api
    const { div, updateContent } = api.utils.createDiv()
    const classId = `myctag-${api.utils.uuid()}`

    api.utils.loadRessources([
        `${opts.plugins_root_url}/_common/common.lib.js`,
        // Add CDN dependencies here
    ], () => {
        const commonLib = window._tiroPluginsCommon.commonLib
        // Main logic here
        try {
            const html = `<div class="${classId}">...</div><style>...</style>`
            updateContent(html)
            setTimeout(() => { api.utils.resizeIframe() }, 100)
        } catch(e) {
            updateContent(`<pre>Error: ${e}</pre>`)
        }
    })

    return div
}
window.initCustomTag = myCtagApp
```

### Full Plugin Template
```javascript
const plugin_infos = {
    versions: [{ version: "0.1.0", date: "DD/MM/YY", comment: "Initial", hash: "..." }],
    configuration: []
}
let disableCache = true
let baseUrl = /* plugin base URL */

return [
    {
        name: "myplugin",
        type: "tag",
        code: `[[script]] window.disableCache=${disableCache}; return api.utils.loadCustomTag("${baseUrl}myplugin.ctag.js", \`{{innerTag}}\`, {size:"100%", padding:false}) [[script]]`,
        plugin_infos
    }
]
```