import styled from '@emotion/styled';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Popup } from './Popup.component';
import Select from 'react-select';
import { each } from 'lodash';

const optionsStart = [
	{ value: 'chocolate', label: 'Chocolate' },
	{ value: 'strawberry', label: 'Strawberry' },
	{ value: 'vanilla', label: 'Vanilla' },
];

const optionsSecond = [
	{ value: 'sub11/', label: 'sub11/' },
	{ value: 'sub12/', label: 'sub12/' },
	{ value: 'sub13/', label: 'sub13/' },
	{ value: 'f1.md', label: 'f1.md' },
	{ value: 'f2.md', label: 'f2.md' },
];
const optionsLoading = [
	// { value: "loading...", label: "loading..." }
]

export const SuggestPopup = (p: {
	onClose: Function
}) => {


	const [selectedOption, setSelectedOption] = useState<any>(null);
	const [options, setOptions] = useState<any[]>(optionsStart);
	const [noOptionLabel, setNoOptionLabel] = useState("No Options")

	useEffect(() => {
		let noOptions = false
		//if (selectedOption && selectedOption.length >= 3) noOptions = true
		const s = selectedOption
		if (s && s[s.length - 1]?.value?.endsWith(".md")) noOptions = true
		else noOptions = false

		// LOAD OPTIONS ACCORDING TO VALUE
		if (s && s[0] && s[0].value === "chocolate") {
			setOptions(!noOptions ? optionsLoading : [])

			if (noOptions) return
			setNoOptionLabel("loading...")
			setTimeout(() => {
				setOptions(!noOptions ? optionsSecond : [])
				setNoOptionLabel("No Options")
			}, 1000)

		}
	}, [selectedOption])

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

		setSelectedOption(nOptions)
	}

	return (<div className="suggest-popup-wrapper"> <Popup title={`suggest`} onClose={() => { p.onClose() }} > woop suggest

		<Select
			isMulti
			menuIsOpen={true}
			value={selectedOption}
			onChange={onChange}
			options={options}
			// isClearable={false}
			styles={styles}
			noOptionsMessage={() => noOptionLabel}
		/>

	</Popup >
	</div >
	)
}

export const suggestPopupCss = () => `
&.device-view-mobile {
}

suggest-popup-wrapper {

}
`
