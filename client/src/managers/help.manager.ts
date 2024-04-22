import { sharedConfig } from "../../../shared/shared.config"
import { getApi } from "../hooks/api/api.hook"

export const triggerTiroHelpPopup = () => {
    const helpStr = `
<h3>Description</h3>
<p>Tiro Notes version ${sharedConfig.version}</p>

<h3>Shortcuts</h3>
<h4>Interface</h4>
<ul>
    <li>Alt + p : Open Omnibar (or Ctrl + Alt + space)</li>
    <li>Alt + , : Hide/Show Settings</li>
</ul>
<h4>Windows</h4>
<ul>
    <li>Alt + n : New note</li>
    <li>Alt + v : Toggle view of active floating window</li>
</ul>
<h4>Floating Windows</h4>
<ul>
    <li>Alt + Shift + f : New note in a floating window</li>
    <li>Alt + q : Hide/Show All Floating Windows</li>
    <li>Alt + w : Organize Floating Windows</li>
    <li>Alt + Shift + v : Toggle view of active floating window</li>
    <li>Alt + Shift + m : Minimize active floating window</li>
    <li>Alt + Shift + c : Close active floating window</li>
    <li>Alt + o / Alt + Shift + o : Increase/Decrease opacity of active floating window</li>
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