import styled from '@emotion/styled';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Popup } from './Popup.component';
import Select from 'react-select';
import { each } from 'lodash';
import { ClientApiContext, getClientApi2 } from '../hooks/api/api.hook';


type iOptionSuggest = { value: string, label: string, editable?: boolean }
const createOption = (str: string): iOptionSuggest => {
	let label = `/${str}`.replace("//", "/")
	const res: iOptionSuggest = { value: str, label }
	return res
}

const mergeToFolderPath = (opts: iOptionSuggest[]): string => {
	let res = ``
	each(opts, o => res += o.value + "/")
	return res
}


export const SuggestBar = (p: {
	defaultPath: string,
	onSelected: (nPath: string) => void
}) => {

	useEffect(() => {
		const arr = p.defaultPath.split("/").filter(e => e !== "")
		const nSelected = arr.map(s => createOption(s))
		nSelected[nSelected.length - 1].editable = true
		updateOptionsFromBackend(nSelected)
		setSelectedOption(nSelected)
	}, [p.defaultPath])

	const updateOptionsFromBackend = (nSelected: iOptionSuggest[]) => {

		const folderToSearch = mergeToFolderPath(nSelected)

		if (cachedOptions[folderToSearch]) setOptions(cachedOptions[folderToSearch])

		getClientApi2().then(api => {
			api.files.getSuggestions(folderToSearch, suggestions => {
				console.log(333007, suggestions);
				const nOptions: iOptionSuggest[] = []
				each(suggestions, s => nOptions.push(createOption(s)))
				cachedOptions[folderToSearch] = nOptions
				setCachedOptions(cachedOptions)
				setOptions(cachedOptions[folderToSearch])
			})
		})
	}


	//
	// OPTIONS LOADER AND CHOSER LOGIC
	//
	const [selectedOption, setSelectedOption] = useState<iOptionSuggest[]>([]);
	const [options, setOptions] = useState<iOptionSuggest[]>([]);
	const [cachedOptions, setCachedOptions] = useState<{ [folderPath: string]: iOptionSuggest[] }>({});
	const [noOptionLabel, setNoOptionLabel] = useState("No Options")
	useEffect(() => {
		let noOptions = false
		const s = selectedOption
		if (s && s[s.length - 1]?.value?.endsWith(".md")) noOptions = true
		else noOptions = false

		// LOAD OPTIONS ACCORDING TO VALUE
		// if (s && s[0] && s[0].value === "chocolate") {
		// 	setOptions(!noOptions ? optionsLoading : [])

		// 	if (noOptions) return
		// 	setNoOptionLabel("loading...")
		// 	setTimeout(() => {
		// 		setOptions(!noOptions ? optionsSecond : [])
		// 		setNoOptionLabel("No Options")
		// 	}, 100)
		// }
		updateOptionsFromBackend(selectedOption)
	}, [selectedOption])

	const styles: any = {
		multiValue: (base, state) => {
			// console.log(333002, base, state.data);
			return !state.data.editable ? { ...base, backgroundColor: 'rgba(0,0,0,0.05)' } : base;
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

		setSelectedOption(nOptions)
	}

	return (
		<div className="suggest-bar">

			<Select
				isMulti
				menuIsOpen={options.length > 0}
				value={selectedOption}
				onChange={onChange}
				options={options}
				// isClearable={false}
				styles={styles}
				noOptionsMessage={() => noOptionLabel}
			/>

		</div >
	)
}

export const suggestBarCss = () => `
&.device-view-mobile {
}

suggest-popup-wrapper {

}
`
