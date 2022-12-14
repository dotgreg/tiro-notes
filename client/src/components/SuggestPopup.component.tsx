import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Popup } from './Popup.component';
import Select from 'react-select';
import { each } from 'lodash';
import { iFile } from '../../../shared/types.shared';
import { getApi } from '../hooks/api/api.hook';

// const optionsStart = [
// 	{ value: 'chocolate', label: 'Chocolate' },
// 	{ value: 'strawberry', label: 'Strawberry' },
// 	{ value: 'vanilla', label: 'Vanilla' },
// ];

// const optionsSecond = [
// 	{ value: 'sub11/', label: 'sub11/' },
// 	{ value: 'sub12/', label: 'sub12/' },
// 	{ value: 'sub13/', label: 'sub13/' },
// 	{ value: 'f1.md', label: 'f1.md' },
// 	{ value: 'f2.md', label: 'f2.md' },
// ];
// const optionsLoading = [
// 	// { value: "loading...", label: "loading..." }
// ]




interface iOptionSuggest {
	value: string
	label: string
	// type: "filePath" | "folder"
	payload?: {
		file?: iFile
	}
}


export const SuggestPopup = (p: {
	onClose: Function
	lastNotes: iFile[]
}) => {


	const [selectedOption, setSelectedOption] = useState<any>(null);
	const [options, setOptions] = useState<any[]>([]);
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


	useEffect(() => {
		let nOptions = filesToOptions(p.lastNotes)
		// intervert el 1 and el 2
		let o1 = nOptions.shift() as iOptionSuggest
		let o2 = nOptions.shift() as iOptionSuggest
		nOptions.unshift(o1)
		nOptions.unshift(o2)
		setOptions(nOptions)
		console.log(3333, nOptions, selectedOption);
	}, [p.lastNotes])

	// useEffect(() => {
	// let noOptions = false
	// //if (selectedOption && selectedOption.length >= 3) noOptions = true
	// const s = selectedOption
	// if (s && s[s.length - 1]?.value?.endsWith(".md")) noOptions = true
	// else noOptions = false
	// LOAD OPTIONS ACCORDING TO VALUE
	// if (s && s[0] && s[0].value === "chocolate") {
	// 	setOptions(!noOptions ? optionsLoading : [])

	// 	if (noOptions) return
	// 	setNoOptionLabel("loading...")
	// 	setTimeout(() => {
	// 		setOptions(!noOptions ? optionsSecond : [])
	// 		setNoOptionLabel("No Options")
	// 	}, 1000)
	// }
	// }, [selectedOption])

	const styles: any = {
		multiValue: (base, state) => {
			// console.log(333002, base, state.data);
			return !state.data.editable ? { ...base, backgroundColor: 'gray' } : base;
		},
		multiValueRemove: (base, state) => {
			return !state.data.editable ? { ...base, display: 'none' } : base;
		},
		// indicatorsContainer: (base, state) => {
		// 	return { ...base, display: 'none' }
		// }
	}



	const onChange = (nOptions: any, actionObj: any) => {
		if (actionObj.action === 'remove-value' && !actionObj.removedValue?.editable) return false

		// MODIFY SELECTED OPTIONS, only last is modifiable
		each(nOptions, (o: any, i: number) => {
			// console.log(33332, o.value, i, nOptions.length);
			o.editable = false
			if (i === nOptions.length - 1) {
				// console.log(333004, "LAST EL IS", o.value);
				o.editable = true
			}
		})


		//
		// SELECTING LAST NOTE
		//
		// if ( === null) return
		let s = nOptions[0]

		if (s && s.payload && s.payload.file) {
			let file = s.payload.file
			getApi(api => {
				// console.log(444444, api, file);
				api.ui.browser.goTo(file.folder, file.name, { openIn: 'activeWindow' })
				p.onClose()
			})
			nOptions = []
		}


		// update it
		setSelectedOption(nOptions)
	}

	const selectRef = useRef<any>()
	useEffect(() => {
		// selectRef.current.focus()
	}, [])
	let defaultValue = options[0] || { label: "", value: "" }

	return (
		<div className="suggest-popup-bg"
			onClick={e => { p.onClose() }}>
			<div className="suggest-popup-wrapper">
				<Popup title={``} onClose={() => { p.onClose() }} >
					<Select
						isMulti

						ref={selectRef}
						menuIsOpen={true}
						defaultValue={defaultValue}
						value={selectedOption}
						autoFocus={true}

						onChange={onChange}
						options={options}

						// isClearable={false}
						styles={styles}
						noOptionsMessage={() => noOptionLabel}
					/>

				</Popup >
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
`
