import { css } from '@emotion/css';
import { SerializedStyles } from '@emotion/react';
import { isBoolean, last, set } from 'lodash-es';
import React, { useEffect, useRef, useState } from 'react';
import { getFontSize } from '../managers/font.manager';
import { useBackendState } from '../hooks/useBackendState.hook';
import { Icon2 } from './Icon.component';
import { getApi } from '../hooks/api/api.hook';
import { userSettingsSync } from '../hooks/useUserSettings.hook';

export type OptionObj = { key: number | string, label: string, obj: any }
export type iInputSelectOptionObj = OptionObj
export type InputType = 'password' | 'text' | 'select' | 'number' | 'checkbox' | 'textarea' | 'date' | 'datetime'
export type InputValue = string | number | boolean | undefined

export const Input = (p: {
	id?: string
	label?: string
	labelStyle?: "normal" | "bold"
	type?: InputType
	list?: OptionObj[]
	explanation?: string
	value?: InputValue
	onChange?: (res: string) => void
	onCheckedChange?: (res: boolean) => void
	onSelectChange?: (res: string) => void
	onLoad?: (res: any) => void
	onFocus?: Function
	onEnterPressed?: Function
	shouldFocus?: boolean
	shouldNotSelectOnClick?: boolean
	readonly?: boolean
	style?: string
	step?:number
	max?: number
	min?: number
	rememberLastValue?: boolean // if not false, will keep last value of that field in backend storage based on the id of the input ONLY WORKS IF ID PARAM EXISTS
	aiSuggest?: string
	aiSuggestAutoInsert?: boolean
}) => {

	const inputRef = useRef<any>()
	const focusToInput = () => {
		if (p.shouldFocus) {
			inputRef.current.focus()
		}
	}


	useEffect(() => {
		focusToInput()
	}, [p.shouldFocus])
	useEffect(() => {
		focusToInput()
	}, [])


	let isChecked = p.type === "checkbox" && (p.value === true || p.value === 'true')
	let value = p.value
	const [valueSelect, setValueSelect] = useState<string>(value as string)	
	if (isBoolean(value)) value = ""
	

	//
	//
	// DEFAULT VAL
	//
	//
	let typeField:any = p.type
	const genDefaultVal = (value) => {
		let defaultVal = value
		// if date, value is today if not provided
		if (p.type === 'date' && !value) {
			defaultVal = new Date().toISOString().split('T')[0]
		}
		if (p.type === 'datetime') {
			typeField = 'datetime-local'
			defaultVal = new Date().toISOString().substring(0, 16)
			// replace 5 last numbers by 12:00
			defaultVal = defaultVal.substring(0, defaultVal.length - 5) + '12:00'
		}
		return defaultVal
	}
	let defaultVal = genDefaultVal(value)
	// useEffect(() => {
	// 	p.onLoad && p.onLoad(defaultVal)
	// },[])


	//
	// LAST VALUE
	//
	let backendIdLastValue = `input-lastvalue-id-${p.id}`
	const [lastValue, setLastValue, refreshLastValue] = useBackendState<InputValue>(backendIdLastValue, "")
	useEffect(() => {
		if (!p.id || !p.rememberLastValue) return
		refreshLastValue()
	}, [p.value])
	if (!p.id && p.rememberLastValue) console.error("!!!!! Input component: rememberLastValue is true but no id is provided, cannot remember last value without id !!!!!")
	let activateRememberLastValue = p.id && p.rememberLastValue && (value !== defaultVal || value !== "")
	useEffect(() => {
		let finalValue = defaultVal
		if (activateRememberLastValue)	finalValue = lastValue
		p.onLoad && p.onLoad(finalValue)
		setValueInt(finalValue)
	}, [lastValue])
	const [valueInt, setValueInt] = useState<InputValue>(value)





	const labelClicked = () => {
		if(p.type==="checkbox") {
			inputRef.current.checked = !inputRef.current.checked
			p.onChange && p.onChange(inputRef.current.checked)
		}
	}
	const processChange = (val: string) => {
		let nval: any = val
		// if type number, convert to number, then if max/min is set, check if it is in range
		if (p.type === 'number') {
			// nval = parseFloat(nval)
			if (p.max && nval > p.max) nval = p.max
			if (p.min && nval < p.min) nval = p.min
			nval = nval.toString()
		}
		if (activateRememberLastValue) setLastValue(nval)
		p.onChange && p.onChange(nval)
		setValueInt(nval)
	}




	//
	// AI SUGGEST PROMPT
	//
	const [aiSuggestResult, setAiSuggestResult] = useState<string>("...")
	const [aiSuggestCounter, setAiSuggestCounter] = useState<number>(0)
	const [showAiButtons, setShowAiButtons] = useState<boolean>(false)

	const aiInsertVal = (val:string) => {
		if (p.type === "select") {
			setValueSelect(val)
			// p.onSelectChange && p.onSelectChange(val)
			return
		}
		setValueInt(val)
	}
	
	let aiNameCommandSuggest = userSettingsSync.curr['ui_editor_ai_suggest_form_command']
	useEffect(() => {
		if (p.aiSuggest !== undefined && p.aiSuggest.length > 0 )  {
			let aiAsk = p.aiSuggest
			setAiSuggestResult("...")
			setShowAiButtons(false)
			let aiAskInstructions = `you will be outputed into a ${typeField} field in a form.`
			if (typeField === "date") {
				aiAskInstructions += ` The date format to output is YYYY-MM-DD.`
			}
			if (typeField === "select") {
				aiAskInstructions += ` The options to output are either: ${p.list?.map(opt => opt.label).join(", ")}.`
			}
			aiAsk =  "INSTRUCTIONS: " + aiAskInstructions + `\nProvide only the raw value to input, without any additional explanations. \n\n` + aiAsk
			getApi(api => {
				api.ai.exec(aiAsk, aiNameCommandSuggest, (result) => {
					setAiSuggestResult(result)
					if (p.aiSuggestAutoInsert) {
						aiInsertVal(result)
					}
					setShowAiButtons(true)
				})
			})
		}
	}, [p.aiSuggest, aiSuggestCounter])



	return (
		<div className={`input-component-wrapper ${p.style ? css`${p.style}` : ''}`}>
		<div className={`input-component ${p.id ? p.id : ''} ${p.type}`}>
			{
				p.label && <span className={`label ${p.labelStyle}`} onClick={e => labelClicked()}>{p.label} </span>
			}
			<div className="input-wrapper">
				{p.type !== 'select' && p.type !== 'textarea' && <input
					ref={inputRef}
					type={typeField ? typeField : 'text'}
					defaultValue={defaultVal}
					value={valueInt as any}
					checked={isChecked}
					readOnly={p.readonly}
					max={p.max}
					min={p.min}
					step={p.step}
					onFocus={() => { p.onFocus && p.onFocus() }}
					onClick={() => { !p.shouldNotSelectOnClick && inputRef.current.select() }}
					onKeyPress={e => {
						// @ts-ignore
						var keyCode = e.code || e.key;
						if (keyCode == 'Enter' && p.onEnterPressed) p.onEnterPressed()
					}}
					onChange={(e) => {
						p.onCheckedChange && p.onCheckedChange(e.target.checked)
						processChange(e.target.value)
					}} />}

				{
					// if valueInt != "", create a x button that reinit to ""
					(valueInt != "" && valueInt != undefined) && <div className="input-clear-btn" onClick={() => setValueInt("")} > <Icon2 name="circle-xmark"  /></div>
				}

				{p.type === 'select' &&
					<select
						value={value}
						multiple={true}
						onChange={(e) => {
							let value = Array.from(e.target.selectedOptions, option => option.label);
							// from array to string separated by ,
							let valueStr = value.join(',')
							// setValueSelect(valueStr)
							p.onSelectChange && p.onSelectChange(valueStr)
						}}>

						{
							p.list?.map((opt, i) =>
								<option
									value={opt.key}
								// selected={value === opt.key ? true : false}
								>{opt.label} </option>
							)
						}
					</select>
				}
				{p.type === 'textarea' &&
					<textarea
						defaultValue={value}
						onChange={(e) => {
							p.onChange && p.onChange(e.target.value)
						}}>
					</textarea>
				}

				{p.aiSuggest && <div className="ai-suggestion"> 
					<span className="result">{ p.aiSuggestAutoInsert ? "Ai suggestion inserted " : `Ai suggestion: ${aiSuggestResult}`}</span>  
					{
						showAiButtons && <>
							<span onClick={() => {setAiSuggestCounter(aiSuggestCounter + 1)}}><Icon2 name="refresh" /></span>
							<span onClick={() => {aiInsertVal(aiSuggestResult)}}><Icon2 name="file-import" /></span>
						</>
					}
				</div>}
				
				{p.explanation && <div className="explanation"> {p.explanation} </div>}
			</div>
		</div>
		</div>
	)
}

