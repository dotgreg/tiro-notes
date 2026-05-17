# Plugin Development Rules

## Overview

A plugin in tiro-notes is a modular extension that adds functionality to the system. There are two primary plugin tiers:

1. **CTAG-only plugins** (like `calc`, `spreadsheet`) - Single `.ctag.js` file that renders inline in notes using `[[tagname]]` delimiters
2. **Full plugins** (like `timer`, `calendar`) - Have a `.plugin.js` manifest that registers entries for tag, bar, background, or backend services

All plugins must reside in the `/plugins/` directory and follow consistent naming and structural conventions.

## Plugin Tiers

### CTAG-only Plugins
- Single file: `<name>/<name>.ctag.js`
- No `.plugin.js` manifest
- Cannot be auto-discovered by the server
- Cannot be listed in marketplace
- Simplest plugin type to create
- Examples: `calc`, `spreadsheet`, `epub`, `forms`, `pdf`, `proofread`, `smartlist`, `timeline`, `web`

### Full Plugins
- Have a `.plugin.js` manifest that declares plugin entries
- Can be auto-discovered by the server
- Listed in the marketplace
- Support multiple entry types: tag, bar, background, backend
- Examples: `timer`, `calendar`, `datatable`, `feed`, `graph`, `map`, `weather`

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

## Host API Reference

Access the host system through `window.api`:

- `api.utils.createDiv()` - Creates placeholder div and updateContent closure
- `api.utils.loadRessources(urls, callback)` - Load JS/CSS files with caching
- `api.utils.loadScripts(urls, callback)` - Load JS files only
- `api.utils.resizeIframe(size)` - Resize iframe container
- `api.utils.uuid()` - Generate unique ID
- `api.utils.loadCustomTag(url, innerTag, opts)` - Load another ctag
- `api.call(methodName, args, callback)` - Call host system APIs
- `api.cache.get(id, callback)` / `api.cache.set(id, content, ttl)` - Cache API

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

Full plugins require a `.plugin.js` manifest that returns an array of plugin entries:

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

## Marketplace Registration

Full plugins are listed in `marketplace.json`:
```json
{
  "name": "myplugin",
  "pluginPath": "/myplugin/myplugin.plugin.js",
  "description": "Description with <br/> HTML",
  "versions": [{ "version": "0.1.0", "date": "DD/MM/YY", "comment": "Initial" }],
  "images": [],
  "icon": "https://example.com/icon.png",
  "configuration": [
    { "type": "checkbox", "id": "feature-toggle", "description": "Enable feature" }
  ]
}
```

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