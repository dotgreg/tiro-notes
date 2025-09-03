import { sharedConfig } from "../../../shared/shared.config"
import { getApi } from "../hooks/api/api.hook"

export const triggerTiroHelpPopup = () => {
    const helpStr = `
<h3>Description</h3>
<p>Tiro Notes version ${sharedConfig.version}</p>

<h3>Shortcuts</h3>
<h4>Interface</h4>
    <ul>
    <li>Alt + , : Hide/Show Settings</li>
    </ul>
<h4>Other</h4>
    <ul>
    <li>Alt + s : stop AI generation</li>
    </ul>
<h4>OmniBar</h4>
    <ul>
    <li>Alt + p : Open Omnibar (or Ctrl + Alt + space)</li>
    <li>Alt + enter : Open Omnibar current selection in new floating window</li>
    </ul>
<h4>Windows</h4>
<ul>
    <li>Alt + n : New note</li>
    <li>Alt + v : Toggle view of active window</li>
    <li>Alt + d : Detach active window in floating window</li>
    <li>Alt + e : Toggle Encryption</li>
    <li>Alt + u : Upload a file</li>
</ul>
<h4>Floating Windows</h4>
<ul>
    <li>Alt + Shift + f : New note in a floating window</li>
    <li>Alt + q : Hide/Show All Floating Windows</li>
    <li>Alt + w : Toggle Floating Windows layouts</li>
    <li>Ctrl + (Shift) + directional arrow : Change active floating window position </li>
    <li>Alt + shift + w : Re-organize Floating windows from current layout</li>
    <li>Alt + Shift + v : Toggle view of active floating window</li>
    <li>Alt + Shift + a : Minimize active floating window</li>
    <li>Alt + Shift + s : Unminimize first floating window in the bar</li>
    <li>Alt + Shift + r : Reload active floating window</li>
    <li>Alt + Shift + c : Close active floating window</li>
    <li>Alt + Shift + e : Toggle encryption</li>
    <li>Alt + Shift + u : Upload a file</li>
    <li>Alt + o / Alt + Shift + o : Increase/Decrease opacity of active floating window</li>
</ul>

<h3>Documentation</h3>
<ul>
    <li><a href="https://tiro-notes.org" target="_blank"> tiro-notes.org </a></li>
</ul>

<h4>left bar shortcuts</h4>
<p> You can add shortcuts links on the left bar by creating a /.tiro/shortcuts.md note and enabling the functionality in the settings </p>

<h4>snippets</h4>
<p> You can add editor shortcuts by typing "--". Add shortcuts in /.tiro/snippets.md (create a note if it does not exists) </p>

</p>
<code>
	<pre>
    sym_like_love| 👍
    sym_book_red| 📕 
    sym_.vecteur_arrow_right | →
    sym_alpha | α
    sym_beta | β
    tdcal0 | - [ ] [ev|TODO|\${new Date().toLocaleString("fr").split(" ")[0]} 14:00|]
    daysDiff | \${Math.floor(   (new Date() - new Date("11/23/23") ) / (1000 * 60 * 60 * 24)) }
    cop_code_python | \`\`\`python \\n \\n \\n \`\`\`

	</pre>
</code>

<h4>forms</h4>
<p> 
You can create forms by referencing them in /.tiro/forms.md (create a note if it does not exists), one form for each line<br>
{{_datetime}} and {{_date}} will automatically insert the date <br>
the line_format is used to format the line in the note<br>
you can insert tags in it like: {{NAME_FIELD|TYPE_FIELD (text, number, select, date) | COMMENT FIELD comment field. optional}}<br>
In the comment field, adding "optional" will make the field optional<br>
the line parameter is where the content should be inserted, if negative it will be inserted counting starting the end of the note<br>
</p>
<code>
	<pre>
    form | name=simple insert form, path=/noteToInsert.md, line_format= {{_datetime}} | name: {{name}} | age: {{age|number|comment field. optional}}, line=2
    form | name=🎬 add youtube chanel, path=/_new/_main/📺YUTB3.md, line_format= {{chanel_name}} | @{{chanel_name}} | {{tags|select:_🍿 docus,_🗿 histoire, _🧠 psy,  _✨ quali, _⛰️ trip,  _🗳️ polit,  _🗳️ polit, _🏛️ architect, _💲econo,  _😄fun,  _🛠️diy}} | {{number_import|number}}, line=3
	</pre>
</code>
then simply call [[forms]] [[forms]] on a note to get access to all your forms


</p>
`
const cssStr = `
h1 {
    color: #ff0000;
}
.popup-wrapper  {
    height: 80%;
}
.popupContent {
    overflow-y: auto;
}
`
    getApi(api => {
       api.popup.show(helpStr, "Tiro Notes Help", () => {}, {cssStr})
    })
}