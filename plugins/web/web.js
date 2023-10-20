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

                const updateIframeUrl = (url, shouldaddToHistory=false) => {
                        console.log("updateIframeUrl", url)
                        if (shouldaddToHistory) addToHistory(url)
                        iframe.src = url
                }

                // initial URL asked for
                updateIframeUrl(innerTagStr, true)
                


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
                                updateIframeUrl(searchBar.value, true)
                        } else {
                                // get the last word of the searchBar.value and call it let modifier
                                let val = searchBar.value.trim()
                                let modifier = val.split(" ").pop()
                                addToHistory(val)
                                if (opts.search_engines[modifier]) {
                                        // get url without modifier
                                        let inputSearch = val.replace(modifier, "")
                                        let url = opts.search_engines[modifier] + inputSearch
                                        updateIframeUrl(url)
                                } else {
                                        console.log("no modifier")
                                        let url = opts.search_engines.default + val
                                        updateIframeUrl(url)
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
                        <div id="search-toggler-button-wrapper">
                                <div id="search-toggler-button">
                                        <i class="fas fa-search"></i>
                                </div>
                        </div>
                </div>

                <style>
                        #web-wrapper-ctag {
                                position: absolute;
                                left: 0px;
                                width: calc(100vw - 10px);
                        }

                                #search-toggler-button-wrapper {
                                        position: absolute;
                                        top: -70px;
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
                                                width: 150%!important;
                                                height: 150vh!important;
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

