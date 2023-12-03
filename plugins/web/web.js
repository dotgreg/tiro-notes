// 10.10.2023 v1.1
const webCtagApp = (innerTagStr, opts) => {
    const { div, updateContent } = api.utils.createDiv()

    const outputPaths = {  }

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

        ///////////////////////////////////////////////////
        // history cache
        //
        const cacheContentId = `ctag-web-history-`
        const getCache = (id) => (onSuccess, onFailure) => {
                id = `${cacheContentId}-${id}`
                api.call("cache.get", [id], content => {
                        if (content !== undefined && content !== null) onSuccess(content)
                        else if (onFailure) onFailure()
                })
        }
        const setCache = (id, mins) => (content) => {
                if (!mins) mins = -1
                id = `${cacheContentId}-${id}`
                api.call("cache.set", [id, content, mins]) 
        }
        const addToHistory = (urlOrSearch) => {
                console.log("addToHistory", urlOrSearch)
                urlOrSearch = urlOrSearch.trim()
                const updateHist = (content) => {
                        let arr = content.split("\n")
                        // if urlOrSearch already exists, remove it
                        let index = arr.indexOf(urlOrSearch)
                        if (index > -1) arr.splice(index, 1)
                        arr.unshift(urlOrSearch)
                        let newContent = arr.join("\n")
                        setCache("history")(newContent)
                }
                getCache("history")(content => {
                        updateHist(content)
                }, nothing => {
                        updateHist("")
                })
        }
        const getHistory = (onSuccess, onFailure) => {
                getCache("history")(content => {
                        let arr = content.split("\n")
                        // add a space behind each item
                        arr = arr.map(it => it + " ")
                        // remove if item is empty
                        arr = arr.filter(it => it !== " ")
                        onSuccess(arr)
                }, onFailure)
        }
        const clearHistory = () => {
                setCache("history")("")
        }
        
        ///////////////////////////////////////////////////////////
        // 
        // MAIN LOGIC
        //
        ///////////////////////////////////////////////////////////

        const startMainLogic = () => {
                

                let searchBar = document.getElementById("search-bar");
                let searchBarWrapperBg = document.getElementById("search-bar-wrapper-bg");
                let iframe = document.getElementById("web-iframe");
                let searchTogglerButton = document.getElementById("search-toggler-button");
                let searchTogglerButtonState = false
                let searchBarButton = document.getElementById("search-bar-button");

                const updateIframeContent = (iframeString, shouldaddToHistory=false) => {
                        console.log("updateIframeContent", iframeString)
                        if(iframeString.startsWith("http")) {
                                // if iframeString is an url
                                if (shouldaddToHistory) addToHistory(iframeString)
                                iframe.src = iframeString
                        } else {
                                // else, it is direct html content
                                iframe.srcdoc = generateHtmlContentWrapper(iframeString)
                        }
                       
                }

                // initial URL asked for
                updateIframeContent(innerTagStr, true)

                ///////////////////////////////////////////////
                // backend cached zoom iframe
                //
                let zoomIframe = 0.7
                getCache("zoom")(content => {
                        zoomIframe = content
                        updateZoomIframe()
                })
                const updateZoomIframe = (zoomval) => {
                        if(!zoomval) zoomval = 0
                        zoomIframe += zoomval
                        // let SizeMultiplier = 100 + ((zoomIframe - 1)*-10*17)
                        let SizeMultiplier = 100 / zoomIframe
                        // console.log(SizeMultiplier, zoomIframe)
                        iframe.style.transform = `scale(${zoomIframe})`
                        iframe.width = `${SizeMultiplier}%`
                        iframe.style.height = `${SizeMultiplier}vh`
                        setCache("zoom")(zoomIframe)
                }

                updateZoomIframe()
                
                onClick(["zoom-in-button"], () => {
                        updateZoomIframe(0.1)
                })
                onClick(["zoom-out-button"], () => {
                        updateZoomIframe(-0.1)
                })


                const toggleSearchBar = (status) => {
                        if(status) searchTogglerButtonState = status

                        if (searchTogglerButtonState) {
                                searchBarWrapperBg.style.display = "none"
                                searchTogglerButtonState = false
                        } else {
                                searchBarWrapperBg.style.display = "flex"
                                searchTogglerButtonState = true
                        }
                }

                onClick(["search-bar-button"], () => {
                        triggerSearch()
                })

                onClick(["search-bar-wrapper-bg"], (e) => {
                        toggleSearchBar(false)
                })
                onClick(["search-bar-wrapper"], (e) => {
                        e.stopPropagation()
                        e.preventDefault()
                })

                ///////////////////////////////////////////////
                // backend cached cookie/session enabler => not working
                //
                // let enableCookie = true
                // getCache("enable-cookie")(content => {
                //         console.log(1111111, content);
                //         toggleCookie(content)
                // })
                // const toggleCookie = (status) => {
                //         if(status) enableCookie = status
                //         else enableCookie = !enableCookie
                //         // enableCookie ? delete iframe.sandbox : iframe.sandbox = ""
                        
                //         console.log(enableCookie);
                //         if (enableCookie) document.getElementById("enable-cookie-button").classList.remove("active")
                //         else document.getElementById("enable-cookie-button").classList.add("active")
                //         //destroy and recreate iframe to apply changes
                //         let iframeParent = iframe.parentNode
                //         iframeParent.removeChild(iframe)
                //         iframe = document.createElement("iframe")
                //         iframe.id = "web-iframe"
                //         enableCookie ? iframe.sandbox = "" : iframe.sandbox = "allow-scripts allow-popups allow-forms"
                //         iframeParent.appendChild(iframe)
                //         updateIframeContent(innerTagStr, true)
                //         updateZoomIframe()
                // }

                // onClick(["enable-cookie-button"], () => {
                //         toggleCookie()
                //         setCache("enable-cookie")(enableCookie)
                // })


                onClick(["search-toggler-button"], () => {
                       toggleSearchBar()
                       console.log("open search")
                //        autoCompleteJS.focus();
                        searchBar.focus();
                })
                const basePlaceholderString = "Search..."
                const autoCompleteJS = new autoComplete(
                {
                        selector: "#search-bar",
                        placeHolder: basePlaceholderString,
                        data: {
                                src: async () => {
                                        searchBar.setAttribute("placeholder", "Loading...");
                                        let promise = new Promise((resolve, reject) => {
                                                getHistory(arr => {
                                                        console.log("arr", arr)
                                                        resolve(arr)
                                                })
                                        })
                                        let res = await promise
                                        console.log("RES RESULTS", res)
                                        searchBar.setAttribute("placeholder", basePlaceholderString);
                                        return res
                                },
                                cache: false
                        },
                        debounce: 300,
                        
                        resultsList: {
                                maxResults: 100,
                        },
                        resultItem: {
                            highlight: true,
                        },
                        events: {
                                input: {
                                        selection: (event) => {
                                                const selection = event.detail.selection.value;
                                                autoCompleteJS.input.value = selection;
                                                // searchBar.value = selection
                                                triggerSearch()
                                        },
                                        focus: () => {
                                                console.log("FOCUS")
                                                autoCompleteJS.start(" ");
                                                autoCompleteJS.open();
                                        },
                                }
                        }
                })

                const triggerSearch = () => {
                        toggleSearchBar(false)
                        if (searchBar.value.startsWith("http")) {
                                updateIframeContent(searchBar.value, true)
                        } else {
                                // get the last word of the searchBar.value and call it let modifier
                                let val = searchBar.value.trim()
                                let modifier = val.split(" ").pop()
                                addToHistory(val)
                                if (opts.search_engines[modifier]) {
                                        // get url without modifier
                                        let inputSearch = val.replace(modifier, "")
                                        let url = opts.search_engines[modifier] + inputSearch
                                        updateIframeContent(url)
                                } else {
                                        console.log("no modifier")
                                        let url = opts.search_engines.default + val
                                        updateIframeContent(url)
                                }
                        }
                }

                searchBar.addEventListener("keyup", function(event) {
                        // on typing, if enter is pressed, search
                        if (event.keyCode === 13 || event.key === "Enter"  || event.code === "Enter") {
                                event.preventDefault();
                                // if startsWith http, https
                                triggerSearch()
                                
                                
                        }
                })

                

        }

        const generateHtmlContentWrapper = (htmlString) => {
                const contentStyle = `
                <style>
                img {
                                max-width: 100%!important;
                                height: auto!important;
                }
                body, html {
                                font-family: sans-serif;
                }
                </style>
                `
                return `<!DOCTYPE html><html><head><meta charset="utf-8">${contentStyle}</head><body>${decodeURIComponent(htmlString) }</body></html>`
        }

    

        const genHtmlAndStyle = () => {
                // FA is included as requesting external ressources, so cannot be cached by tiro directly
                let res = `
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> 
                <div id="web-wrapper-ctag"> 
                        <div id="search-bar-wrapper-bg">
                                <div id="search-bar-wrapper">
                                        <input type="text" id="search-bar" placeholder="Search.." type="search" dir="ltr" spellcheck=false autocorrect="off" autocomplete="off" autocapitalize="off">
                                        <div id="search-bar-button"><i class="fas fa-search"></i></div>
                                </div>
                        </div>
                        <div id="web-iframe-wrapper">
                                <iframe id="web-iframe" ></iframe>
                        </div>
                        <div id="search-toggler-button-indicator"></div>
                        <div id="search-toggler-button-wrapper">
                                <div id="search-toggler-button"> <i class="fas fa-search"></i> </div>
                                <div id="zoom-buttons"> 
                                        <div id="zoom-in-button"> <i class="fas fa-search-plus"></i> </div>
                                        <div id="zoom-out-button"> <i class="fas fa-search-minus"></i> </div>
                                </div>
                        </div>
                </div>

                <style>
                        #web-wrapper-ctag {
                                position: absolute;
                                left: 0px;
                                width: calc(100vw - 10px);
                        }
                                #zoom-buttons {
                                        position: absolute;
                                        top: 72px;
                                        left: 50%;
                                        display: flex;
                                        transform: translate(-50%,-50%);
                                }
                                        #zoom-out-button ,
                                        #zoom-in-button {
                                                opacity:0.7;
                                                cursor: pointer;
                                                padding: 5px 9px;
                                                margin: 0px 4px;
                                                transition: all 0.3s ease-in-out;
                                                background: #fff;
                                                box-shadow: 0px 0px 6px 0px rgba(0,0,0,0.2);
                                                border-radius: 20px;
                                        }
                                        #zoom-out-button:hover ,
                                        #zoom-in-button:hover { 
                                                opacity:1;
                                        }
                                #enable-cookie {
                                        position: absolute;
                                        top: 2px;
                                        right: 10px;
                                }
                                        #enable-cookie-button {
                                                cursor: pointer;
                                                padding: 10px;
                                        }
                                        #enable-cookie-button.active {
                                                color: #fff;
                                                background: #000;
                                        }

                                #search-toggler-button-indicator {
                                        position: absolute;
                                        top: -1px;
                                        width: 40px;
                                        height: 3px;
                                        transform: translate(-50%, -50%);
                                        background: grey;
                                        pointer-events: none;
                                        left: 50%;
                                        box-shadow: 0px 0px 5px rgba(0,0,0,0.5);
                                }
                                #search-toggler-button-wrapper {
                                        position: absolute;
                                        top: -90px;
                                        left: 50%;
                                        z-index: 1;
                                        transform: translatex(-50%);
                                        // padding-right: 100px;
                                        // padding-left: 100px;
                                        padding-bottom: 100px;
                                        transition: all 0.3s ease-in-out;
                                        transition-delay: 0.3s;
                                        background: rgba(0,0,0,0);
                                        &:hover {
                                                top: 20px;
                                                // background: rgba(0,0,0,0.5);
                                        }
                                }
                                        #search-toggler-button {
                                                background: #fff;
                                                box-shadow: 0px 0px 6px 0px rgba(0,0,0,0.75);
                                                border-radius: 20px;
                                                padding: 10px 14px;
                                                cursor: pointer;
                                        }
                        

                                #search-bar-wrapper-bg {
                                        display: none;
                                        position: absolute;
                                        top: 0px;
                                        left: 0px;
                                        width: 100vw;
                                        height: 100vh;
                                        background: rgba(0,0,0,0.5);
                                        z-index: 2;
                                }
                                        #search-bar-wrapper {
                                                position: absolute;
                                                top: 20%;
                                                left: 50%;
                                                transform: translate(-50%, -50%);
                                                width: 50%;
                                                z-index: 3;
                                        }
                                                #search-bar-button {
                                                        position: absolute;
                                                        top: 2px;
                                                        right: -15px;
                                                        padding: 10px 14px;
                                                        cursor: pointer;
                                                }
                                                #search-bar-wrapper .autoComplete_wrapper {
                                                        width: 100%;
                                                }
                                                #search-bar-wrapper input {
                                                        // padding: 10px;
                                                        border: none;
                                                        border-radius: 4px;
                                                        width: 100%;
                                                        box-shadow: 0px 0px 6px 0px rgba(0,0,0,0.75);
                                                        
                                                }
                                                #search-bar-wrapper input:hover {
                                                        color: rgb(186 186 186 / 80%);
                                                }
                                                #search-bar-wrapper ul li:before {
                                                        display:none;
                                                }
                                                #search-bar-wrapper ul li,
                                                #search-bar-wrapper input,
                                                #search-bar-wrapper  {
                                                        color: rgb(186 186 186 / 80%)!important;
                                                }
                                                 



                                #web-iframe-wrapper {
                                        width: 100vw;
                                        height: 100vh;
                                        overflow: hidden;
                                }
                                        #web-iframe {
                                                border: none;
                                                transform: scale(0.67);
                                                transform-origin:top left;
                                        }
                </style> `
                return res
        }


        setTimeout(() => {
                setTimeout(() => {
                        api.utils.resizeIframe("100%");
                }, 100)
                setTimeout(() => {
			api.utils.loadRessources(
				[
					`https://cdn.jsdelivr.net/npm/@tarekraafat/autocomplete.js@10.2.7/dist/autoComplete.min.js`,
                                        `https://cdn.jsdelivr.net/npm/@tarekraafat/autocomplete.js@10.2.7/dist/css/autoComplete.01.min.css`
				],
				() => {
					updateContent(genHtmlAndStyle())
                                        startMainLogic()
				}
			);
		}, 100)
                
        })
        return div
}
// 

window.initCustomTag = webCtagApp

