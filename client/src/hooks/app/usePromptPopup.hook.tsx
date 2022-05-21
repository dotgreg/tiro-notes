import React, { useEffect, useRef, useState } from 'react';
import { Popup } from '../../components/Popup.component';
import z, { Function, obj, fn, string, number, boolean } from "../../managers/types.manager";

const liveVars: {
	onAccept: Function,
	onRefuse: Function,
} = {
	onAccept: () => { },
	onRefuse: () => { },
}



// INTERFACES

const zPrompt = z.function()
	.args(z.object({
		text: string,
		title: string.optional(),
		onAccept: fn.optional(),
		onRefuse: fn.optional()
	}))
	.returns(z.void())

const zConfirmPopup = z.function().args(z.string({ description: "woop" }), z.number({ description: "wooop2" })).returns(z.void())

// const test = z.function().args(z.string().describe("woo"))
const test = z.function().args(z.string({}))
type iTest = z.infer<typeof test>

type iPrompt = z.infer<typeof zPrompt>
type iConfirm = z.infer<typeof zConfirmPopup>

export type iConfirmPopup = (text: string, cb: Function) => void
export type iPopupApi = { confirm: iConfirmPopup, prompt: iPrompt }

// old
// export type iPrompt = (p: {
// 	text: string,
// 	title?: string,
// 	onAccept?: Function,
// 	onRefuse?: Function
// }) => void





export const usePromptPopup = (p: {
}) => {

	const [displayPromptPopup, setDisplayPromptPopup] = useState(false)

	const [text, setText] = useState(``)
	const [title, setTitle] = useState(strings.promptPopup.defaultTitle)
	const [showRefuse, setShowRefuse] = useState(false)

	const confirmPopup: iConfirmPopup = (text, cb, onRefuse?: Function) => {

		promptPopup({
			title: strings.promptPopup.confirmTitle,
			text,
			onAccept: cb,
			onRefuse: () => { if (onRefuse) onRefuse(); }
		})
	}

	const promptPopup: iPrompt = (p) => {
		setDisplayPromptPopup(true)
		setText(p.text);
		if (p.title) setTitle(p.title);
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
	}

	const PromptPopupComponent = () => <>
		{displayPromptPopup &&
			<div className="prompt-popup-component">
				<Popup
					title={title}
					onClose={closePopup}
					canBgClose={false}
				>
					<div>
						<div className="content">
							{text}
						</div>
						<br />

						<button
							value='submit'
							className="accept submit-button"
							onClick={e => { liveVars.onAccept(); closePopup() }}>
							{strings.promptPopup.accept}
						</button>
						{showRefuse &&
							<button
								value='submit'
								className="refuse submit-button"
								onClick={e => { liveVars.onRefuse(); closePopup() }}>
								{strings.promptPopup.refuse}
							</button>
						}
					</div>
				</Popup>
			</div>}
	</>

	const popupApi: iPopupApi = {
		confirm: confirmPopup,
		prompt: promptPopup
	}
	return {
		popupApi,
		PromptPopupComponent
	}
}

export const promptPopupCss = () => `
    .prompt-popup-component {
				.popup-wrapper {
						min-width: 200px;
						min-height: 100px;
						text-align:center;
				}
    }
`

