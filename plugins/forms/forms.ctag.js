// 10.10.2023 v1.1

const formsApp = (innerTagStr, opts) => {
        const { div, updateContent } = api.utils.createDiv()

        const outputPaths = {}
        ///////////////////////////////////////////////////
        // SUPPORT
        //
        const each = (itera, cb) => {
                if (itera.constructor === Array) {
                        for (let i = 0; i < itera.length; ++i) {
                                cb(itera[i])
                        }
                } else {
                        for (const property in itera) {
                                cb(itera[property], property)
                        }
                }
        }

        const onClick = (elIds, action) => {
                for (var i = 0; i < elIds.length; ++i) {
                        let el = document.getElementById(elIds[i]);
                        if (!el) return console.warn(`onclick: ${elIds[i]} does not exists`)
                        el.addEventListener("click", e => { action(e) }, false);
                }
        }
        ///////////////////////////////////////////////////////////
        // 
        // MAIN LOGIC
        //
        ///////////////////////////////////////////////////////////
        const renderFormsApp = () => {        
                // for each line, it is a path like /forms/1
                // if not, search inside /.tiro/.forms.md
                let pathToSearch =  "/.tiro/forms.md"
                if (innerTagStr.length > 2) pathToSearch = innerTagStr.trim() 

                const wrapperEl = document.getElementById("forms-ctag-inner")
                wrapperEl.innerHTML = "Loading forms from config file " + pathToSearch + "..."
                api.call("popup.form.readConfigFromNote", [pathToSearch], res => {
                        wrapperEl.innerHTML = `<ul class='forms-list'></ul> <p> Forms config from filePath: ${pathToSearch}</p> `
                        // get forms-list
                        const formsListEl = wrapperEl.querySelector(".forms-list")
                        for (const formConfig of res) {
                                const li = document.createElement("li")
                                const btn = document.createElement("button")
                                btn.innerHTML = formConfig.title
                                btn.onclick = () => {
                                        api.call("popup.form.create", [formConfig])
                                }
                                li.appendChild(btn)
                                formsListEl.appendChild(li)
                        }
                })
        }

        setTimeout(() => {
                setTimeout(() => {
                        api.utils.resizeIframe("100%");
                }, 100)
                setTimeout(() => {
                        renderFormsApp()
                        // api.utils.loadRessources(
                        //         [
                        //         ],
                        //         () => {
                        //         }
                        // );
                }, 100)

        })

        return `
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> 
        <div id="forms-ctag"> 
                <div id="forms-ctag-inner"> 
                
                </div>
        </div>

        <style>
        #forms-ctag {
                padding: 10px;
        }
        .forms-list {
                list-style: none;
                padding: 0;
                margin: 0;
        }
        ul.forms-list {
                display: flex;
        }
        ul.forms-list li {
                padding: 0px;
                padding-left: 0px;
                padding-right: 12px;
        }
        button {
                padding: 7px 16px;
                height: 36px;
        }
        p {
                color: grey;
                font-size: 10px;
        }
                      
        </style> `
}
// 

window.initCustomTag = formsApp

