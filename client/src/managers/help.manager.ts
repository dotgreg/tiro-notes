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
    <li>Alt + / : Open Help</li>
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
    <li>Ctrl + e : Toggle Encryption</li>
    <li>Ctrl + u : Upload a file</li>
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
    <li>Alt + Shift/Ctrl + c : Close active floating window</li>
    <li>Alt + Ctrl + e : Toggle encryption</li>
    <li>Alt + Ctrl + u : Upload a file</li>
    <li>Alt + o / Alt + Shift + o : Increase/Decrease opacity of active floating window</li>
</ul>

<h3>Documentation</h3>
<ul>
    <li><a href="https://tiro-notes.org" target="_blank"> tiro-notes.org </a></li>
</ul>

<h4> Note config</h4>
<code><pre>
- In a note, if you <br>: 
    - add the string "--table", it will format markdown tables <br>
    - add the string "--latex", it will format latex equations <br>
    - add the string "--no-date-picker", it will disable the date picker <br>
    - add the string "--spellcheck", it will enable the native browser spellcheck <br>
</pre></code>


<h4> Plugins </h4>
<p> - Find all available plugins 
<a target="_blank" href="https://github.com/dotgreg/tiro-notes/tree/dev/plugins">here</a></p>
- Some ctags are already loaded by default, find them 
<a target="_blank" href="https://github.com/dotgreg/tiro-notes/blob/master/client/src/managers/ctag.manager.ts">here > baseCtag</a>
or by simply typing "[["
<p> - You can add plugins or create custom ones by creating a /.tiro/plugins/newplugins.md note 
and pasting the content of plugin register, which ends by ".plugin.js" inside it like  
<a target="_blank" href="https://github.com/dotgreg/tiro-notes/blob/dev/plugins/timer/timer.plugin.js">that timer plugin</a> </p>

- there are several kinds of plugins: 
<code><pre>
- ctag plugin: (custom tag) that can be inserted inside a note like 
    - [[epub]]mybook[[epub]] 
    - [[pdf]]mypdf[[pdf]] 
    - [[feed]] myrss.rss | rssName [[feed]]
    - [[feed-yt]] myYoutubeChannel | youtubeChannel [[feed-yt]]
    - etc... (you can find them all installed by simply typing "[[" )
- bar plugin: that can be called inside the omnibar (shift+alt+p) > : (for bar plugins menu)
- background plugin : will run regularly on the client frontend, useful for timer/calendar plugins
- backend function plugin : can be used with the custom backend api (see below)
</pre></code>



<h4>Left bar shortcuts</h4>
<p> You can add shortcuts links on the left bar by creating a /.tiro/shortcuts.md note and enabling the functionality in the settings </p>

<h4>Snippets</h4>
<p> You can add editor shortcuts by typing "--". Add shortcuts in /.tiro/snippets.md (create a note if it does not exists) </p>

</p>
<code>
	<pre>
CONTENT OF /.tiro/snippets.md
===========
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

<h4>Automatic spreadsheet-like table</h4>
<p> by creating lines like #mytableid | col1 | col2 | col3 , you will create an automatic table with the specified columns.</p>
<p> to access to that table, simply click on #mytableid </p>
<br>

<h4>Forms</h4>
<p> 
You can create forms by referencing them in /.tiro/forms.md (create a note if it does not exists), one form for each line<br>

<code><pre>
- {{_datetime}} and {{_date}} will automatically insert the date <br>
- the line_format is used to format the line in the note<br>
- you can insert tags in it like: {{NAME_FIELD|TYPE_FIELD (text, number, select, date) | COMMENT FIELD comment field. optional}}<br>
- In the comment field,<br>: 
    - adding "optional" will make the field optional<br>
    - adding "not_visible" will make the field value not inserted (useful for field used by ai_insert)<br>
    - adding "remember" will keep the last value inputed <br>
    - adding "history" will save answer inputed previously <br>
    - adding "ai_insert: summarize the field [long text]" or "ai_suggest: find from [fullname] the first name" will enable AI suggestions for the field, the [NAME_FIELD] refers to other forms field<br>
        - the AI suggest command for fields should be filled inside the settings <br>
the line parameter is where the content should be inserted, if negative it will be inserted counting starting the end of the note<br>
</pre></code>

</p>
<code>
	<pre>
CONTENT OF /.tiro/forms.md
===========
    form | name=simple insert form, path=/noteToInsert.md, line_format= {{_datetime}} | name: {{name}} | age: {{age|number|comment field. optional remember ai_suggest: guess the age from [name]}}, line=2
    form | name=🎬 add youtube chanel, path=/_new/_main/📺YUTB3.md, line_format= {{chanel_name}} | @{{chanel_name}} | {{tags|select:_🍿 docus,_🗿 histoire, _🧠 psy,  _✨ quali, _⛰️ trip,  _🗳️ polit,  _🗳️ polit, _🏛️ architect, _💲econo,  _😄fun,  _🛠️diy}} | {{number_import|number}}, line=3
	</pre>
