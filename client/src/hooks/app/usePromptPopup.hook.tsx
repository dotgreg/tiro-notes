import React, { useEffect, useRef, useState } from 'react';
import { regexs } from '../../../../shared/helpers/regexs.helper';
import { Popup } from '../../components/Popup.component';
import { strings } from '../../managers/strings.manager';
import { css } from '@emotion/css';
import { cloneDeep, each, has, isEqual, isNumber, set } from 'lodash-es';
import { getApi } from '../api/api.hook';
import { iInsertMethod } from '../api/file.api.hook';
import { Input, InputType, iInputSelectOptionObj } from '../../components/Input.component';
import { config } from 'process';
import { getDateObj } from '../../../../shared/helpers/date.helper';
import { isMobile } from '../../managers/device.manager';
import { useDebounce } from '../lodash.hooks';
import { extractDocumentation } from '../../managers/apiDocumentation.manager';


const liveVars: {
	onAccept: Function,
	onRefuse: Function,
} = {
	onAccept: () => { },
	onRefuse: () => { },
}

export interface popupOptions  {cssStr?:string}
export interface formPopupOptions  {
	autosubmit?: number | boolean
}

type iPopupFormFieldType = InputType | "html"

export interface iPopupFormField {
	name: string,
	type: iPopupFormFieldType,
	initValue?: any,
	description: string,
	selectOptions?: iInputSelectOptionObj[]
	optional?: boolean,
	rememberLastValue?:boolean,
	aiSuggestString?: string,
	aiSuggestAutoInsert?: boolean,
	notVisible?: boolean,
	historySuggest?: boolean,
	id: string,
}
export interface iPopupFormConfig {
	title: string,
	fields: iPopupFormField[],
	insertFilePath?:string,
	insertLine?:number,
	insertStringFormat?: string,
	options?: popupOptions
}
export type iPopupApi = {
	documentation?: () => any,
	confirm: (text: string, cb: Function, onRefuse?: Function, options?:popupOptions) => void,
	show: (text: string, title: string, cb: Function, options?:popupOptions) => void,
	prompt: (p: {
		text: string,
		title?: string,
		userInput?: boolean,
		onAccept?: Function,
		onRefuse?: Function,
		acceptLabelButton?: string,
		refuseLabelButton?: string,
		options?:popupOptions
	}) => void
	form: {
		create: (
			p:iPopupFormConfig, 
			cb?:Function,
			formValues?: {[key:string]: any},
			opts?:formPopupOptions
		) => void
		readConfigFromNote: (
			notePath: string, 
			cb:(popupsConfig: iPopupFormConfig[]) => void 
		) => void,
		getAll: (
			cb: (popupsConfig: iPopupFormConfig[]
		) => void) => void,
		open: (
			formName: string,
			cb: (form: iPopupFormConfig) => void,
			formValues?: {[key:string]: any},
			opts?: formPopupOptions
		) => void,
		// insert: (
		// 	formName: string,
		// 	formContent: {[key:string]: any},
		// 	cb: (form: iPopupFormConfig) => void
		// ) => void,


	}

}

export const PopupContext = React.createContext<iPopupApi | null>(null);

