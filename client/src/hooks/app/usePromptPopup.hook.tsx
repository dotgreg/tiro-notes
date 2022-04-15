/* REQ promptPopup('text', ()=>{})
 * => create popup
	 => cb on finished

	 D1 usePromptCompo
	 => create promptCompo + promptTitle + isPromptShown
	 => triggerPrompt (text, cb)
	   => window.triggerPrompt = ca...
				-> superBOOOF

	 D2 usePromptCompo
	 => kiff kiff
	 => window.triggerPrompt if needed
	 => but usually works with triggerPrompt
*
*/

import React, { useEffect, useRef, useState } from 'react';
import { Popup } from '../../components/Popup.component';
import { addCliCmd } from '../../managers/cliConsole.manager';
import { strings } from '../../managers/strings.manager';


const liveVars: {
	onAccept: Function,
	onRefuse: Function,
} = {
	onAccept: () => { },
	onRefuse: () => { },
}

export type iPrompt = (p: {
	text: string,
	title?: string,
	onAccept?: Function,
	onRefuse?: Function
}) => void
export type iConfirmPopup = (text: string, cb: Function) => void
export type iPopupsContext = { confirm?: iConfirmPopup, prompt?: iPrompt }
export const PopupContext = React.createContext<iPopupsContext>({});

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

	addCliCmd('promptPopup', {
		description: 'promptPopup',
		func: promptPopup
	})
	addCliCmd('confirmPopup', {
		description: 'confirmPopup',
		func: confirmPopup
	})
	// window.tiroCli.triggerPromptPopup.f({ text: 'wppp', onAccept: () => { console.log('wpppp'); } })


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

	return {
		promptPopup,
		confirmPopup,
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

