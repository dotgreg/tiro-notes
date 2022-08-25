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


export type iPopupApi = {
	confirm: (text: string, cb: Function, onRefuse?: Function) => void,
	prompt: (p: {
		text: string,
		title?: string,
		userInput?: boolean,
		onAccept?: Function,
		onRefuse?: Function
	}) => void
}

export const PopupContext = React.createContext<iPopupApi | null>(null);

export const usePromptPopup = (p: {
}) => {

	const [displayPromptPopup, setDisplayPromptPopup] = useState(false)

	const [text, setText] = useState(``)
	const [userInput, setUserInput] = useState<string | null>(null)
	const [title, setTitle] = useState(strings.promptPopup.defaultTitle)
	const [showRefuse, setShowRefuse] = useState(false)

	const confirmPopup: iPopupApi['confirm'] = (text, cb, onRefuse) => {

		promptPopup({
			title: strings.promptPopup.confirmTitle,
			text,
			onAccept: cb,
			onRefuse: () => { if (onRefuse) onRefuse(); }
		})
	}

	const promptPopup: iPopupApi['prompt'] = (p) => {
		setDisplayPromptPopup(true)
		setText(p.text);
		if (p.title) setTitle(p.title);
		if (p.userInput) setUserInput(" ");
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
						<div className="content"
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
							{strings.promptPopup.accept}
						</button>
						{showRefuse &&
							<button
								value='submit'
								className="refuse submit-button"
								onClick={e => { liveVars.onRefuse(userInput); closePopup() }}>
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

