import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Popup } from './Popup.component';
import Select from 'react-select';
import { each, isArray, isNumber } from 'lodash';
import { iFile } from '../../../shared/types.shared';
import { getApi } from '../hooks/api/api.hook';
import { pathToIfile } from '../../../shared/helpers/filename.helper';
import { cssVars } from '../managers/style/vars.style.manager';
import { useDebounce } from '../hooks/lodash.hooks';


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
	explorer: "[Explorer Mode]"
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
	const [options, setOptions] = useState<any[]>([]);
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
	// const [inputValue, setInputTxt] = useState("");
	// const onInputValueUpdate = (nVal:string) =
	const onInputChange: any = (txt: string) => {
		setInputTxt(txt.trim())
		// setInputTxt(txt.trim())
	}



	///////////////////////////////////////////////////////
	// UPDATE LOGIC
	// 
	const histPath = useRef("")
	const updateFromChange = () => {
		// at first, according to first char, switch mode
		// console.log("================================");
		// console.log(3333, selectedOption.length, selectedOptionRef.current.length, inputTxt);
		let stags = selectedOptionRef.current

		if (stags.length === 0) {
			// console.log(110000, inputTxt, inputValue);
			if (inputTxt === "/") {
				getApi(api => {
					console.log(1111111111);
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

		}
		else if (stags[0].label === modeLabels.search) {

			// IF SEARCH MODE 
			if (!stags[1]) {
				setHelp(`input the path to search in (ex:"/path/to/folder")`)
				setOptions([{ label: inputTxt, value: inputTxt }])
			} else if (stags.length === 2) {
				reactToSearchTyping(inputTxt, stags[1].label)
			} else if (stags.length === 3) {
				let file = stags[2].value as iFile
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
	}

	useEffect(() => {
		updateFromChange();
	}, [selectedOption, inputTxt])



	const baseHelp = `"?" for search mode, "/" for explorer mode`
	const [help, setHelp] = useState(baseHelp)

	///////////////////////////////////////////////////////
	// MODES LOGIC
	//

	//
	// EXPLORER MODE
	//
	const triggerExplorer = (folderPath: string) => {
		console.log("== EXPLORER", folderPath);
		if (folderPath === "") return
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




	//
	// SEARCH MODE
	//
	const startSearchModeLogic = () => {
		getApi(api => {
			// erase ? and put instead the current folder
			let folder = api.ui.browser.files.active.get.folder
			setSelectedOption([
				{ value: modeLabels.search, label: modeLabels.search },
			])
			setInputTxt(folder)
		})
	}

	const reactToSearchTyping = useDebounce((inputTxt: string, folder: string) => {
		let path = folder
		let input = inputTxt

		if (input && path && input.length > 2 && path.length > 0) {
			setHelp(`Searching "${input}" in "${path}" ...`)
			let nOpts: any = []
			setOptions(nOpts)

			getApi(api => {
				api.search.word(input, path, res => {
					each(res, (fileRes) => {
						each(fileRes.results, occur => {
							let label = `[${fileRes.file.path}] ${occur}`
							nOpts.push({ label, value: fileRes.file })
						})
					})
					setHelp(`${nOpts.length} results found for "${input}" in "${path}" `)
					setOptions(nOpts)
				})
			})

		} else {
			setHelp(`Type the word searched`)
			setOptions([])
		}
	}, 500)



	//
	// LAST NOTES MODE
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

	return (
		<div className="suggest-popup-bg"
			onClick={e => { p.onClose() }}>
			<div className="suggest-popup-wrapper">
				<div>
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

						inputValue={inputTxt}
						onInputChange={onInputChange}

						options={options}

						// isClearable={false}
						styles={styles}
						noOptionsMessage={() => noOptionLabel}
					/>

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
`
