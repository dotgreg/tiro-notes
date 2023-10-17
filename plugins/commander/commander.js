// 17.10.2023 redesign v1.1
const commanderApp = (innerTagStr, opts) => {
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

		const getConfigScripts = () => {
				let raw = innerTagStr
				let arr = raw.split("\n")
				let res = {}
				each(arr, it => {
						// if starts with button_  create new button
						if (it.startsWith("button_")) {
								it = it.replace("button_", "")
								let iArr = it.split(" ")
								let sName = iArr.shift()
								let sContent = iArr.join(" ")

								res[sName] = sContent
						}

						// if it is output, override => DO WE NEED IT REALLY?
						// => we could put all in output and cache it + function to clean it
				})
						each(arr, it => {
								// global output file
								if (it.startsWith("output ")) {
										it = it.replace("output ", "")
										outputPaths.global = it
								}

								// output file per script
								if (it.startsWith("output_")) {
										it = it.replace("output_", "")
										let iArr = it.split(" ")
										let oName = iArr.shift()
										let oPath = iArr.join(" ")
										if (res[oName]) outputPaths[oName] = oPath
								}
						})
								return res
		}


		///////////////////////////////////////////////////
		// history cache
		//
		const cacheContentId = `ctag-commander-${api.utils.getInfos().file.path}`
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
		const addToHistory = (cmd) => {
			const updateHist = (content) => {
				let arr = content.split("\n")
				// if cmd already exists, remove it
				let index = arr.indexOf(cmd)
				if (index > -1) arr.splice(index, 1)
				arr.unshift(cmd)
				let newContent = arr.join("\n")
				setCache("history")(newContent)
			}
			getCache("history")(content => {
				updateHist(content)
			}, nothing => {
				updateHist("")
			})
		}
		const clearHistory = () => {
			setCache("history")("")
		}

		// take getCache history and generate html select, add an option to clear history in select
		// on select change, get content and alert it
		const generateHistorySelect = () => {
			setTimeout(() => {
				let html = `<select id="history-select">`
				getCache("history")(content => {
					let arr = content.split("\n")
					let historyWrapper = document.getElementById("history-wrapper")
					if (arr.length < 2) return historyWrapper.innerHTML =  ""
					html += `<option value="">-- History --</option>`
					each(arr, it => {
						html += `<option value="${it}">${it}</option>`
					})
					html += `<option value="clear">--Clear history--</option>`
					html += `</select>`
					historyWrapper.innerHTML = html
					onClick(["history-select"], e => {
						let val = e.target.value
						if (val === "clear") {
							console.log("clear history!")
							clearHistory()
							setTimeout(() => {
								generateHistorySelect()
							}, 300)
						} else if (val !== "") {
							document.getElementById("textarea-command").value = val
						}
					})
				})
			}, 300)
		}
		generateHistorySelect()
		
		

		///////////////////////////////////////////////////
		// LOGIC
		//
		const exec = (cmdString, cb) => {
				updateStatus("⏳...")
				api.call("command.exec", [cmdString], res => {
						updateStatus("")
						if (cmdString !== "") {
							addToHistory(cmdString)
							generateHistorySelect()
						}

						cb(res)
				});
		}

		const prependOutput = (html) => {
				let output = document.getElementById("cmd-output")
				output.innerHTML = html + output.innerHTML
		}

		const prependToHistoryFile = (stringToInsert, filePath) => {
				// console.log("saving to file path ", filePath);
				api.call("file.getContent", [filePath], noteContent => {
						let toSave = (noteContent !== "NO_FILE") ? stringToInsert + noteContent : stringToInsert
						api.call("file.saveContent", [filePath, toSave]);
				});
		}

		const execAndOutput = (cmdStr, id) => {
				let date = `[${new Date().toLocaleString()}]`
				let start = `<h3>====== ${date} ======= </h3>\n`
				let end = `\n--- [COMMAND]:'${cmdStr}'\n\n`
				exec(cmdStr, raw => {
						let resStr = raw
						try {
								objRes = JSON.parse(raw)
								if (objRes.shortMessage) resStr = objRes.shortMessage
								else if (objRes.originalMessage) resStr = objRes.originalMessage
								else if (objRes.stderr) resStr = objRes.stderr
								else if (objRes.message) resStr = objRes.message
								else resStr = JSON.stringify(objRes, null, 2)
								
						} catch (e) { }
						let out = start + resStr + "\n" + end
						prependOutput(out)
						if (outputPaths[id]) prependToHistoryFile(out, outputPaths[id])
						else if (outputPaths.global) prependToHistoryFile(out, outputPaths.global)
				})
		}


		const updateStatus = (string) => {
				let output = document.getElementById("cmd-status")
				output.innerHTML = string
		}

		const mainLogic = () => {
				let scriptsObject = getConfigScripts()
				generateButtons(scriptsObject)
		}




		//@todo save output content?

		///////////////////////////////////////////////////
		// UI
		//

		const generateButtons = (scriptsObject) => {
				let html = ``
				each(scriptsObject, (scriptString, name) => {
						let id = `button-${name}`
						html += `<button id="${id}">${name}</button>`

						setTimeout(() => {
								onClick([id], e => {
										let userInput = document.getElementById("textarea-command").value
										userInput = userInput.replaceAll("'", "\\'")
										let cmd = scriptString.split(`{{input}}`).join(userInput)
										execAndOutput(cmd, name)
								})
						}, 100)
				})

						buttonsW = document.getElementById("buttons-wrapper")
				buttonsW.innerHTML = html
		}


		const getHtmlWrapper = () => {
				let res = `
				<div id="commander-wrapper"> 
				

				<div id="command-wrapper"> 
					<div id="cmd-status"> </div>
					<textarea id="textarea-command" spellcheck="false" autocomplete="on"></textarea>
					<div id="buttons-wrapper-wrapper"> 
						<div id="buttons-wrapper"> </div>
						<div id="history-wrapper"> </div>
					</div>
					</div>

					<div id="output-wrapper"> 
						<pre>
							<code id="cmd-output" class="language-json"> </code>
						</pre>
					</div>

				</div>

				<style>
				
				#cmd-status {
					position: absolute;
					top: 17px;
					right: 25px;
				}
				#commander-wrapper {
						margin-top: 0px;
						display: flex;
						flex-direction: column;
						height: 100%;
						
				}



				#command-wrapper {
					position: fixed;
					z-index: 1;
					width: calc(100% - 20px);
					top: 0px;
					padding: 10px 10px;
					background: rgba(255,255,255,0.5);
				}
				
				#buttons-wrapper-wrapper:hover {
					height: 30vh;
					overflow-y: scroll;
				}
				#buttons-wrapper-wrapper {
					height: 26px;
					overflow: hidden;
					transition: 0.2s all;
					transition-delay: 0.5s, 0s;
				}

				#buttons-wrapper button {
					margin: 1px;
				}

				#textarea-command {
						width: 97%;
						resize: vertical;
						margin-right: 5px;
						min-height: 15px;
						height: 15px;
						border: none;
						border-radius: 7px;
						box-shadow: 0px 0px 5px rgba(0,0,0,0.1);
						margin-bottom: 5px;
						padding: 8px;
				}
				
				#buttons-wrapper button {
						margin-right: 2px;
				}



				#output-wrapper {
					
					margin-top: 83px;
					padding: 0px 14px 0px 11px;
					margin-bottom: 30px;
				}

				pre {
					
						border-radius: 7px;
						margin: 0px;
						margin-top: 5px;
						padding-top: 6px;
						background: #393939!important;
						color: burlywood;
						color: lime;
						color: darkseagreen;
						color: yellowgreen;
						color: darkseagreen;
				}
				pre code#cmd-output  {
					font-size: 10px!important;
					margin: 0px;
					background: #393939!important;
					padding: 0px 11px 13px 11px!important;
					overflow: auto;
					white-space: pre-wrap;
					line-height: 11px;
				}

				@media only screen and (max-device-width: 480px){
					pre code#cmd-output  {
						font-size: 8px!important;
					}
				}

			
				#cmd-output h1,
				#cmd-output h2,
				#cmd-output h3
				{
					color: burlywood;
					color: lime;
					color: darkseagreen;
					color: yellowgreen;
					color: darkseagreen;
					margin-bottom: 0px;
					margin-top: 15px;
				}
				#cmd-output h1:before,
				#cmd-output h2:before,
				#cmd-output h3:before {
					content: ""
				}

				</style> `
				return res
		}


		setTimeout(() => {
				setTimeout(() => {
						api.utils.resizeIframe("100%");
				}, 100)
				updateContent(getHtmlWrapper())
				mainLogic()
		})
		return div
}

window.initCustomTag = commanderApp

