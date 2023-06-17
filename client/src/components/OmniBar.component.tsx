import React, { ReactElement, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Select from 'react-select';
import { debounce, each, isArray, isNumber, orderBy, random } from 'lodash';
import * as lodash from "lodash"
import { iFile, iPlugin } from '../../../shared/types.shared';
import { getApi } from '../hooks/api/api.hook';
import { pathToIfile } from '../../../shared/helpers/filename.helper';
import { cssVars } from '../managers/style/vars.style.manager';
import { useDebounce } from '../hooks/lodash.hooks';
import { sharedConfig } from '../../../shared/shared.config';
import { iNotePreviewType, NotePreview } from './NotePreview.component';
import { deviceType } from '../managers/device.manager';
import { aLog } from '../hooks/api/analytics.api.hook';
import { Icon, Icon2 } from './Icon.component';
import { notifLog } from '../managers/devCli.manager';
import { fileToNoteLink } from '../managers/noteLink.manager';


interface iOptionOmniBar {
	value: string
	label: any
	// type: "filePath" | "folder"
	payload?: {
		file?: iFile
	}
}

const modeLabels = {
	search: "[Search Mode]",
	explorer: "[Explorer Mode]",
	plugin: "[Plugin Mode]"
}


const cachedPlugins: {
	dict: { [name: string]: string }
	config: { enabled: boolean }
} = { dict: {}, config: { enabled: true } }

const disableCachePlugins = () => {
	cachedPlugins.config.enabled = false
	cachedPlugins.dict = {}
}

export const OmniBar = (p: {
	show: boolean
	onClose: Function
	onHide: Function
	lastNotes: iFile[]
}) => {


	const [selectedOption, setSelectedOptionInt] = useState<any[]>([]);
	const selectedOptionRef = useRef<any[]>([])
	const setSelectedOption = (nArr: any[]) => {
		
		if (!isArray(nArr)) return
		setSelectedOptionInt(nArr)
		selectedOptionRef.current = nArr
	}
	const [options, setOptionsInt] = useState<any[]>([]);
	const setOptions = (nVal: any[]) => {
		onOptionsChange(nVal)
		setOptionsInt(nVal)
	}

	// const [lastNotesOptions, setLastNotesOptions] = useState<any[]>([]);
	const [noOptionLabel, setNoOptionLabel] = useState("No Options")

	const insertNoteId = (f:iFile) => {
		getApi(api => {
			api.ui.note.editorAction.dispatch({
				type:"insertText", 
				insertText: fileToNoteLink(f)
			})
			p.onClose()
		})
	}


	// const HtmlOption = useMemo((p as {file: iFile}) => {
	const HtmlOption = (p:{file:iFile}) => {
		const [hover, setHover] = useState<boolean>(false);
		return useMemo(() => <div 
		// return <div 
				className={`path-option-wrapper device-${deviceType()}`}
				onMouseEnter={e => {setHover(true)}}
				onMouseLeave={e => {setHover(false)}}
			>
				<div className="file">{p.file.name}</div>
				<div className="folder">{p.file.folder}</div>
				<div className="actions">
				{hover && <div className="action" 
					onClick={e => {
						e.stopPropagation()
						insertNoteId(p.file)
					}}>
					<Icon2 name="link" label='insert note link in the current note'/>
				</div>}
				</div>
			</div>
		, [p.file, hover])
	}

	const genOptionHtml = (file: iFile):ReactElement => {
		return <HtmlOption file={file} />
	}

	const filesToOptions = (files: iFile[]): iOptionOmniBar[] => {
		let res: iOptionOmniBar[] = []
		each(files, file => {
			let nOption: iOptionOmniBar = {
				value: file.path,
				label: genOptionHtml(file),
				payload: { file }
			}
			res.push(nOption)
		})
		return res
	}







	//
	// STYLING
	//
	const isHoverEnabled = useRef<boolean>(false)
	const [styles, setStyles] = useState<any>({
		indicatorsContainer: (base, state) => {
			return { ...base, display: "none" }
		},
		menuList: (base, state) => {
			let maxHeight = deviceType() === "mobile" ? {} : {maxHeight: "150px"}
			return { ...base, ...maxHeight}
		},
		menu: (base, state) => {
			let pe = deviceType() === "mobile" ? "all" : "none"
			return { ...base, position: "relative", pointerEvents: pe }
		},
		control: (base, state) => {
			return { ...base, outline: "none", boxShadow: 'none', border: 0 }
		},
		multiValue: (base, state) => {
			return !state.data.editable ? { ...base, backgroundColor: cssVars.colors.main } : base;
		},
		multiValueRemove: (base, state) => {
			return !state.data.editable ? { ...base, display: 'none' } : base;
		},
	}) 

	// on mousemove, events options can be hovered
	// const onMouseMove = (e:any) => {
	// 	if (isHoverEnabled.current) return
	// 	isHoverEnabled.current = true
	// 	console.log(123,e)
	// 	setTimeout(() => {
	// 		styles.menu = (base, state) => {
	// 			let pe = deviceType() === "mobile" ? "all" : "all"
	// 			return { ...base, position: "relative", pointerEvents: pe }
	// 		}
	// 		setStyles(styles)
	// 	}, 0)
	// }

	useEffect(() => {
		setTimeout(() => {
			styles.menu = (base, state) => {
				let pe = deviceType() === "mobile" ? "all" : "all"
				return { ...base, position: "relative", pointerEvents: pe }
			}
			setStyles(styles)
		}, 500)
	}, [])








	const onChange = (nOptions: any, actionObj: any) => {

		//
		// SELECTING LAST NOTE
		//
		let s = nOptions[0]

		if (s && s.payload && s.payload.file) {
			let file = s.payload.file
			jumpToPath(file.path)
			nOptions = []
		}
		// update it
		setSelectedOption(nOptions)
	}
	const selectRef = useRef<any>()
	let defaultValue = options[0] || { label: "", value: "" }






	const jumpToPath = (filePath: string) => {
		let file = pathToIfile(filePath)
		getApi(api => {
			api.ui.browser.goTo(file.folder, file.name, { openIn: 'activeWindow' })
			p.onClose()
		})
	}

	//
	// MODE SWITCHING
	//
	const [inputTxt, setInputTxt] = useState("");
	const onInputChange: any = (txt: string, p) => {
		if (p.action === "input-blur" || p.action === "menu-close") {
		} else {
			setInputTxt(txt)
		}
	}
	const inputTxtRef = useRef<any>(null)
	useEffect(() => {
		inputTxtRef.current = inputTxt
	}, [inputTxt])

	const onFocus = (txt) => {
	}









	///////////////////////////////////////////////////////
	// @ MAIN UPDATE LOGIC
	// 

	const histPath = useRef("")
	const updateFromChange = () => {
		// at first, according to first char, switch mode
		let stags = selectedOptionRef.current
		let inTxt = inputTxt.trim()
		setPreviewType("editor")


		if (stags.length === 0) {
			if (inTxt === "/") {
				aLog(`omnibar_explorer`)
				getApi(api => {
					// erase /
					setInputTxt("")
					let folder = api.ui.browser.files.active.get.folder
					triggerExplorer(folder)
				})
			}

			if (inTxt === "") {
				startLastNotesModeLogic()
			}

			if (inTxt === "?") {
				aLog(`omnibar_search`)
				startSearchModeLogic()
			}

			if (inTxt === ":") {
				startPluginMode()
			}
		}
		else if (stags[0].label === modeLabels.search) {

			// IF SEARCH MODE 
			if (!stags[1]) {
				// STEP 1 : add automatically editable folder
				if (inTxt === "?") {
					// erase ? and put instead the current folder
					getApi(api => {
						let folder = api.ui.browser.files.active.get.folder
						setInputTxt(folder)
					})
				}
				setHelp(`Path to search (ex:"/path/to/folder") + ENTER`)
				setOptions([{ label: inTxt, value: inTxt }])

			} else if (stags.length === 2) {
				// STEP 2 : show searched results
				setPreviewType("preview")
				reactToSearchTyping(inTxt, stags[1].label)

			} else if (stags.length === 3 && wordSearched.current === stags[2].value) {
				setPreviewType("preview")
				// STEP 3-1 (optional) :  filter found results
				console.log(`STEP 3-1 (optional) :  filter found results`, wordSearched.current);


			} else if (stags.length === 3 || stags.length === 4) {
				console.log(`STEP 3-2 : jump to page`, { w: wordSearched.current, stags });
				let last = stags.length - 1
				let file = stags[last].payload.file as iFile
				jumpToPath(file.path)
			}
		}
		// IF EXPLORER MODE
		else if (stags[0].label === modeLabels.explorer) {

			const getFinalPath = () => {
				let s = [...stags]
				s.shift()
				// merge all the request
				let finalPath = ""
				each(s, o => {
					finalPath += "/" + o.value
				})
				return finalPath
			}

			let finalPath = getFinalPath()
			// if ends to md, jump to it
			if (finalPath.endsWith(".md")) {
				// remove mode label
				finalPath = finalPath.replace(stags[0].label, "")
				jumpToPath(finalPath)
			}

			// else jump to that new folder
			else if (histPath.current !== finalPath) {
				histPath.current = finalPath
				triggerExplorer(finalPath)
			}
		}
		else if (stags[0].label === modeLabels.plugin) {
			triggerPluginLogic(inTxt, stags)
		}
	}

	useEffect(() => {
		updateFromChange();
		if (onChangeUpdatePlugin.current) onChangeUpdatePlugin.current()
	}, [selectedOption, inputTxt])

	// useEffect(() => {
	// }, [options])


	const baseHelp = `"?" for search mode, "/" for explorer mode, ":" for plugin mode`
	const [help, setHelp] = useState(baseHelp)













	///////////////////////////////////////////////////////
	///////////////////////////////////////////////////////
	// MODES LOGIC
	///////////////////////////////////////////////////////
	///////////////////////////////////////////////////////
















	///////////////////////////////////////////////////////////////////////////////
	// @ EXPLORER MODE
	//
	const lastSearchId = useRef(0)
	const lastSearch = useRef("")
	const triggerExplorer = (folderPath: string) => {
		if (folderPath === "") return
		if (!folderPath.endsWith("/")) folderPath = folderPath + "/"

		// do not search the same thing 2 times
		if (folderPath === lastSearch.current) return
		lastSearch.current = folderPath

		console.log("== EXPLORER", folderPath);

		setOptions([{ label: "loading..." }])
		setNotePreview(null)

		lastSearchId.current++
		let currId = lastSearchId.current

		getApi(api => {
			let folderPathArr = [folderPath]
			api.folders.get(folderPathArr, folderData => {

				// only take in account the LAST request
				if (currId !== lastSearchId.current) return

				let folderPathAnswer1 = folderData.folderPaths.join("");
				let folderPathAsked1 = folderPathArr.join("");
				if (folderPathAnswer1 !== folderPathAsked1) return

				let parent = folderData.folders[0]
				if (!parent) return

				let folders = folderData.folders[0].children
				api.files.get(folderPath, (files, folderPathAnswer2) => {
					if (folderPathAnswer2 !== folderPath) return

					// split folder path
					let foldersArr = folderPath.split("/")

					// create folder tags
					let nSelec: any[] = []
					nSelec.push({ value: modeLabels.explorer, label: modeLabels.explorer })
					nSelec.push({ value: "/", label: "/" })
					each(foldersArr, f => {
						if (f === "") return
						nSelec.push({ value: f, label: f + "/" })
					})

					// create omnibarions from folders and files
					let nOpts: iOptionOmniBar[] = []

					let url = `http://localhost:3023/static//ctags//.resources/screenshot%2020230127%20at%20135701.jpg?token=KL3XFJdTJ7MWPtIu50OyUKlBhIszxRMdDwpd3EnSMJ1HGjLCAHaPDGjw9UcZ`
					let imageHtml = <div
						style={{
							backgroundImage: `url('${url}')`
						}}
						className="barimage">
					</div>

					each(folders, f => {
						let arr = f.path.split("/")
						let last: any = arr[arr.length - 1] + "/"
						// last = <div className="flex-option"><div>{last}<b>wooopy</b></div>{imageHtml}</div>
						nOpts.push({ value: last, label: last })
					})
					each(files, f => {
						let arr = f.path.split("/")
						let last: any = arr[arr.length - 1]
						let payload = { file: f }

						// let lastHtml = <div className="flex-option"><div>{last}<b>wooopy</b></div>{imageHtml}</div>
						let htmlOption = genOptionHtml(f)

						nOpts.push({ value: last, label: htmlOption, payload })
					})

					setSelectedOption(nSelec)
					setOptions(nOpts)
					// setNotePreview(nSelec)

				})
			})
		})
	}











	///////////////////////////////////////////////////////////////////////////////
	// @ SEARCH MODE
	//
	const startSearchModeLogic = () => {
		setSelectedOption([
			{ value: modeLabels.search, label: modeLabels.search },
		])
	}

	const wordSearched = useRef<string | null>(null)
	const reactToSearchTyping = useDebounce((inputTxt: string, folder: string) => {
		let path = folder
		let input = inputTxt

		if (input && path && input.length > 2 && path.length > 0) {
			setHelp(`Searching "${input}" in "${path}" ...`)
			setOptions([{ label: "loading..." }])

			let isRegex = input.includes("*")

			let nOpts: any = []
			setOptions(nOpts)

			wordSearched.current = input

			getApi(api => {
				api.search.word(input, path, res => {
					each(res, (fileRes) => {
						each(fileRes.results, occur => {

							let regexLabel = isRegex ? `(${input})` : ``
							let location = `${fileRes.file.path} ${regexLabel}`
							let index = occur.indexOf(input)
							let l = 100
							let o = occur
							let start = (index > l / 2) ? index - l / 2 : 0
							let end = index + l / 2 < o.length ? index + l / 2 : o.length
							if (o.length > l) o = o.substring(start, end)
							occur = o
							let occurLabel = o.replaceAll(input, `<b>${input}</b>`)


							let htmlOption = <div className="path-option-wrapper">
								<div className="search-location">{location}</div>
								<div className="occur-wrapper"
									dangerouslySetInnerHTML={{ __html: occurLabel }} >
								</div>
							</div>

							nOpts.push({
								label: htmlOption,
								value: wordSearched.current! + fileRes.file + occur + location,
								payload: {
									file: fileRes.file,
									line: occur
								}
							})
						})
					})
					if (nOpts.length === 0) setNotePreview(null)
					nOpts.unshift({ label: `🔎 Filter the ${nOpts.length} results for "${wordSearched.current}"`, value: wordSearched.current })
					setHelp(`${nOpts.length - 1} results found for "${input}" in "${path}" `)
					setOptions(nOpts)
				})
			})

		} else {
			setHelp(`Type the word searched`)
			setOptions([])
			setNotePreview(null)
			wordSearched.current = ""
		}
	}, 500)
















	///////////////////////////////////////////////////////////////////////////////
	// @ LAST NOTES MODE
	//
	const startLastNotesModeLogic = () => {
		setHelp(baseHelp)
		let nOptions = filesToOptions(p.lastNotes)

		// intervert el 1 and el 2
		let o1 = nOptions.shift() as iOptionOmniBar
		let o2 = nOptions.shift() as iOptionOmniBar
		nOptions.unshift(o1)
		nOptions.unshift(o2)

		// setLastNotesOptions(nOptions)
		setOptions(nOptions)
	}















	///////////////////////////////////////////////////////////////////////////////
	// @ PLUGIN MODE
	//
	const startPluginMode = () => {
		setSelectedOption([
			{ value: modeLabels.plugin, label: modeLabels.plugin },
		])

	}

	const triggerPluginLogic = (input: string, stags: any[]) => {
		setNotePreview(null)
		getApi(tiroApi => {
			if (stags.length === 1) {
				// STEP 2 : LOAD ALL BAR PLUGINS, EVAL INPUTTXT AND SEND IT BACK
				
					let nOpts: any = []
					tiroApi.plugins.list(plugins => {
						each(plugins, p => {
							if (p.type !== "bar") return
							nOpts.push({ label: p.name, value: p })
						})
						setOptions(nOpts)
						if (input === ":") setInputTxt("")
						// order alphabetically
						nOpts = orderBy(nOpts, ["label"])
						setHelp(`${nOpts.length} bar plugins found`)
					})
				
				// nOpts.push({ label: f.name.replace('.md', ''), value: f })
				// if (input === ":") setInputTxt("")
				// setHelp(`${files.length} plugins found in "${pluginsBarFolder}"`)
				// order alphabetically
				// 			nOpts = orderBy(nOpts, ["label"])
			} else if (stags.length >= 2) {
					let plugin = stags[1].value as iPlugin
				// console.log(pluginBarName)
				const loadExternalBarPlugin = (url: string, bApi, tApi) => {
					let noCache = !cachedPlugins.config.enabled
					tiroApi.ressource.fetch(url, txt => {
						try {
							new Function('barApi', 'tiroApi', txt)(bApi, tApi)
						} catch (e) {
							let message = `[ERROR LOADING PLUGIN BAR]: ${JSON.stringify(e)}"`
							console.log(message);
							notifLog(`${message}`)
						}
					}, { disableCache: noCache })
				}
				let barApi = {
					input, setInputTxt, inputTxt, inputTxtRef,
					options, setOptions,
					onChange: onChangeUpdatePlugin,
					onClose: p.onClose, onHide: p.onHide,
					close: p.onClose, hide: p.onHide,
					selectedOptionRef, setSelectedOption,
					lodash,
					selectedTags: stags,
					setNotePreview, notePreview,
					setHtmlPreview, htmlPreview,
					loadBarPlugin:loadExternalBarPlugin, disableCache: disableCachePlugins,
					loadExternalBarPlugin
				}
				// we directly eval it!
				try {
					new Function('barApi', 'tiroApi', plugin.code)(barApi, tiroApi)
				} catch (e:any) {
					let message = `[ERROR PLUGIN BAR]: ` 
					console.log(message, e);
					notifLog(`${message} : ${e.message}`)
				}
				
			}
		})

	
	}
	const onChangeUpdatePlugin = useRef<any>(null)













	//////////////////////////////////////////////////////////////////////
	// @ Note preview
	//


	//
	// system to find current note highlighted... using class detection...
	//
	const [notePreview, setNotePreview] = useState<iFile | null>(null);
	const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
	const [activeLine, setActiveLine] = useState<string | undefined>(undefined);

	const onActiveOptionChange = (file: iFile, activeLine?: string) => {
		let stags = selectedOptionRef.current

		// EXPLORER
		if (stags[0] && stags[0].label === modeLabels.explorer) {
			setNotePreview(file)

		} else if (stags[0] && stags[0].label === modeLabels.search) {
			// SEARCH
			setNotePreview(file)
			setActiveLine(activeLine)
			console.log("SEARCH JUMP TO", activeLine, file.path);

		} else if (!stags[0]) {
			// LAST NOTES
			setNotePreview(file)

		} else {
			setNotePreview(null)
		}
	}

	let obs = useRef<any[]>([])
	const listenToOptionsClasses = (nVal: any[]) => {

		// clean old observer
		each(obs.current, ob => {
			ob.disconnect()
		})
		obs.current = []

		// restart listeners
		const optDivs = document.querySelectorAll("div[id*='-option']");

		each(optDivs, (o, i) => {
			const observerOptions = {
				childList: true,
				attributes: true,
				subtree: false
			}
			const observer = new MutationObserver((e) => {
				// @ts-ignore
				let id = parseInt(o.id.split("-").pop())
				const style = getComputedStyle(o);
				let bg = style["background-color"]
				if (bg !== "rgba(0, 0, 0, 0)" && options[id] && options[id].payload) {
					let payload = options[id].payload
					let file = payload.file as iFile
					let line = payload.line || undefined
					onActiveOptionChange(file, line)
				} else {
				}
			});
			observer.observe(o, observerOptions);
			obs.current.push(observer)
		})
	}

	const onOptionsChange = useDebounce((nVal: any[]) => {
		listenToOptionsClasses(nVal)
	}, 100)
	useEffect(() => {
		onOptionsChange(options)
	}, [options, inputTxt])








	const [previewHeight, setPreviewHeight] = useState<number>(300);
	const omniBarWrapper = useRef<any>(null)
	const debounceResizeHeight = useDebounce(() => {
		if (omniBarWrapper && omniBarWrapper.current) {
			let barHeight = omniBarWrapper.current.clientHeight + 30
			let windowHeight = window.innerHeight
			// previewHeight = windowHeight - barHeight - 50
			let nHeight = windowHeight - barHeight - 50
			if (previewHeight !== nHeight) setPreviewHeight(nHeight)
		}
	}, 10)
	debounceResizeHeight()



	const [previewType,setPreviewType] = useState<iNotePreviewType>("editor")
	

	//
	// RENDERING
	//
	return (
		<div className={`omnibar-popup-bg ${p.show ? "" : "hide"}`}
			// onMouseMove={e => onMouseMove(e)}
			onClick={e => { p.onClose() }}>
			<div className={`omnibar-popup-wrapper device-${deviceType()}`}>
				<div className="flex-wrapper"
					onClick={e => {
						e.stopPropagation()
					}}
				>
					<div ref={omniBarWrapper}>
						<div className="help">
							{help}
						</div>
						<div className="help-right" onClick={e => { p.onHide() }}>
							<Icon name="faEyeSlash" color={`#b2b2b2`} />
						</div>
						<Select
							isMulti

							ref={selectRef}
							menuIsOpen={true}
							defaultValue={defaultValue}
							value={selectedOption}
							autoFocus={true}

							onChange={onChange}
							// components={{ Option: CustomOption }}
							// openMenuOnClick={e => { console.log("wooooo"); }}
							openMenuOnClick={false}

							inputValue={inputTxt}
							onInputChange={onInputChange}
							onFocus={onFocus}

							options={options}
							// isClearable={false}
							styles={styles}
							noOptionsMessage={() => {
								setNotePreview(null)
								return noOptionLabel
							}}
						/>
					</div>
					{deviceType() !== "mobile" && 
						<div className={`preview-wrapper ${notePreview ? "note-preview" : "html-preview-wrapper"}`}
							style={{ height: previewHeight }}
						>
							{notePreview && deviceType() !== "mobile" &&
								<NotePreview
									file={notePreview}
									searchedString={activeLine}
									height={previewHeight}
									type={previewType}
								/>
							}
							{
								htmlPreview &&
								<div
									className="html-preview"
									dangerouslySetInnerHTML={{
										__html: htmlPreview
									}}
									style={{ height: previewHeight }}
								>
								</div>
							}
						</div>
					}
				</div>
			</div >
		</div >
	)
}


export const omnibarPopupCss = () => `
						&.device-view-mobile {
						}

						.omnibar-popup-bg.hide {
								display:none;
						}
						.omnibar-popup-bg {
								background: rgba(0,0,0,0.5);
								top: 0px;
								left: 0px;
								width: 100vw;
								height: 100vh;
								z-index: 1000;
								position: absolute;
						}
						.omnibar-popup-wrapper {
								width: 88%;
								margin: 0 auto;
								z-index: 100;
								position: absolute;
								left: 50%;
								transform: translate(-50%);
								top: 22px;
						}
						.help-right {
								cursor:pointer;
								position: absolute;
								right: 3px;
								top: 3px;
						}
						.help {
								color:white;
								margin-bottom: 10px;
						}

						.preview-wrapper {
								overflow-y: scroll;
								background: white;
								border-radius: 5px;
						}

						.barimage {
								height: 60px; 
								width: 100px;

						}


						div[class$='-menu']>div {
								display: flex;
								flex-wrap: wrap;
								justify-content: flex-start;
						}

						div[class$='-option'] {
								width: ${deviceType() === "mobile" ? "100" : "20"}%;
						}

						.path-option-wrapper {
							position: relative;
							word-break: break-word;
							.search-location {
									color: #b3b1b1;
									font-size: 9px;
							}
							.folder {
									color: grey;
							}
							.file {
									font-weight: bold;

							}

							&.device-desktop .actions {
								transition: all 0.2s;
								opacity: 0;
							}
							&.device-desktop:hover .actions {
								opacity: 1;
							}
							.actions {
								display:flex;
								position: absolute;
								right: 0px;
								top: 0px;
								align-items: center;
								height: 100%;
								.action {
									transition: all 0.2s;
									opacity: 0.3;
									cursor: pointer;
									color: grey;
									&:hover {
										opacity: 1;
									}
								}
							}
						}
						.html-preview-wrapper {
								overflow: hidden;
								.html-preview {
										iframe {
												// transform: scale(0.65);
												transform: scale(0.8);
												transform-origin:top left;
												border:none;
												width: 125%;
												height: 125%;
												// width: 155%;
												// height: 155%;
										}
								}
						}


						`