export const usePromptPopup = (p: {
}) => {

	const [displayPromptPopup, setDisplayPromptPopup] = useState(false)

	const [text, setText] = useState(``)
	const [userInput, setUserInput] = useState<string | null>(null)
	const [title, setTitle] = useState(strings.promptPopup.defaultTitle)
	const [autoSubmit, setAutoSubmit] = useState<number|boolean>(false)
	const [showRefuse, setShowRefuse] = useState(false)

	const [acceptLabel, setAcceptLabel] = useState(strings.promptPopup.accept)
	const [refuseLabel, setRefuseLabel] = useState(strings.promptPopup.refuse)
	const [cssStr, setCssStr] = useState("")

	const reinitPopup = () => {
		setUserInput(null)
		setTitle("")
		setText("")
		setShowRefuse(false)
	}

	const showPopup: iPopupApi['show'] = (text, title, cb, options) => {
		promptPopup({
			title,
			text,
			onAccept: cb,
			onRefuse: () => { },
			options
		})
	}
	const confirmPopup: iPopupApi['confirm'] = (text, cb, onRefuse, options) => {
		const title = ""
		promptPopup({
			title,
			text,
			onAccept: cb,
			onRefuse: () => { if (onRefuse) onRefuse(); },
			options
		})
	}

	const promptPopup: iPopupApi['prompt'] = (p) => {
		setDisplayPromptPopup(true)
		setText(p.text);

		if (p.acceptLabelButton) setAcceptLabel(p.acceptLabelButton)
		if (p.refuseLabelButton) setRefuseLabel(p.refuseLabelButton)
		if (p.options?.cssStr) setCssStr(p.options.cssStr)

		if (p.title) setTitle(p.title);
		if (p.userInput) setUserInput("");
		if (p.onAccept) liveVars.onAccept = p.onAccept
		if (p.onRefuse) {
			liveVars.onRefuse = p.onRefuse
			setShowRefuse(true);
		} else {
			setShowRefuse(false);
		}
	}

	const closePopup = () => {
		setDisplayPromptPopup(false)
		setDisplayFormPopup(false)
		reinitPopup()
	}

















































	///////////////////////////////////////////////////////////////////////////////////////
	//
	// FORM
	//
	//
	const [displayFormPopup, setDisplayFormPopup] = useState(false)
	const [formFields, setFormFields] = useState<iPopupFormField[]>([])
	const [configFields, setConfigFields] = useState<iPopupFormField[]>([])
	const formFieldsValues = useRef({})
	const defaultConfigForm =  {
			title: "Popup Form",
			insertFilePath: "/popup_form_results.md",
			insertLine: 0, 
			insertStringFormat:  "{{name}} | {{age|number}}\n"
	}
	const [configForm, setConfigForm] = useState<iPopupFormConfig>(defaultConfigForm as iPopupFormConfig)
	const configFormCbRef = useRef<Function | undefined>()

	const readConfigFromNote: iPopupApi["form"]["readConfigFromNote"] = (noteLink, cb) => {
		getApi(api => {
			api.file.getContent(noteLink, noteContent => {
				const lines = noteContent.split("\n")
				const formConfigs: iPopupFormConfig[] = []

				lines.forEach(line => {
					if (!line.trim().startsWith("form|") && !line.startsWith("form |")) return

					// ----- 1. isolate the raw config string (everything after the first "|") -----
					const configRaw = line.split("|")
					configRaw.shift()                     // remove leading "form"
					const configRawStr = configRaw.join("|")

					// ----- 2. split on commas that start a new key=value pair -----
					// commas inside a value (e.g., lists, URLs, HTML) are ignored
					const parts = configRawStr.split(/,(?=\s*\w+=)/)

					const formConfig = { title: "", fields: [] } as iPopupFormConfig

					parts.forEach(part => {
						const [keyRaw, ...valArr] = part.split("=")
						const key = keyRaw.trim()
						const value = valArr.join("=").trim()   // keep any "=" inside the value

						switch (key) {
							case "name":
								formConfig.title = value
								break
							case "path":
								formConfig.insertFilePath = value
								break
							case "line":
								formConfig.insertLine = parseInt(value, 10)
								break
							case "line_format":
								formConfig.insertStringFormat = value
								break
							// add more keys here if needed
						}
					})

					formConfigs.push(formConfig)
				})

				cb(formConfigs)
			}, { removeMetaHeader: true })
		})
	}

	const getAllForms:iPopupApi["form"]["getAll"] = (cb) => {
		readConfigFromNote("/.tiro/forms.md", cb)
	}


	const promptFormComponent:iPopupApi["form"]["create"] = (p, cb, formValues, opts) => {
		if (!opts) opts = {autosubmit: false}
		if (!opts.autosubmit) opts.autosubmit = false
		let finalConfigForm = {...defaultConfigForm, ...p} as iPopupFormConfig
		if (p.options?.cssStr) setCssStr(p.options.cssStr)
		else {
			let ncssStr = ``
			if (isMobile()) ncssStr = `.popup-wrapper {transform:translate(-50%,0%)!important; top:20px!important;}`
			setCssStr(ncssStr)
		}

		// from line_format, extract fields {{name|type}} with text as type by default
		let fields = [] as iPopupFormField[]
		// detect {{name|type}} in line_format
		const regex = /{{(.*?)}}/g
		let stringToInsert = finalConfigForm.insertStringFormat || ""
		const matches = stringToInsert.match(regex)
		matches?.forEach(match => {
			let [name, type, description] = match.replace("{{", "").replace("}}", "").split("|")
			// if type starts with select, subsplit it, it is like |select:option1, option2, option3
			if (!name.startsWith("_")) {
				let selectOptions:iInputSelectOptionObj[] = []
				if (type?.startsWith("select")) {
					selectOptions = type.split(":")[1].split(",").map((el, i) => {
						return {
							key: i,
							label: el,
							obj: el
						}
					})
					type = "select"
				}
				// if optional in description, is optional
				let optional = false
				if (description?.includes("optional")) optional = true
				let rememberLastValue = false
				if (description?.includes("remember")) rememberLastValue = true
				let aiSuggest = ""
				let aiSuggestAutoInsert = false
				if (description?.includes("ai_suggest:")) { aiSuggest = description.split("ai_suggest:")[1].trim(); description = description.split("ai_suggest:")[0].trim(); }
				if (description?.includes("ai_insert:")) { aiSuggest = description.split("ai_insert:")[1].trim(); aiSuggestAutoInsert = true; description = description.split("ai_insert:")[0].trim(); }

				let notVisible = false
				if (description?.includes("not_visible") ) notVisible = true
				let historySuggest = false
				if (description?.includes("history") ) historySuggest=true


				// if name is already in fields, skip it
				if (!fields.find(el => el.id === name)){
					fields.push({
						name,
						initValue: formValues && has(formValues, name) ? formValues[name] : "",
						type: type as InputType || "text",
						description: description || name,
						selectOptions,
						optional,
						rememberLastValue,
						id: name,
						aiSuggestString: aiSuggest,
						aiSuggestAutoInsert,
						notVisible,
						historySuggest
					})
				}

			}
		})
		// if some formValues are provided but do not match any field, notify user
		if (formValues) {
			let unmatchedFields = Object.keys(formValues).filter(key => !fields.find(field => field.id === key))
			if (unmatchedFields.length > 0) {
				getApi(api => {
					api.ui.notification.emit({
						id: "form-unmatched-fields",
						content: `FORM: fields <b>${unmatchedFields.join(", ")}</b> do not match any form fields.`,
					})
				})
			}
		}
		finalConfigForm.fields = fields
		// console.log("[POPUP > FORM] opening with config:", finalConfigForm)

		setTitle(finalConfigForm.title)
		setFormFields(fields)
		setConfigForm(finalConfigForm)
		setDisplayFormPopup(true)
		configFormCbRef.current = cb
		setAutoSubmit(opts.autosubmit || false)

	}

	useEffect(() => {
		if (isNumber(autoSubmit)) {
			setTimeout(() => {
				console.log("[POPUP > FORM] auto submitting form:", configForm)
				onFormSubmit()
			}, autoSubmit || 1000)
		}
	}, [autoSubmit, configForm])

	const openForm:iPopupApi["form"]["open"] = (formName, cb, formValues, opts) => {
		getAllForms(forms => {
			const form = forms.find(el => el.title === formName)
			if (form) {
				promptFormComponent(form, cb, formValues, opts)
			} else {
				// notify no form with that name
				console.warn("Form not found", formName)
				getApi(api => {
					api.ui.notification.emit({
						id: "form-not-found",
						content: `Form <b>${formName}</b> not found.`
					})
				})

			}
		})
	}

	const getFormFieldsValues = () => {
		// if some fields are empty, add them to formFieldsValues with empty string
		formFields.forEach(field => {
			// if type is date, date is today
			if (field.type === "date" ) {
				if (formFieldsValues.current[field.id]) formFieldsValues.current[field.id] = new Date(formFieldsValues.current[field.id]).toLocaleDateString('fr-FR')  
			}
			if (field.type === "datetime" ) {
				if (formFieldsValues.current[field.id]) formFieldsValues.current[field.id] = new Date(formFieldsValues.current[field.id]).toLocaleString('fr-FR')
				formFieldsValues.current[field.id] = formFieldsValues.current[field.id]?.substring(0, formFieldsValues.current[field.id].length - 3)	
			}
		})
		return formFieldsValues.current
	}
	const onFormSubmit = () => {
		getFormFieldsValues()

		// check if all fields are filled
		let mandatoryFieldsEmpty:string[] = []
		formFields.forEach(field => {
			if (
				!field.optional && !formFieldsValues.current[field.id] && field.type !== "html" && !field.notVisible
			) {
				mandatoryFieldsEmpty.push(field.name)
			}
		})
		
		// console.log("mandatoryFieldsEmpty", mandatoryFieldsEmpty)
		if (mandatoryFieldsEmpty.length > 0) {
			getApi(api => {
				api.ui.notification.emit({ 
					id: "insert-form-error",
					content: `FORM: fields <b>${mandatoryFieldsEmpty.join(", ")}</b> are mandatory.`,
				})
			})
			return
		}
	 
		if (!keepFormOpen) setDisplayFormPopup(false)

		// create final string from format
		let finalStringToInsert = configForm.insertStringFormat 
		// replace all {{id_VARNAME}} with formValues.id_VARNAME

		finalStringToInsert = finalStringToInsert || defaultConfigForm.insertStringFormat
 
		formFieldsValues.current = formFieldsValues.current || {}

		// if some fields are empty, add them to formFieldsValues with empty string
		formFields.forEach(field => {
			if (!formFieldsValues.current[field.id]) {
				formFieldsValues.current[field.id] = ""
			}
		})


		// if some fields are in notVisible, add them to formFieldsValues with empty string
		formFields.forEach(field => {
			if (field.notVisible) {
				formFieldsValues.current[field.id] = ""
			}
		})

		each(formFieldsValues.current, (val, key) => {
			// const regex = new RegExp(`{{${key}\|.*?}}`, 'g')
			// replace {{FIELDID(|type|description)?}} with formValues.FIELDID
			// be careful to ONLY replace when {{FIELDID| is matched , not {{FIELDID2| for instance
			const regex = new RegExp(`{{${key}\\|.*?}}`, 'g')
			finalStringToInsert = finalStringToInsert?.replace(regex, val)
			const regex2 = new RegExp(`{{${key}}}`, 'g')
			finalStringToInsert = finalStringToInsert?.replace(regex2, val)
		})

		// replace {{datetime}} with current datetime in format 31/12/2021 12:00

		const date = getDateObj()
		const regex = new RegExp(`{{_datetime}}`, 'g')
		finalStringToInsert = finalStringToInsert.replace(regex, date.full_fr)
		
		// replace {{date}} 
		const regex2 = new RegExp(`{{_date}}`, 'g')
		finalStringToInsert = finalStringToInsert.replace(regex2, date.date_fr)

		const finalFilePath = configForm.insertFilePath || defaultConfigForm.insertFilePath 
		const insertLine = configForm.insertLine || defaultConfigForm.insertLine 
		// insert final string to file


		// if \n inside string, replace it by linejump
		// finalStringToInsert = finalStringToInsert?.replaceAll("\\n", "woowowowo")
		finalStringToInsert = finalStringToInsert?.replaceAll("\n", `
`)
		finalStringToInsert = finalStringToInsert?.replaceAll("\\n", `
`)
		// finalStringToInsert = finalStringToInsert?.replaceAll("\n", "woowowowo")
		
		getApi(api => {
			api.file.insertContent(finalFilePath, finalStringToInsert || "", {insertLine}, res => {
				// if (configFormCb) configFormCb()
				configFormCbRef.current && configFormCbRef.current()
				configFormCbRef.current = undefined

				api.ui.notification.emit({ 
					id: "insert-form-success",
					content: `<b>FORM: line ${insertLine} insert success</b>: <br><br> "${finalStringToInsert}" <br><br> to <b>${finalFilePath}</b>`,
					options: {
						onClick: () => {
							console.log("open file")
							getApi( api => {
								api.ui.floatingPanel.openFile(finalFilePath, {searchedString: finalStringToInsert})	
							})
						}
					}
				})
			})
		})

		if (!keepFormOpen) closePopup()

	}

	const [keepFormOpen, setKeepFormOpen] = useState(false)

	//
	//
	// HTML
	//
	//


	//
	// FORM
	//
	const PromptPopupComponent = () => {

		//
		//
		// FOR HAVING AI SUGGEST REACTING TO OTHER FIELD CONTENT CHANGE > quite ugly, I know...
		//
		//
		type AiSuggestList = {[key: string]: string}
		const aiSuggestListRef = useRef<AiSuggestList>({})
		const [counter, setCounter] = useState("")
		const regenAiSuggestList = () => {
			let nAiSuggestList: AiSuggestList = {}
			formFields.forEach(field => {
				if (field.aiSuggestString) { nAiSuggestList[field.id] = field.aiSuggestString }
			})
			return nAiSuggestList
		}
		const debounceUpdateAiSuggestList = useDebounce((fieldId: string, value: any) => {
			// let oldList = aiSuggestListRef.current
			let nAiSuggestList = regenAiSuggestList()
			// console.log("==> field change, checking for", fieldId, `[${fieldId}]`)
			let hasFoundChangeToProcess = false;
			each(nAiSuggestList, (val, key) => {
				if(val.includes(`[${fieldId}]`)){ 
					hasFoundChangeToProcess = true;
					nAiSuggestList[key] = val.replace(`[${fieldId}]`, value) 
					// console.log("=====>  FOUND!", fieldId, val, "to replace => ", nAiSuggestList[key])
				}
			})
			// if (!isEqual(oldList, nAiSuggestList)) {
			if (hasFoundChangeToProcess) {
				aiSuggestListRef.current = nAiSuggestList
				setCounter(counter === " " ? "  " : " ");
			}
		}, 1000)
		const outputAiSuggest = (fieldId: string) => {
			if (aiSuggestListRef.current[fieldId] === undefined) return undefined
			return `${aiSuggestListRef.current[fieldId]}${counter}`
		}



		//
		// GENERIC REACTER SYSTEM
		//
		const triggerActionsOnFieldChange = (fieldId: string, value: any) => {
			// console.log("FIELD CHANGE", fieldId, value)
			debounceUpdateAiSuggestList(fieldId, value)
			debounceUpdateHtmlContent(fieldId, value)
		}


		//
		//
		// FORM FIELD HTML UPDATER LOGIC
		//
		//
		const [htmlUpdateCounter, setHtmlUpdateCounter] = useState(0)
		const debounceUpdateHtmlContent = useDebounce((fieldId: string, value: any) => {
			setHtmlUpdateCounter(htmlUpdateCounter + 1)
		}, 1000)

		const [htmlFields, setHtmlFields] = useState<{[key: string]: iPopupFormField}>({})
		useEffect(() => {
			let newHtmlFields: {[key: string]: iPopupFormField} = {}
			formFields.forEach(field => {
				if (field.type === "html") {
					newHtmlFields[field.id] = cloneDeep(field)
					// replace in description [INPUT_NAME] by current value of that field
					let fieldsValues = getFormFieldsValues()
					newHtmlFields[field.id].description = newHtmlFields[field.id].description.replace(/\[([^\]]+)\]/g, (match, p1) => {
						return fieldsValues[p1] || match
					})
				}
			})
			setHtmlFields(newHtmlFields)
		}, [formFields, htmlUpdateCounter])




		return <>
			{displayFormPopup &&
				<div className="form-popup-component">
					<Popup
						title={title}
						onClose={closePopup}
					// disableBgClose={true}
					cssStr={cssStr}
				>
					{formFields.map((field, i) => {
						return <div key={i} className='form-input-wrapper'>
							{/* <label>{field.name} : {field.description}</label>
							<input className='popup-form-input' type={field.type} data-id={field.id} data-name={field.name} /> */}

							{field.type !== "html" && (
								<Input
									label={field.name}
									explanation={field.description}
									shouldNotSelectOnClick={true}
									value={field.initValue}
									type={field.type}
									list={field.selectOptions}
									onLoad={val => {
										formFieldsValues.current[field.id] = val
									}}
									onChange={(nval, opts) => {
										// console.log("onChange for", field.id, {nval, opts})
										formFieldsValues.current[field.id] = nval
										triggerActionsOnFieldChange(field.id, nval)
									}}
									onSelectChange={nval => {
										// console.log("onSelectChange for",  field.id, {nval})
										formFieldsValues.current[field.id] = nval
										triggerActionsOnFieldChange(field.id, nval)
									}}
									// REMEMBER
									rememberLastValue={field.rememberLastValue}
									id={`PromptPopupComponent-${title}-${field.name}-${field.type}`}
									aiSuggest={outputAiSuggest(field.id)}
									aiSuggestAutoInsert={field.aiSuggestAutoInsert}
									highlightTextOnFocus={field.rememberLastValue && field.historySuggest}

									autoSuggest={field.historySuggest ? true : undefined}
									autoSuggestSource={field.historySuggest ? 'backend' : undefined}
								/>
							)}
							{
								!field.optional && field.type !== "html" &&
								<div className="mandatory">*</div>
							}


							{field.type === "html" && (
								<div className='popup-form-html-field'
									dangerouslySetInnerHTML={{
										__html: htmlFields[field.id]?.description || ""
									}}
								></div>
							)}


						</div>
					}
					)}
					<br />
					<div className="form-input-wrapper">
						<Input
							label="Keep form open"
							labelStyle="normal"
							type="checkbox"
							value={keepFormOpen}
							onCheckedChange={e => setKeepFormOpen(e) }
						/>
					</div>
					<button
						value='submit'
						className="accept submit-button"
						onClick={e => { onFormSubmit();  }}>
						{acceptLabel}
					</button>
					<div className='details'>
						Form result will be {configForm.insertLine} to {configForm.insertFilePath} with format: {configForm.insertStringFormat}
					</div>
				</Popup>
			</div>
		}

		{displayPromptPopup &&
			<div className="prompt-popup-component">
				<Popup
					title={title}
					onClose={closePopup}
					// disableBgClose={true}
					cssStr={cssStr}
				>
					<div>
						<div className={`content`}
							
							dangerouslySetInnerHTML={{
								__html: text
							}}
						></div>
						<br />

						{userInput !== null &&
							<div>
								<input type="text" value={userInput} onChange={e => { setUserInput(e.target.value) }} />
								<br />
							</div>
						}


						<button
							value='submit'
							className="accept submit-button"
							onClick={e => { liveVars.onAccept(userInput); closePopup() }}>
							{acceptLabel}
						</button>
						{showRefuse &&
							<button
								value='submit'
								className="refuse submit-button"
								onClick={e => { liveVars.onRefuse(userInput); closePopup() }}>
								{refuseLabel}
							</button>
						}
					</div>
				</Popup>
			</div>}
	</>
	}

	//
	//
	// API
	//
	//
	const popupApi: iPopupApi = {
		confirm: confirmPopup,
		show: showPopup,
		prompt: promptPopup,
		form: {
			create: promptFormComponent,
			readConfigFromNote,
			getAll: getAllForms,
			open: openForm,
		}

	}
	popupApi.documentation = () => extractDocumentation(popupApi,"api.popup", "client/src/hooks/app/usePromptPopup.hook.tsx")
	return {
		popupApi,
		PromptPopupComponent
	}
}

export const promptPopupCss = () => `
.mobile-view-container {
	.form-popup-component {
	
		.popup-wrapper {
			.popupContent {
				width: 80vw;
			}
		}
	}
}
	.form-popup-component {
		position: absolute;
		z-index: 1000000;
		.popup-wrapper {
			input, select {
				width: 90%;
			}
			input[type="checkbox"] {
				width: auto;
			}
			.form-input-wrapper {
				position: relative;
				.mandatory {
					position: absolute;
					top: 0;
					right: 0;	
					color: red;
					font-size: 10px;
				}
			}
			.details {
				color:#afafaf;
				padding-top: 10px;
				font-size: 10px;
			}
		}
	}
    .prompt-popup-component {
				.popup-wrapper {
						min-width: 200px;
						min-height: 100px;
				}
    }
`

