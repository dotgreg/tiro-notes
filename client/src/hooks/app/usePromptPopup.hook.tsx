import React, { useEffect, useRef, useState } from 'react';
import { regexs } from '../../../../shared/helpers/regexs.helper';
import { Popup } from '../../components/Popup.component';
import { strings } from '../../managers/strings.manager';
import { css } from '@emotion/css';
import { each, set } from 'lodash-es';
import { getApi } from '../api/api.hook';
import { iInsertMethod } from '../api/file.api.hook';
import { Input, InputType, iInputSelectOptionObj } from '../../components/Input.component';
import { config } from 'process';


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
	id: string,
}
export interface iPopupFormConfig {
	title: string,
	fields: iPopupFormField[],
	insertFilePath?:string,
	insertLine?:number,
	insertStringFormat?: string,
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
		create: (p:iPopupFormConfig ) => void
		readConfigFromNote: (
			notePath: string, 
			cb:(popupsConfig: iPopupFormConfig[]) => void 
		) => void
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
							let [key, value] = part.split("=")
							// trim both
							key = key.trim()
							value = value.trim()
							if (key === "name") formConfig.title = value
							if (key === "path") formConfig.insertFilePath = value
							if (key === "line") formConfig.insertLine = parseInt(value)
							if (key === "line_format") {
								formConfig.insertStringFormat =  value
							}
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

	const promptFormComponent:iPopupApi["form"]["create"] = (p) => {
		let finalConfigForm = {...defaultConfigForm, ...p} as iPopupFormConfig

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
				// if name is already in fields, skip it
				if (!fields.find(el => el.id === name)){
					fields.push({
						name,
						type: type as InputType || "text",
						description: description || name,
						selectOptions,
						id: name
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
	}







	const onFormSubmit = () => {

		// check if all fields are filled
		let allFieldsFilled = true
		formFields.forEach(field => {
			if (!formFieldsValues.current[field.id]) {
				allFieldsFilled = false
			}
		})

		if (!allFieldsFilled) {
			getApi(api => {
				api.ui.notification.emit({ 
					id: "insert-form-error",
					content: `FORM: Please fill all fields`,
				})
			})
			return
		}
	 
		setDisplayFormPopup(false)

		// create final string from format
		let finalStringToInsert = configForm.insertStringFormat 
		// replace all {{id_VARNAME}} with formValues.id_VARNAME

		finalStringToInsert = finalStringToInsert || defaultConfigForm.insertStringFormat
 
		formFieldsValues.current = formFieldsValues.current || {}
		each(formFieldsValues.current, (val, key) => {
			// const regex = new RegExp(`{{${key}\|.*?}}`, 'g')
			// replace {{FIELDID(|type|description)?}} with formValues.FIELDID
			const regex = new RegExp(`{{${key}.*?}}`, 'g')
			finalStringToInsert = finalStringToInsert?.replace(regex, val)
		})

		// replace {{datetime}} with current datetime in format 2024-12-31 23:59
		const date = new Date()
		const datetime = date.toISOString().slice(0, 16).replace('T', ' ')
		const regex = new RegExp(`{{_datetime}}`, 'g')
		
		// replace {{date}} 
		const dateStr = date.toDateString()
		const regexDate = new RegExp(`{{_date}}`, 'g')
		finalStringToInsert = finalStringToInsert.replace(regex, datetime)

		const finalFilePath = configForm.insertFilePath || defaultConfigForm.insertFilePath 
		const insertLine = configForm.insertLine || defaultConfigForm.insertLine 
		// insert final string to file
		getApi(api => {
			api.file.insertContent(finalFilePath, finalStringToInsert || "", {insertLine}, res => {
				api.ui.notification.emit({ 
					id: "insert-form-success",
					content: `<b>FORM: line ${insertLine} insert success</b>: <br><br> "${finalStringToInsert}" <br><br> to <b>${finalFilePath}</b>`,
				})
			})
		})

		closePopup()
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


	//
	//
	// HTML
	//
	//
	const PromptPopupComponent = () => <>
		{displayFormPopup &&
			<div className="form-popup-component">
				<Popup
					title={title}
					onClose={closePopup}
					canBgClose={false}
					cssStr={cssStr}
				>
					{formFields.map((field, i) => {
						return <div key={i}>
							{/* <label>{field.name} : {field.description}</label>
							<input className='popup-form-input' type={field.type} data-id={field.id} data-name={field.name} /> */}
							<Input 
								label={field.name}
								explanation={field.description}
								shouldNotSelectOnClick={true}
								type={field.type}
								list={field.selectOptions}
								onChange={nval => {
									formFieldsValues.current[field.id] = nval
									// 
								}}
								onSelectChange={nval => {
									formFieldsValues.current[field.id] = nval
									// 
								}}
							/>
						</div>
					}
					)}
					<br />
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
					canBgClose={false}
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
			readConfigFromNote
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
		.popup-wrapper {
			input, select {
				width: 90%;
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

