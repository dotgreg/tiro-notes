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

export const usePromptPopup = (p: {
}) => {

	const [displayPromptPopup, setDisplayPromptPopup] = useState(false)

	const [text, setText] = useState(``)
	const [title, setTitle] = useState(strings.promptPopup.defaultTitle)

	const triggerPromptPopup = (p: {
		text: string,
		title?: string,
		onAccept?: Function,
		onRefuse?: Function
	}) => {
		setDisplayPromptPopup(true)
		setText(p.text);
		if (p.title) setTitle(p.title);
		if (p.onAccept) liveVars.onAccept = p.onAccept
		if (p.onRefuse) liveVars.onRefuse = p.onRefuse
	}

	const closePopup = () => {
		setDisplayPromptPopup(false)
	}

	addCliCmd('triggerPromptPopup', {
		description: 'triggerPromptPopup',
		func: triggerPromptPopup
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
						{text}
						<button
							value='submit'
							className="submit-button"
							onClick={e => { liveVars.onAccept(); closePopup() }}>
							{strings.setupForm.submit}
						</button>
					</div>
				</Popup>
			</div>}
	</>

	return {
		triggerPromptPopup,
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

