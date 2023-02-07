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
		// LOGIC
		//
		const exec = (cmdString, cb) => {
				updateStatus("⏳...")
				api.call("command.exec", [cmdString], res => {
						updateStatus("")
						cb(res)
				});
		}

		const prependOutput = (html) => {
				let output = document.getElementById("cmd-output")
				output.innerHTML = html + output.innerHTML
		}

		const prependToHistoryFile = (stringToInsert, filePath) => {
				console.log("saving to file path ", filePath);
				api.call("file.getContent", [filePath], noteContent => {
						let toSave = (noteContent !== "NO_FILE") ? stringToInsert + noteContent : stringToInsert
						api.call("file.saveContent", [filePath, toSave]);
				});
		}

		const execAndOutput = (cmdStr, id) => {
				let date = `[${new Date().toLocaleString()}]`
				let start = `====== ${date} ======= \n`
				let end = `\n--- [COMMAND]:'${cmdStr}'\n\n`
				exec(cmdStr, r => {
						let out = start + r + "\n" + end
						prependOutput(out)
						console.log(222222, outputPaths, outputPaths[id], id);
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
				<div id="cmd-status"> </div>

				<div id="command-wrapper"> 
				<textarea id="textarea-command"></textarea>
				<div id="buttons-wrapper"> </div>
				</div>

				<div id="output-wrapper"> 
				<pre><code id="cmd-output" class="language-json">
				</code></pre>
				</div>

				</div>

				<style>
				#cmd-status {


				}
				#commander-wrapper {
						margin-top: 30px;
						display: flex;
						flex-direction: column;
						height: 100%;
				}
				#command-wrapper {
						/* display: flex; */

				}
				#textarea-command {
						width: 97%;
						resize: vertical;
						margin-right: 5px;
						border: none;
						min-height: 40px;
						border-radius: 7px;
						box-shadow: 0px 0px 5px rgba(0,0,0,0.1);
						margin-bottom: 5px;
						padding: 5px;
				}
				#buttons-wrapper {
						/* display: flex; */
						/* flex-direction: column; */
						/* flex-flow: wrap; */
						/* max-height: 50%; */
				}
				#buttons-wrapper button {
						margin-right: 2px;
				}



				#output-wrapper {
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
				pre code {
						margin: 0px;
						background: #393939!important;
						font-size: 10px;
						padding: 0px 11px 13px 11px!important;
						overflow: scroll;
						white-space: pre-wrap;
						line-height: 11px;
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

