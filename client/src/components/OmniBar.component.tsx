import React, { ReactElement, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Select from 'react-select';
import { add, cloneDeep, debounce, each, isArray, isNumber, isString, orderBy, random } from 'lodash';
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
import { generateUUID } from '../../../shared/helpers/id.helper';
import { useBackendState } from '../hooks/useBackendState.hook';
import { evalPluginCode } from '../managers/plugin.manager';

const omniParams = {
	search: {
		charsStart: 2
	}
}

const loadingLabelOpt = [{ label: "loading...", value:""}]

interface iOptionOmniBar {
	value: any
	label: any
	// type: "filePath" | "folder"
	payload?: {
		file?: iFile
		line?: string
		options?: iOptionOmniBar[]
	}
}

const modeLabels = {
	search: "[Search Mode]",
	explorer: "[Explorer Mode]",
	history: "[History Mode]",
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

const backendStateOmni = {
	hasBeenLoaded: false
}

export const OmniBar = (p: {
	show: boolean
	onClose: Function
	onHide: Function
	lastNotes: iFile[]
}) => {


	const [omniBarStatus, setOmniBarStatus] = useState<"editable"|"locked">("editable");
	useEffect(() => {
		omniBarElRef.current.focus()
	}, [omniBarStatus])


	const [selectedOption, setSelectedOptionInt] = useState<iOptionOmniBar[]>([]);
	const selectedOptionRef = useRef<iOptionOmniBar[]>([])
	const setSelectedOption = (nArr: iOptionOmniBar[]) => {
		
		if (!isArray(nArr)) return
		setSelectedOptionInt(nArr)
		selectedOptionRef.current = nArr
	}
	const [options, setOptionsInt] = useState<iOptionOmniBar[]>([]);
	const setOptions = (nVal: iOptionOmniBar[]) => {
		// adding html support
		// each(nVal, o => {
		// 	o.label = isString(o.label) ? <span dangerouslySetInnerHTML={{ __html: o.label  }} /> : o.label
		// })
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
		multiValueLabel: (base, state) => {
			let nbase = {...base, color: "#919090!important"}
			return  { ...nbase };
		},
		multiValueRemove: (base, state) => {
			let display = deviceType() === "mobile" ? "block" : "none"
			return !state.data.editable ? { ...base, display, opacity: "0.2", position: "relative", top: "3px" } : base;
		},
		
	}) 

	// on mousemove, events options can be hovered
	// const onMouseMove = (e:any) => {
	// 	if (isHoverEnabled.current) return
	// 	isHoverEnabled.current = true
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
	const omniBarElRef = useRef<any>()
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
					let folder = api.ui.browser.folders.current.get
					// let folder = api.ui.browser.files.active.get.folder
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

			if (inTxt === ",") {
				startHistoryMode()
			}
		}
		else if (stags[0].label === modeLabels.search) {
			searchModeLogic(stags, inTxt)
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
		else if (stags[0].label === modeLabels.history) {
			triggerHistoryModeLogic(inTxt, stags)
		}
	}

	useEffect(() => {
		updateFromChange();
		if (onChangeUpdatePlugin.current) onChangeUpdatePlugin.current()
	}, [selectedOption, inputTxt])

	// useEffect(() => {
	// }, [options])


	const baseHelp = `[OMNIBAR "ctrl+alt+space"] type "?" for search mode, "/" for explorer mode, ":" for plugin mode, "," for history mode`
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

		setOptions(loadingLabelOpt)
		// setNotePreview(null)
		setOmniBarStatus("locked")

		lastSearchId.current++
		let currId = lastSearchId.current

		getApi(api => {
			let folderPathArr = [folderPath]
			// setTimeout(() => { // @DEBUG2
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

					// let url = `http://localhost:3023/static//ctags//.resources/screenshot%2020230127%20at%20135701.jpg?token=KL3XFJdTJ7MWPtIu50OyUKlBhIszxRMdDwpd3EnSMJ1HGjLCAHaPDGjw9UcZ`
					let imageHtml = <div
						style={{
							// backgroundImage: `url('${url}')`
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
					setOmniBarStatus("editable")
					// setNotePreview(nSelec)

				})
			})
			// }, 2000) // @DEBUG2
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


	const previousPath = useRef<string>("")
	const searchModeLogic = (stags:any[], inTxt: string) => {
		// STEP 1: type a folder
		if (!stags[1]) {
			// STEP 1-1 : add automatically editable folder
			if (inTxt === "?") {
				// erase ? and put instead the current folder
				getApi(api => {
					// let folder = api.ui.browser.files.active.get.folder
					let folder = api.ui.browser.folders.current.get
					// api.ui.browser.folders.current.get
					setInputTxt(folder)
				})
			}
			if (inTxt === "") {
				// if delete whole path with backspace, instead of starting from scratch, start from where we are
				setInputTxt(previousPath.current)
			} else {
				previousPath.current = inTxt.slice(0,-1)
			}

			setHelp(`Path to search (ex:"/path/to/folder") + ENTER`)
			setOptions([{ label: inTxt, value: inTxt }])

		} else if (stags.length === 2) {
			// STEP 1-2 : show searched results
			setPreviewType("editor")
			reactToSearchTyping(inTxt, stags[1].label, stags)

		} else if (stags.length === 3 && wordSearched.current === stags[2].value) {
			setPreviewType("preview")
			// STEP 3-1 (optional) :  filter found results
			console.log(`STEP 3-1 (optional) :  filter found results`, wordSearched.current);
		} else if (stags.length === 3 || stags.length === 4) {
			console.log(`STEP 3-2 : jump to page`, { w: wordSearched.current, stags });
			let last = stags.length - 1
			if (!stags[last].payload?.file) return
			let file = stags[last].payload.file as iFile
			jumpToPath(file.path)
		}
	}

	const wordSearched = useRef<string | null>(null)
	const reactToSearchTyping = useDebounce((inputTxt: string, folder: string, options:iOptionOmniBar[]) => {
		let path = folder
		let input = inputTxt

		if (!(input && path && input.length >= omniParams.search.charsStart && path.length > 0)) {
			//
			// STEP 2: type a word n search
			//
			setHelp(`Type the searched word`)
			setOptions([])
			setTimeout(() => { omniBarElRef.current.focus()}, 100) // for mobile
			setNotePreview(null)
			wordSearched.current = ""
			// lastPathForSearch = st
			
			
			

		} else {
			
			//
			// STEP 3: search for word API
			//
			setHelp(`Searching "${input}" in "${path}" ...`)
			setOptions(loadingLabelOpt)

			let isRegex = input.includes("*")

			let nOpts: any = []
			setOptions(nOpts)

			wordSearched.current = input
			addToOmniHistory([...options, {label: input, value: input}])

			
			getApi(api => {
				api.search.word(input, path, res => { 
					each(res, (fileRes) => {
						each(fileRes.results, occurRaw => {

							let regexLabel = isRegex ? `(${input})` : ``
							let location = `${fileRes.file.path} ${regexLabel}`
							let index = occurRaw.indexOf(input)
							let l = 100
							let o = occurRaw
							let start = (index > l / 2) ? index - l / 2 : 0
							let end = index + l / 2 < o.length ? index + l / 2 : o.length
							if (o.length > l) o = o.substring(start, end)
							let occur = o
							let occurLabel = o.replaceAll(input, `<b>${input}</b>`)


							let htmlOption = <div className="path-option-wrapper">
								<div className="search-location">{location}</div>
								<div className="occur-wrapper" dangerouslySetInnerHTML={{
										__html: occurLabel
									}}/>
							</div>

							nOpts.push({
								label: htmlOption,
								value: wordSearched.current! + fileRes.file + occur + location,
								payload: {
									file: fileRes.file,
									line: occur,
									raw: occurRaw 
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
		let initialFile = nOptions[0] ? nOptions[0].payload?.file : null
		if (initialFile) setNotePreview(initialFile)
		setOptions(nOptions)
	}




///////////////////////////////////////////////////////////////////////////////
	// @ HISTORY MODE
	//
	const startHistoryMode = () => {
		setSelectedOption([
			{ value: modeLabels.history, label: modeLabels.history },
		])

	}
	useEffect(() => {
		if (backendStateOmni.hasBeenLoaded) return
		refreshOmniHistFromBackend()
		backendStateOmni.hasBeenLoaded = true
	}, [])

	type iOmniHistoryItem = {options:iOptionOmniBar[], id: string}
	const [omniHistoryInt, setOmniHistoryInt, refreshOmniHistFromBackend] = useBackendState<iOmniHistoryItem[]>('omni-history', [])
	const getOmniHistory = ():iOmniHistoryItem[] => {
		return omniHistoryInt
	}
	const addToOmniHistory = (options:iOptionOmniBar[]) => {
		console.log("addToOmniHistory")
		let labels:string[] = []
		each(options, o => {labels.push(o.label)})
		const id = labels.join(" ")
		const nItem = {options, id}

		// filter out prev items with same id
		const oldItems = omniHistoryInt.filter(i => i.id !== id)
		const nItems = [nItem, ...oldItems]

		// only keep 100 requests
		if (nItems.length > 100) nItems.splice(0, 100)
		console.log("[HIST mode] add to omnihist ",{ nItem, nItems})

		setOmniHistoryInt(nItems)
	}
		


	const triggerHistoryModeLogic = (input: string, stags: iOptionOmniBar[]) => {
		setNotePreview(null)
		if (!stags[1]) {
			// LOAD HISTORY
			const items = getOmniHistory()
			let nOpts: any = []
			setOptions(nOpts)
			each(items, i => {
				nOpts.push({ label: i.id, value:  i.id, payload: i })
			} )
			setHelp(`history mode`)
			setOptions(nOpts)

			if (input === ",") {
				setInputTxt("")
			}
		} else if (stags[1]) {
			console.log("HIST selected", stags[1])
			let nSelectedOptions = stags[1].payload?.options
			if (!nSelectedOptions) return
			// if first tag is search, destructure last option to inputTxt
			let lastItem = nSelectedOptions.pop()
			if (lastItem) setInputTxt(lastItem.label)
			setSelectedOption(nSelectedOptions)
		}
		

	
	}
	// const onChangeUpdatePlugin = useRef<any>(null)










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
				
			} else if (stags.length >= 2) {
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
					disableCache: disableCachePlugins,
				}

				let plugin = stags[1].value as iPlugin
				setOptions(loadingLabelOpt)
				getApi(tiroApi => {
					evalPluginCode(plugin,{barApi, tiroApi})
				})
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
	const [notePreviewWindowId, setNotePreviewWindowId] = useState<string>(generateUUID());
	const [notePreview, setNotePreviewInt] = useState<iFile | null>(null);
	const setNotePreview = (file:iFile | null) => {
		// console.log("setNotePreview", file)
		setNotePreviewInt(file)
	}	
	const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
	const [searchedString, setSearchedString] = useState<string | undefined>(undefined);

	const onActiveOptionChange = (file: iFile, searchedString?: string) => {
		let stags = selectedOptionRef.current

		// EXPLORER
		if (stags[0] && stags[0].label === modeLabels.explorer) {
			setNotePreview(file)

		} else if (stags[0] && stags[0].label === modeLabels.search) {
			// WORD SEARCH JUMP INSIDE FILE
			setNotePreview(file)
			// we dont use an internal active line system but the more global editorAction system api
			// console.log("SEARCHWORD1", searchedString, file.path, stags);
			setTimeout(() => {
				setSearchedString(searchedString)
				// getApi(api => {
				// 	api.ui.note.editorAction.dispatch({
				// 		type:"searchWord", 
				// 		searchWordString: inputTxt,
				// 		windowId: notePreviewWindowId
				// 	})	
				// })
				// as opening the searchbar automatically focus, retake the focus
				// omniBarElRef.current.focus()
				// setTimeout(()=>{
				// 	omniBarElRef.current.focus()
				// 	setTimeout(()=>{
				// 		omniBarElRef.current.focus()
				// 	},100)
				// },50)
			}, 300)
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
					if (!payload) return
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
			<div className={`omnibar-popup-wrapper device-${deviceType()} ${omniBarStatus}`}>
				<div className="flex-wrapper"
					onClick={e => {
						e.stopPropagation()
					}}
				>
					<div className="select-wrapper" ref={omniBarWrapper}>
						<div className="help">
							{help}
						</div>
						<div className="help-right" onClick={e => { p.onHide() }}>
							<Icon name="faEyeSlash" color={`#b2b2b2`} />
						</div>
						<Select
							isMulti

							ref={omniBarElRef}
							menuIsOpen={true}
							defaultValue={defaultValue}
							value={selectedOption}
							autoFocus={true}
							isDisabled={(omniBarStatus === "locked")}
							// isLoading={(omniBarStatus === "locked")}
							// is

							onChange={onChange}
							// components={{ Option: CustomOption }}
							// openMenuOnClick={e => { console.log("wooooo"); }}
							openMenuOnClick={false}

							inputValue={inputTxt}
							onInputChange={onInputChange}
							onFocus={onFocus}

							// options={options}
							options={options}
							// isClearable={false}
							styles={styles}
							noOptionsMessage={() => {
								// setNotePreview(null)
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
									showToolbar={true}
									showTitleEditor={false}
									searchedString={searchedString}
									height={previewHeight}
									view={previewType}
									windowId={notePreviewWindowId}
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
								&.locked {
									pointer-events:none;
								}
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