</code>
then simply call [[forms]] [[forms]] on a note to get access to all your forms

<h4>Custom Backend Api</h4>
<p>
you can create a custom backend api with custom endpoints in JSON really easily.<br>
<br>

- example of endpoint: https://mytiro:3023/custom_backend_api?file=first-endpoint& param1=hello& param2=world& token=custom_backend_api_token <br>
<br>
- accepts either "function" (will fetch the result of a backend function plugin) or "file" argument (will fetch file at /.tiro/custom_backend_api/first-endpoint.md in our case here).<br>
- you can pass url parameters to the endpoint<br>
- you need to pass the token parameter with the value set in the settings > "Custom backend API Token" <br>
<br>

<h5> A. Example of an file-based api endpoint</h5>
- example of endpoint: https://mytiro:3023/custom_backend_api?file=first-endpoint& param1=hello& param2=world& token=custom_backend_api_token <br>
- it should always ends with a callback function cb()<br>
- you have access to the whole backendApi by "getBackendApi", find all the functions here
- you also have access to the plugin backend functions with the api "getBackendApi().plugins.triggerBackendFunction"
<a about="_blank" href="https://github.com/dotgreg/tiro-notes/blob/dev/server/src/managers/backendApi.manager.ts">here</a> <br/>

<code>
<pre>
CONTENT OF /.tiro/custom_backend_api/first-endpoint.md
========

        content = \`
        HELLO WORLD

        - [ ] dflsakjdflkas
        - [ ] dflsakjdflkas
        - [ ] dflsakjdflkas

        ------------------
        METEO

        ------------------
        \${getBackendApi().test.fntest()}

        \`

        getBackendApi().file.openFile("/_new/_main/feed podcast.md").then(contentExtract => {
            if (contentExtract === "function" ) {
                // you can also call plugin backend functions like that
                getBackendApi().plugins.triggerBackendFunction("timer_get_daily_stats", {params}).then(timerDaily => {
                    cb(content + contentExtract+timerDaily.result.message)
                })
            } else if (contentExtract === "file") {
                // or event access to another endpoint
                getBackendApi().customBackendApi.triggerEndpoint({file:"second-endpoint"}, res => {
                    cb(res.result)
                })
            } else if (contentExtract === "url") {
                // fetch an url and cache it for a month
                let n = new Date()
                let idReq = \`\${n.getYear()}\${n.getMonth()}\`
                let url = \`https://github.com/historicbruno/duckduckgo-html-search?\${idReq}\`
                getBackendApi().ressource.fetchFile(url, {cache:true , cb})
            }
        })




</pre>
</code


</p>

<h5> B. Example of an function-based api endpoint</h5>
- example of endpoint: https://mytiro:3023/custom_backend_api?function=timer_get_daily_stats&param1=hello&param2=world&token=custom_backend_api_token <br>
- to register a new plugin backend Function, add the following inside your plugin declaration in /.tiro/plugins/myplugin.md

<code>
<pre>
EXTRACT OF CONTENT OF /.tiro/plugins/MYPLUGIN.md
===========
...
{
      name: "timer_backend",
      type: "backend",
      code: \`
        getBackendApi().ressource.fetchEval("\${baseUrl}timer/timer.backend.js")
      \`,
      plugin_infos,
      
    }
...
</pre>
</code>


then that js file should return a callback (cb) function that returns an array of declared backend functions like 
<a about="_blank" href="https://github.com/dotgreg/tiro-notes/blob/dev/plugins/timer/timer.backend.js">that file</a>

<h5> Calling the API from tiro notes </h5>
- you can call the custom backend api as follow in tiro client (and in custom tags etc.) <br>
- the "{custom_api_token}" will be replaced with the actual token value (only work for the function api.ressource.fetch)
<code>
<pre>
    api.ressource.frontendFetch(
        "/custom_backend_api?file=first-endpoint&token={custom_api_token}", 
        res => {
            console.log(JSON.parse(res)["result"])
        }, 
        {disableCache:true}
    )
</pre>
</code>

<h4> Page Title </h4>
- you can customize the page title by adding javascript code to the note /.tiro/app-title.md<br>
- you have access to "isMobile()" function if it is true, you can use it to customize the title for mobile devices
- you can access here the whole frontend api <br>
- it should call a callback function "cb" with a string in it <br>
- The title is refreshed every five minute <br>

<code>
<pre>
CONTENT OF /.tiro/app-title.md
===========
...
cb("Tiro Notes")
...
</pre>
</code>

- more complex example using custom backend api :<br>

<code>
<pre>
CONTENT OF /.tiro/app-title.md
===========
...
let simple = 0
if(isMobile()) simple = 1
if (simple == 1) {
    cb(\`Tiro\`)
} else {
        api.ressource.frontendFetch("custom_backend_api?file=first-endpoint&token={custom_api_token}", res => {
          let finalRes = JSON.parse(res)["result"]["message"]
          cb(\`hello world! \${finalRes} \${Math.random()}\`)
        })
    )
} 
...
</pre>
</code>

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