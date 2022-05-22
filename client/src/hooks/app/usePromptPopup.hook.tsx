import React, { useEffect, useRef, useState } from 'react';
import { Popup } from '../../components/Popup.component';
import { strings } from '../../managers/strings.manager';


const liveVars: {
	onAccept: Function,
	onRefuse: Function,
} = {
	onAccept: () => { },
	onRefuse: () => { },
}

/**
 * comment5
 */
export type iPrompt = (p: {
	text: string,
	title?: string,
	onAccept?: Function,
	onRefuse?: Function
}) => void

/**
 * comment4
 */
export type iConfirmPopup = (text: string, cb: Function, onRefuse?: Function) => void


export type iPopupApi = {
	confirm: iConfirmPopup,
	prompt: iPrompt
}

export const PopupContext = React.createContext<iPopupApi | null>(null);

export const usePromptPopup = (p: {
}) => {

	const [displayPromptPopup, setDisplayPromptPopup] = useState(false)

	const [text, setText] = useState(``)
	const [title, setTitle] = useState(strings.promptPopup.defaultTitle)
	const [showRefuse, setShowRefuse] = useState(false)

	const confirmPopup: iConfirmPopup = (text, cb, onRefuse) => {

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

