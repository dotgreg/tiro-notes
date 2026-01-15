import React, { useEffect, useRef, useState } from 'react';
import { regexs } from '../../../../shared/helpers/regexs.helper';
import { Popup } from '../../components/Popup.component';
import { strings } from '../../managers/strings.manager';
import { css } from '@emotion/css';
import { each, isEqual, set } from 'lodash-es';
import { getApi } from '../api/api.hook';
import { iInsertMethod } from '../api/file.api.hook';
import { Input, InputType, iInputSelectOptionObj } from '../../components/Input.component';
import { config } from 'process';
import { getDateObj } from '../../../../shared/helpers/date.helper';
import { isMobile } from '../../managers/device.manager';
import { useDebounce } from '../lodash.hooks';


const liveVars: {
	onAccept: Function,
	onRefuse: Function,
} = {
	onAccept: () => { },
	onRefuse: () => { },
}

export interface popupOptions  {cssStr?:string}
export interface iPopupFormField {
	name: string,
	type: InputType,
	description: string,
	selectOptions?: iInputSelectOptionObj[]
	optional?: boolean,
	rememberLastValue?:boolean,
	aiSuggestString?: string,
	aiSuggestAutoInsert?: boolean,
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
			cb?:Function 
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
			cb: (form: iPopupFormConfig) => void
		) => void,


	}

}

export const PopupContext = React.createContext<iPopupApi | null>(null);

export const usePromptPopup = (p: {
}) => {

	const [displayPromptPopup, setDisplayPromptPopup] = useState(false)

	const [text, setText] = useState(``)
	const [userInput, setUserInput] = useState<string | null>(null)
	const [title, setTitle] = useState(strings.promptPopup.defaultTitle)
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

	const readConfigFromNote:iPopupApi["form"]["readConfigFromNote"] = (noteLink, cb) => {
		// get note from path
		getApi(api => {
			api.file.getContent(noteLink, noteContent => {
				// parse note content
				const lines = noteContent.split("\n")
				const formConfigs:iPopupFormConfig[] = []
				lines.forEach(line => {
					// the config looks like "form | name=🎬 youtube, path=/d2/popup_form_results.md, line_format= {{datetime}} | hello: {{hello}} | world: {{world|date}} | age: {{age|number}} | tag: {{tags|select:el1,el2,el3}}\n, type=append"
					if (line.trim().startsWith("form|") || line.startsWith("form |")) {
						let configRaw = line.split("|")
						// remove the first el and merge array again
						configRaw.shift()
						let configRawStr = configRaw.join("|")

						let formConfig = {title:"", fields:[]} as iPopupFormConfig
						const parts = configRawStr.split(",")
						// if some parts do not include an =, merge it back to item n-1 (for instance select:el1,el2,el3)
						for (let i = 0; i < parts.length; i++) {
							if (!parts[i].includes("=")) {
								parts[i-1] = parts[i-1] + "," + parts[i]
								parts.splice(i, 1)
								i--
							}
						}
						parts.forEach(part => {
							let arrSplit = part.split("=")
							// trim both
							let key = arrSplit[0].trim()


							// remove first el of arrSplit
							arrSplit.shift()
							let valRaw = arrSplit.join("=")
							let value = valRaw.trim() 
							if (key === "name") formConfig.title = value
							if (key === "path") formConfig.insertFilePath = value
							if (key === "line") formConfig.insertLine = parseInt(value)
							if (key === "line_format") { formConfig.insertStringFormat =  value }
						})
						formConfigs.push(formConfig)
					}

				})
				cb(formConfigs)
			}, {
				removeMetaHeader: true
			})
		})

	}

	const getAllForms:iPopupApi["form"]["getAll"] = (cb) => {
		readConfigFromNote("/.tiro/forms.md", cb)
	}


	const promptFormComponent:iPopupApi["form"]["create"] = (p, cb) => {
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


				// if name is already in fields, skip it
				if (!fields.find(el => el.id === name)){
					fields.push({
						name,
						type: type as InputType || "text",
						description: description || name,
						selectOptions,
						optional,
						rememberLastValue,
						id: name,
						aiSuggestString: aiSuggest,
						aiSuggestAutoInsert
					})
				}
			}
		})
		finalConfigForm.fields = fields
		console.log("[POPUP > FORM] opening with config:", finalConfigForm)

		setTitle(finalConfigForm.title)
		setFormFields(fields)
		setConfigForm(finalConfigForm)
		setDisplayFormPopup(true)
		configFormCbRef.current = cb
	}

	const openForm:iPopupApi["form"]["open"] = (formName, cb) => {
		getAllForms(forms => {
			const form = forms.find(el => el.title === formName)
			if (form) {
				promptFormComponent(form, cb)
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






	const onFormSubmit = () => {

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
			// if (field.type === "datetime" && !formFieldsValues.current[field.id]) {
			// 	// date format should be dd/mm/yyyy
			// 	formFieldsValues.current[field.id] = new Date().toLocaleDateString('fr-CA')  
			// }
		})


		// check if all fields are filled
		let mandatoryFieldsEmpty:string[] = []
		formFields.forEach(field => {
			if (!field.optional && !formFieldsValues.current[field.id]) {
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

	// gen an example of popup form
	// api.popupApi.form({
	// 	title: "Form Popup",
	// 	fields: [
	// 		{
	// 			name: "Name",
	// 			type: "text",
	// 			description: "Your name",
	// 			id: "name"
	// 		},
	// 		{
	// 			name: "Age",
	// 			type: "number",
	// 			description: "Your age",
	// 			id: "age"
	// 		},
	// 	]
	// })

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
		// FOR HAVING AI SUGGEST REACTING TO OTHER FIELD CONTENT CHANGE > quite ugly, I know...
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
			let oldList = aiSuggestListRef.current
			let nAiSuggestList = regenAiSuggestList()
			each(nAiSuggestList, (val, key) => {
				if(val.includes(`[${fieldId}]`)){ nAiSuggestList[key] = val.replace(`[${fieldId}]`, value) }
			})
			if (!isEqual(oldList, nAiSuggestList)) {
				aiSuggestListRef.current = nAiSuggestList
				setCounter(counter === " " ? "  " : " ");
			}
		}, 1000)
		const onFieldChange = (fieldId: string, value: any) => {
			debounceUpdateAiSuggestList(fieldId, value)
		}
		const outputAiSuggest = (fieldId: string) => {
			if (aiSuggestListRef.current[fieldId] === undefined) return undefined
			return `${aiSuggestListRef.current[fieldId]}${counter}`
		}



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
							<Input 
								label={field.name}
								explanation={field.description}
								shouldNotSelectOnClick={true}
								type={field.type}
								list={field.selectOptions}
								onLoad={val => {
									formFieldsValues.current[field.id] = val
								}}
								onChange={nval => {
									onFieldChange(field.id, nval)
								}}
								onSelectChange={nval => {
									onFieldChange(field.id, nval)
								}}
								// REMEMBER
								rememberLastValue={field.rememberLastValue}
								id={`PromptPopupComponent-${title}-${field.name}-${field.description}-${field.type}`}
								aiSuggest={outputAiSuggest(field.id)}
								aiSuggestAutoInsert={field.aiSuggestAutoInsert}
							/>
							{
								!field.optional &&
								<div className="mandatory">*</div>
							}
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
			open: openForm
		}

	}
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

