import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Popup } from './Popup.component';
import Select from 'react-select';
import { each, isArray, isNumber, orderBy, random } from 'lodash';
import { iFile } from '../../../shared/types.shared';
import { getApi } from '../hooks/api/api.hook';
import { pathToIfile } from '../../../shared/helpers/filename.helper';
import { cssVars } from '../managers/style/vars.style.manager';
import { useDebounce } from '../hooks/lodash.hooks';
import { sharedConfig } from '../../../shared/shared.config';
import { NotePreview } from './NotePreview.component';


interface iOptionSuggest {
	value: string
	label: string
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

export const SuggestPopup = (p: {
	onClose: Function
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

	const filesToOptions = (files: iFile[]): iOptionSuggest[] => {
		let res: iOptionSuggest[] = []
		each(files, file => {
			let nOption: iOptionSuggest = {
				value: file.path,
				label: file.path,
				payload: { file }
			}
			res.push(nOption)
		})
		return res
	}







	//
	// STYLING
	//
	const styles: any = {
		// indicatorContainer: (base, state) => {
		// 	return { ...base, display: "none" }
		// },
		indicatorsContainer: (base, state) => {
			return { ...base, display: "none" }
		},
		// IndicatorsContainer: (base, state) => {
		// 	return { ...base, display: "none" }
		// },
		menu: (base, state) => {
			return { ...base, position: "relative", pointerEvents: "none" }
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
	}









	const onChange = (nOptions: any, actionObj: any) => {
		// console.log(33333333333);

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
	const onInputChange: any = (txt: string) => {
		setInputTxt(txt.trim())
	}










	///////////////////////////////////////////////////////
	// @ MAIN UPDATE LOGIC
	// 

	const histPath = useRef("")
	const updateFromChange = () => {
		// console.log(222222222222);
		// at first, according to first char, switch mode
		// console.log("================================");
		// console.log(3333, selectedOption.length, selectedOptionRef.current.length, inputTxt);
		let stags = selectedOptionRef.current

		if (stags.length === 0) {
			if (inputTxt === "/") {
				getApi(api => {
					// erase /
					setInputTxt("")
					let folder = api.ui.browser.files.active.get.folder
					triggerExplorer(folder)
				})
			}

			if (inputTxt === "") {
				startLastNotesModeLogic()
			}

			if (inputTxt === "?") {
				startSearchModeLogic()
			}

			if (inputTxt === ":") {
				startPluginMode()
			}
		}
		else if (stags[0].label === modeLabels.search) {

			// IF SEARCH MODE 
			if (!stags[1]) {
				// STEP 1 : add automatically editable folder
				if (inputTxt === "?") {
					// erase ? and put instead the current folder
					getApi(api => {
						let folder = api.ui.browser.files.active.get.folder
						setInputTxt(folder)
					})
				}
				setHelp(`Path to search (ex:"/path/to/folder") + ENTER`)
				setOptions([{ label: inputTxt, value: inputTxt }])

			} else if (stags.length === 2) {
				// STEP 2 : show searched results
				reactToSearchTyping(inputTxt, stags[1].label)

			} else if (stags.length === 3 && wordSearched.current === stags[2].value) {
				// STEP 3-1 (optional) :  filter found results
				console.log(`STEP 3-1 (optional) :  filter found results`, wordSearched.current);

			} else if (stags.length === 3 || stags.length === 4) {
				console.log(`STEP 3-2 : jump to page`, { w: wordSearched.current, stags });
				let last = stags.length - 1
				let file = stags[last].value as iFile
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
			triggerPluginLogic(inputTxt, stags)
		}
	}

	useEffect(() => {
		updateFromChange();
	}, [selectedOption, inputTxt])

	// useEffect(() => {
	// 	console.log(1100, options, options.length);
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
	const triggerExplorer = (folderPath: string) => {
		console.log("== EXPLORER", folderPath);
		if (folderPath === "") return
		setOptions([{ label: "loading..." }])
		setNotePreview(null)

		getApi(api => {
			api.folders.get([folderPath], folderHierar => {
				let parent = folderHierar.folders[0]
				if (!parent) return
				let folders = folderHierar.folders[0].children
				api.files.get(folderPath, files => {

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

					// create suggestions from folders and files
					let nOpts: iOptionSuggest[] = []

					each(folders, f => {
						let arr = f.path.split("/")
						let last = arr[arr.length - 1] + "/"
						nOpts.push({ value: last, label: last })
					})
					each(files, f => {
						let arr = f.path.split("/")
						let last = arr[arr.length - 1]
						nOpts.push({ value: last, label: last })
					})

					// console.log(123333, nSelec, nOpts);
					setSelectedOption(nSelec)
					setOptions(nOpts)

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

			let nOpts: any = []
			setOptions(nOpts)

			wordSearched.current = input

			getApi(api => {
				api.search.word(input, path, res => {
					nOpts.push({ label: `Filter results for "${wordSearched.current}"`, value: wordSearched.current })
					each(res, (fileRes) => {
						each(fileRes.results, occur => {
							let label = `[${fileRes.file.path}] ${occur}`
							nOpts.push({
								label, value: fileRes.file, payload: {
									file: fileRes.file,
									line: occur
								}
							})
						})
					})
					setHelp(`${nOpts.length} results found for "${input}" in "${path}" `)
					setOptions(nOpts)
				})
			})

		} else {
			setHelp(`Type the word searched`)
			setOptions([])
			wordSearched.current = ""
		}
	}, 500)
















	///////////////////////////////////////////////////////////////////////////////
	// @ LAST NOTES MODE
	//
	const startLastNotesModeLogic = () => {
		setHelp(baseHelp)
		let nOptions = filesToOptions(p.lastNotes)
		// console.log(123, nOptions);

		// intervert el 1 and el 2
		let o1 = nOptions.shift() as iOptionSuggest
		let o2 = nOptions.shift() as iOptionSuggest
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

	// const [, updateState] = useState<any>();
	// const forceUpdate = useCallback(() => updateState({}), []);

	const triggerPluginLogic = (input: string, stags: any[]) => {
		setNotePreview(null)

		// STEP 1 : SELECT PLUGIN
		if (stags.length === 1) {
			// scan the bar_plugins folder
			let pluginsBarFolder = `/${sharedConfig.path.configFolder}/bar_plugins/`

			// setOptions(nOpts)
			getApi(api => {
				// let nOpts: any = []
				let nOpts: any = []
				api.files.get(pluginsBarFolder, files => {
					// console.log(332, files, pluginsBarFolder);
					each(files, f => {
						nOpts.push({ label: f.name.replace('.md', ''), value: f })
					})
					// order alphabetically
					nOpts = orderBy(nOpts, ["label"])

					setOptions(nOpts)
					if (input === ":") setInputTxt("")
					setHelp(`${files.length} plugins found in "${pluginsBarFolder}"`)
					// forceUpdate()
				})
			})
		}
		// STEP 2 : LOAD CONTENT, EVAL INPUTTXT AND SEND IT BACK
		else if (stags.length === 2) {
			let file = stags[1].value

			getApi(tiroApi => {
				const execPlugin = (pluginName: string) => {
					let pluginContent = cachedPlugins.dict[pluginName]

					//
					// BAR API
					//
					const loadBarPlugin = (url: string, bApi, tApi) => {
						let noCache = !cachedPlugins.config.enabled
						tiroApi.ressource.fetch(url, txt => {
							try {
								new Function('barApi', 'tiroApi', txt)(bApi, tApi)
							} catch (e) {
								let message = `[ERROR LOADING PLUGIN BAR]: ${JSON.stringify(e)}"`
								console.log(message);
							}
						}, { disableCache: noCache })
					}

					let barApi = {
						input, setInputTxt,
						options, setOptions,
						loadBarPlugin, disableCache: disableCachePlugins
					}
					// we directly eval it!
					try {
						new Function('barApi', 'tiroApi', pluginContent)(barApi, tiroApi)
					} catch (e) {
						let message = `[ERROR PLUGIN BAR]: ${JSON.stringify(e)}"`
						console.log(message);
					}


				}


				if (cachedPlugins.dict[file.name]) {
					execPlugin(file.name)
				} else {
					tiroApi.file.getContent(file.path, pluginContent => {
						cachedPlugins.dict[file.name] = pluginContent
						execPlugin(file.name)
					})
				}
			})
		}
	}


	//////////////////////////////////////////////////////////////////////
	// @ Note preview
	//


	//
	// system to find current note highlighted... using class detection...
	//
	const [notePreview, setNotePreview] = useState<iFile | null>(null);
	const [activeLine, setActiveLine] = useState<string | undefined>(undefined);
	const onActiveOptionChange = (file: iFile, activeLine?: string) => {
		let stags = selectedOptionRef.current

		if (stags[0] && stags[0].label === modeLabels.search) {
			// SEARCH
			setNotePreview(file)
			setActiveLine(activeLine)
			console.log("SEARCH JUMP TO", activeLine, file.path);

		} else if (!stags[0]) {
			// LAST NOTES
			setNotePreview(file)

		} else {
			console.log("CLOSING 2");
			setNotePreview(null)
		}
	}

	// useEffect(() => {
	// 	let obs: any[] = []
	// 	// setTimeout(() => {
	// 	const optDivs = document.querySelectorAll("div[id*='-option']");
	// 	// console.log("111 - optsDivs", options.length, optDivs.length);

	// 	each(optDivs, (o, i) => {
	// 		const observerOptions = {
	// 			childList: true,
	// 			attributes: true,
	// 			subtree: false
	// 		}
	// 		const observer = new MutationObserver((e) => {
	// 			// @ts-ignore
	// 			console.log("112 - class change", i);
	// 			const style = getComputedStyle(o);
	// 			let bg = style["background-color"]
	// 			if (bg !== "rgba(0, 0, 0, 0)" && options[i] && options[i].payload) {
	// 				let payload = options[i].payload
	// 				let file = payload.file as iFile
	// 				let line = payload.line || undefined
	// 				console.log("113 - good change", i);
	// 				onActiveOptionChange(file, line)
	// 			} else {
	// 			}
	// 		});
	// 		observer.observe(o, observerOptions);
	// 		obs.push(observer)
	// 	})
	// 	return () => {
	// 		each(obs, ob => {
	// 			ob.disconnect()
	// 		})
	// 	}
	// }, [options, selectedOption, inputTxt])

	let obs = useRef<any[]>([])
	const listenToOptionsClasses = (nVal: any[]) => {

		// clean old observer
		each(obs.current, ob => {
			ob.disconnect()
		})
		obs.current = []

		// restart listeners
		const optDivs = document.querySelectorAll("div[id*='-option']");
		// console.log("111 - optsDivs", options.length, optDivs.length);

		each(optDivs, (o, i) => {
			const observerOptions = {
				childList: true,
				attributes: true,
				subtree: false
			}
			const observer = new MutationObserver((e) => {
				// @ts-ignore
				console.log("112 - class change", i);
				const style = getComputedStyle(o);
				let bg = style["background-color"]
				if (bg !== "rgba(0, 0, 0, 0)" && options[i] && options[i].payload) {
					let payload = options[i].payload
					let file = payload.file as iFile
					let line = payload.line || undefined
					console.log("113 - good change", i);
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

		console.log(1122, nVal.length);
	}, 100)












	//
	// RENDERING
	//
	return (
		<div className="suggest-popup-bg"
			onClick={e => { p.onClose() }}>
			<div className="suggest-popup-wrapper">
				<div className="flex-wrapper" onClick={e => { e.stopPropagation() }}>
					<div className="help">
						{help}
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

						inputValue={inputTxt}
						onInputChange={onInputChange}

						options={options}

						// isClearable={false}
						styles={styles}
						noOptionsMessage={() => noOptionLabel}
					/>
					<div className="preview-wrapper">
						{notePreview &&
							<NotePreview
								file={notePreview}
								searchedString={activeLine}
							/>
						}
					</div>

				</div>
			</div >
		</div >
	)
}

export const suggestPopupCss = () => `
						&.device-view-mobile {
						}

						.suggest-popup-bg {
								background: rgba(0,0,0,0.5);
								top: 0px;
								left: 0px;
								width: 100vw;
								height: 100vh;
								z-index: 1000;
								position: absolute;
						}
						.suggest-popup-wrapper {
								width: 70%;
								margin: 0 auto;
								z-index: 100;
								position: absolute;
								left: 50%;
								transform: translate(-50%);
								top: 22px;
						}
						.help {
								color:white;
								margin-bottom: 10px;
						}


						/* 						.flex-wrapper { */
						/* 								display: flex; */
						/* 								flex-direction: column; */
						/* 								height: 100vh; */
						/* 								.help { */
						/* 								} */
						/* 								.search-wrapper { */
						/* 								} */
						/* .preview-wrapper { */
						/* flex: 1; */
						/* } */
						/* 						} */
.preview-wrapper {
	max-height: 45vh;
		overflow-y: scroll;
		background: white;
		border-radius: 5px;
}



						`


