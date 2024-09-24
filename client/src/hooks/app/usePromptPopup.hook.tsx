import React, { useEffect, useRef, useState } from 'react';
import { regexs } from '../../../../shared/helpers/regexs.helper';
import { Popup } from '../../components/Popup.component';
import { strings } from '../../managers/strings.manager';
import { css } from '@emotion/css';
import { each, set } from 'lodash-es';
import { getApi } from '../api/api.hook';
import { iInsertMethod } from '../api/file.api.hook';
import { Input, InputType } from '../../components/Input.component';


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
	id: string,
}
export interface iPopupFormConfig {
	title: string,
	fields: iPopupFormField[],
	insertFilePath?:string,
	insertMethod?:iInsertMethod,
	insertStringFormat?:() => string,
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





	//
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
			fields: [{
						name: "Name",
						type: "text",
						description: "Your name",
						id: "name"
					},
					{
						name: "Age",
						type: "number",
						description: "Your age",
						id: "age"
					},
				],
			insertFilePath: "/popup_form_results.md",
			insertMethod: "prepend",
			insertStringFormat: () => "{{id_name}} | {{id_age}}\n"
	}
	const [configForm, setConfigForm] = useState<iPopupFormConfig>(defaultConfigForm as iPopupFormConfig)

	const readConfigFromNote:iPopupApi["form"]["readConfigFromNote"] = (noteLink, cb) => {
		// get note from path
		getApi(api => {
			api.file.getContent(noteLink, noteContent => {
				// parse note content
				const lines = noteContent.split("\n")
				const formConfigs:iPopupFormConfig[] = []
				let formConfig = {title:"", fields:[]} as iPopupFormConfig
				lines.forEach(line => {
					// the config
				})
				cb(formConfigs)
			}, {
				removeMetaHeader: true
			})
		})

	}

	const promptFormComponent:iPopupApi["form"]["create"] = (p) => {
		setDisplayFormPopup(true)
		let finalConfigForm = {...defaultConfigForm, ...p} as iPopupFormConfig
		setConfigForm(finalConfigForm)
		console.log("[POPUP > FORM] opening with config:", finalConfigForm)
		setTitle(finalConfigForm.title)
		setFormFields(finalConfigForm.fields)
	}
	const onFormSubmit = () => {
	 
		setDisplayFormPopup(false)

		// create final string from format
		let finalStringToInsert = configForm.insertStringFormat ? configForm.insertStringFormat() : ""
		// replace all {{id_VARNAME}} with formValues.id_VARNAME

		finalStringToInsert = finalStringToInsert || defaultConfigForm.insertStringFormat()
 
		// for each form field, replace {{id_FIELDID}} with formValues.FIELDID
		formFieldsValues.current = formFieldsValues.current || {}
		each(formFieldsValues.current, (val, key) => {
			const regex = new RegExp(`{{id_${key}}}`, 'g')
			finalStringToInsert = finalStringToInsert.replace(regex, val)
		})

		// replace {{datetime}} with current datetime in format 2024-12-31 23:59:59
		const date = new Date()
		const datetime = date.toISOString().slice(0, 19).replace('T', ' ')
		const regex = new RegExp(`{{datetime}}`, 'g')
		
		// replace {{date}} 
		const dateStr = date.toDateString()
		const regexDate = new RegExp(`{{date}}`, 'g')
		finalStringToInsert = finalStringToInsert.replace(regex, datetime)

		const finalFilePath = configForm.insertFilePath || defaultConfigForm.insertFilePath 
		const insertMethod = configForm.insertMethod || defaultConfigForm.insertMethod as iInsertMethod
		// insert final string to file
		getApi(api => {
			api.file.insertContent(finalFilePath, finalStringToInsert, {insertMethod}, res => {
				console.log("inserted", res)
				api.ui.notification.emit({ 
					id: "insert-form-success",
					content: `FORM: ${insertMethod} form data to ${finalFilePath} success`,
				})
			})
		})

		
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
								type={field.type}
								onChange={nval => {
									formFieldsValues.current[field.id] = nval
								}}
							/>
						</div>
					}
					)}
					<br />
					<button
						value='submit'
						className="accept submit-button"
						onClick={e => { onFormSubmit(); closePopup() }}>
						{acceptLabel}
					</button>
					<div className='details'>
						Form result will be {configForm.insertMethod} to {configForm.insertFilePath} 
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
	.form-popup-component {
		.popup-wrapper {
			.details {
				color:#afafaf;
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