export const inputComponentCss = () => `
    .input-component {
        display: flex;
        align-items: center;
		justify-content: space-between;
        padding-bottom: 5px;
        input, select {
            max-width: 100%;
        }
        &.select {
            span {
                width: 20%;
            }
        }
		.input-clear-btn {
			position: absolute;
			top: 4px;
			right: -3px;
			opacity: 0.3;
			padding:3px;

		}
        span.label {
            // width: 30%;
            font-weight: 700;
			margin-right: 10px;
            text-transform: uppercase;
			&.normal {
				font-weight: 400;
				text-transform: none;
			}
        }
        .input-wrapper {
            width: 70%;
			select {
                padding: 7px;
                border: none;
				font-size:${getFontSize(+1)}px;
                background: #ececec;
                border-radius: 5px;
			}
            input {
                padding: 7px;
                border: none;
				font-size:${getFontSize(+1)}px;
                background: #ececec;
                border-radius: 5px;
            }
			textarea {
				height: 120px;
				font-size: ${getFontSize()}px;
				border: none;
				background: #ececec;
                border-radius: 5px;
				padding: 2px;
			}
            .explanation {
                font-size:${getFontSize(+1)}px;
                color: grey;
				margin-bottom: 5px;
            }
            .ai-suggestion {
                font-size:${getFontSize(+1)}px;
                color: grey;
				margin-right: 20px;
				span {
					width: auto;
				}
				.icon-wrapper {
					margin-left: 5px;
					cursor: pointer;
					opacity: 0.3;
					&:hover {
						opacity: 1;
					}
				}
            }
        }
    }
`
