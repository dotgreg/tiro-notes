import { css } from '@emotion/css';
import { SerializedStyles } from '@emotion/react';
import { isBoolean, last, set } from 'lodash-es';
import React, { useEffect, useRef, useState } from 'react';
import { getFontSize } from '../managers/font.manager';
import { useBackendState } from '../hooks/useBackendState.hook';
import { Icon2 } from './Icon.component';
import { getApi } from '../hooks/api/api.hook';
import { userSettingsSync } from '../hooks/useUserSettings.hook';
import { getCookie, setCookie } from '../managers/cookie.manager';
import { useDebounce } from '../hooks/lodash.hooks';
import { get } from 'http';

export type OptionObj = { key: number | string, label: string, obj: any }
export type iInputSelectOptionObj = OptionObj
export type InputType = 'password' | 'text' | 'select' | 'number' | 'checkbox' | 'textarea' | 'date' | 'datetime'
export type InputValue = string | number | boolean | undefined


export type iInputAutoSuggestSource = "cookie" | "ls" | "backend" | "customFunction" | "none"

export const Input = (p: {
	id?: string
	label?: string
	labelStyle?: "normal" | "bold"
	type?: InputType
	list?: OptionObj[]
	explanation?: string
	value?: InputValue
	onChange?: (res: string, opts?:{changeType:"user"|"ai"}) => void
	onCheckedChange?: (res: boolean) => void
	onSelectChange?: (res: string) => void
	onLoad?: (res: any) => void
	onFocus?: Function
	onBlur?: Function
	onEnterPressed?: Function
	shouldFocus?: boolean
	highlightTextOnFocus?: boolean
	shouldNotSelectOnClick?: boolean
	readonly?: boolean
	style?: string
	step?:number
	max?: number
	min?: number
	rememberLastValue?: boolean // if not false, will keep last value of that field in backend storage based on the id of the input ONLY WORKS IF ID PARAM EXISTS
	aiSuggest?: string
	aiSuggestAutoInsert?: boolean
	// add autosuggest list dropdown on bottom
	autoSuggest?: boolean
	autoSuggestSource?: iInputAutoSuggestSource
	autoSuggestFunction?: () => Promise<string[]>
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


	//////////////////////////
	// REMEMBER LAST VALUE
	//
	let backendIdLastValue = `input-lastvalue-id-${p.id}`
	const [lastValue, setLastValue, refreshLastValue] = useBackendState<InputValue>(backendIdLastValue, "")
	useEffect(() => {
		if (!p.id || !p.rememberLastValue) return
		// console.log("REFRESH LAST VALUE ONCE")
		refreshLastValue()
	}, [p.value])
	if (!p.id && p.rememberLastValue) console.error("!!!!! Input component: rememberLastValue is true but no id is provided, cannot remember last value without id !!!!!")

	const rememberMode = () =>  {
		return p.id && p.rememberLastValue 
	}
	// when loading first time
	useEffect(() => {
		if (!rememberMode()) return 
		// console.log("lastval for pid", lastValue, p.id)
		if (lastValue === "" || lastValue === undefined) return
		setValueFn(lastValue)
		p.onLoad && p.onLoad(lastValue)
	}, [lastValue])
	const [valueInt, setValueInt] = useState<InputValue>(value)


	/////////////////////////////////
	// WHEN STHG set value
	const setValueFn = (nval:any) => {
		setValueInt(nval)
		// console.log("SET VAL FN", nval)
		if (rememberMode()) {
			if (nval.length < 1) return
			// console.log("setlastval", nval)
			setLastValue(nval)
		}
		p.onChange && p.onChange(nval)
	}



	/////////////////////////////////
	//
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
		if (p.autoSuggest) debouncedAddToAutoSuggestList(nval) 
		setValueFn(nval)
	}




	//
	// AI SUGGEST PROMPT
	//
	const [aiSuggestResult, setAiSuggestResult] = useState<string>("...")
	const [aiSuggestCounter, setAiSuggestCounter] = useState<number>(0)
	const [showAiButtons, setShowAiButtons] = useState<boolean>(false)

	const aiInsertVal = (val:string) => {
		console.log("AI INSERT VAL", {val, fieldId: p.id})
		if (p.type === "select") {
			setValueSelect(val)
			// p.onSelectChange && p.onSelectChange(val)
			return
		}
		p.onChange && p.onChange(val, {changeType:"ai"})
		setValueFn(val)
	}
	
	let aiNameCommandSuggest = userSettingsSync.curr['ui_editor_ai_suggest_form_command']
	const histAiSuggest = useRef<string | undefined>(undefined)
	useEffect(() => {
		// console.log(p.aiSuggest, aiSuggestCounter, "AI SUGGEST EFFECT", p.id)
		setAiSuggestResult("")
		if (p.aiSuggest !== undefined && p.aiSuggest.length > 0 )  {
			if (histAiSuggest.current === undefined) {
				console.log({1:p.aiSuggest, 2:histAiSuggest.current}, "AI SUGGEST INITIALIZED")
				histAiSuggest.current = p.aiSuggest
				return
			}
			console.log(p.aiSuggest, "AI SUGGEST RUNNING...")
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
			aiAsk =  "PROMPT INSTRUCTIONS: " + aiAskInstructions + `\nProvide only the raw value to input, without any additional explanations.\n`+ aiAsk
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
	

	//
	//
	// FOCUS DETECTION MECHANISME
	//
	//
	const [isFocussed, setIsFocussed] = useState(false)
	const onFocusInt = (e:any) => {
		if (p.onFocus) p.onFocus()
		// console.log("FOCUS")
		if(p.highlightTextOnFocus) {
			inputRef.current.select()
		}
		setIsFocussed(true)
	}
	const onBlurInt = (e:any) => {
		setTimeout(() => {
			// console.log("BLUR")
			setIsFocussed(false)
			setAutoSuggestFilteredList([])
			if (p.onBlur) p.onBlur()
		}, 500)
	}



	//
	//
	// AUTOSUGGEST LIST MECHANISM
	//
	//
	const [autoSuggestList, setAutoSuggestList] = useState<string[]>([])
	const [autoSuggestFilteredList, setAutoSuggestFilteredList] = useState<string[]>([])
	let asListId = `auto-suggest-list-${p.id}-${p.autoSuggestSource}`
	const debouncedAddToAutoSuggestList =  useDebounce((val:string) => {
		addToAutoSuggestList(val)
	}, 3000)

	const removeFromAutoSuggestList = (val:string) => {
		getAutoSuggestList(list => {
			let nlist = list.filter(item => item !== val)
			console.log("REMOVE FROM AUTOSUGGEST LIST", val)
			saveAutoSuggestList(nlist)
		})
	}
	const addToAutoSuggestList = (val:string) => {
		getAutoSuggestList(list => {
			// if it tries to add "awor" or "awo" and "aword" already inside, return it
			console.log("GETLIST before add", list)
			if (list.some(item => item.startsWith(val))) return
			list.push(val)
			console.log("ADD TO AUTOSUGGEST LIST", val, list, asListId)
			saveAutoSuggestList(list)
		})
	}
	const getAutoSuggestList = (
		cb:(list: string[]) => void
	) => {
		try { 
			if (p.autoSuggestSource === "cookie") { cb(JSON.parse(getCookie(asListId) || "[]")) }
			if (p.autoSuggestSource === "ls") { cb(JSON.parse(localStorage.getItem(asListId) || "[]")) }
			if (p.autoSuggestSource === "backend") { 
				getApi(api => { api.cache.get(asListId, (res) => {
						return cb(JSON.parse(res))
					})
				})
			}
			if (p.autoSuggestSource === "customFunction" && p.autoSuggestFunction) {
				p.autoSuggestFunction().then(cb).catch((e) => {console.log(e)})
			}
		} catch(e) {
			console.log("Error getting auto suggest list", e)
		}
	}
	const saveAutoSuggestList = (nlist) => {
		let listToString = JSON.stringify(nlist)
		if (p.autoSuggestSource === "cookie") setCookie(asListId, listToString, -1)
		if (p.autoSuggestSource === "ls") localStorage.setItem(asListId, listToString)
		if (p.autoSuggestSource === "backend") { getApi(api => { api.cache.set(asListId, listToString, -1) }) }
		setAutoSuggestList(nlist)
		console.log("SAVE autosuggest", nlist)
	}

	useEffect(() => {
		if (!p.autoSuggest) return
		if (!p.id) return console.warn(h, "No id provided for autosuggest, system disabled")
			getAutoSuggestList(list => {
				// console.log("GET LIST", list)
				setAutoSuggestList(list)
			})
	}, [p.autoSuggest, p.autoSuggestSource])

	useEffect(()=> {
		// Filter the autoSuggestList based on the value being typed
		if (!isFocussed) return
		if (`${valueInt}`.length === 0 ) setAutoSuggestFilteredList(autoSuggestList)
		setAutoSuggestFilteredList(autoSuggestList.filter(item => item.includes(`${valueInt}`) && item !== `${valueInt}`))
	}, [autoSuggestList, valueInt, isFocussed])




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
					onFocus={onFocusInt}
					onBlur={onBlurInt}
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
					(valueInt != "" && valueInt != undefined) && <div className="input-clear-btn" onClick={() => setValueFn("")} > <Icon2 name="circle-xmark"  /></div>
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
						defaultValue={valueInt as any}
						onChange={(e) => {
							p.onChange && p.onChange(e.target.value)
						}}>
					</textarea>
				}

				{p.aiSuggest && <div className="ai-suggestion"> 
					<span className="result">{ p.aiSuggestAutoInsert && showAiButtons ? "Ai suggestion inserted " : `Ai suggestion ${aiSuggestResult}`}</span>  
					{
						showAiButtons && <>
							<span onClick={() => {setAiSuggestCounter(aiSuggestCounter + 1)}}><Icon2 name="refresh" /></span>
							<span onClick={() => {aiInsertVal(aiSuggestResult)}}><Icon2 name="file-import" /></span>
						</>
					}
				</div>}
				
				{p.explanation && <div className="explanation"> {p.explanation} </div>}

				{p.autoSuggest && autoSuggestFilteredList.length > 0 &&
					<div className="auto-suggest-list">
						{autoSuggestFilteredList.map((item, i) =>
							<div key={i} className="auto-suggest-item" onClick={(e) => {setValueFn(item); setAutoSuggestFilteredList([]); }}>
								{item}
								<span className="remove-item" onClick={(e) => { e.stopPropagation(); removeFromAutoSuggestList(item); }}><Icon2 name="circle-xmark" /></span>
							</div>
						)}
					</div>
				}


			</div>
		</div>
		</div>
	)
}

export const inputComponentCss = () => `
    .input-component {
		.auto-suggest-list {
			position: absolute;
			z-index: 1000;
			background: white;
			border: 1px solid #ccc;
			border-radius: 5px;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
			max-height: 200px;
			overflow-y: auto;
			.auto-suggest-item {
				padding: 8px 12px;
				border-bottom: 1px solid #eee;
				cursor: pointer;
				&:hover {
					background: #f5f5f5;
				}
				.remove-item {
					margin-left: 8px;
					cursor: pointer;
					&:hover {
						color: red;
					}
				}
			}
		}
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
				width: calc(100% - 40px);
				height:180px;
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
