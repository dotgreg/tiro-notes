import { sharedConfig } from "../../../shared/shared.config"
import { getApi } from "../hooks/api/api.hook"

export const triggerTiroHelpPopup = () => {
    const helpStr = `
<h3>Introduction</h3>
<p>Tiro Notes ${sharedConfig.version}</p>

<h3>Shortcuts</h3>
<ul>
    <li>Ctrl + Alt + Space - Open Omnibar</li>
    <li>Alt + H - Hide/Show floating windows</li>
</ul>

<h3>Documentation</h3>
<ul>
    <li><a href="https://tiro-notes.org" target="_blank"> tiro-notes.org </a></li>
</ul>
</p>
`
const cssStr = `
h1 {
    color: #ff0000;
}
`
    getApi(api => {
       api.popup.show(helpStr, "Tiro Notes Help", () => {}, {cssStr})
    })
}