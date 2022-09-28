import { createRoot } from 'react-dom/client';
import { ReactElement } from "react";
import { renderToString } from 'react-dom/server'
import { generateUUID } from '../../../shared/helpers/id.helper';


/**
 * Render Component and return ID of wrapper to host it
 * ex :
 * 		let idEl = renderReactToId(<RessourcePreview url="" />)
 *		subst = `<div id="${idEl}" class="resource-link-wrapper"> ...
*/
export const renderReactToId = (Component: ReactElement): string => {
	let idEl = `render-react-wrapper-${generateUUID()}`
	let compo = renderReactComponent(Component)
	let int = setInterval(() => {
		let el = document.getElementById(idEl)
		if (el) {
			el.appendChild(compo)
			clearInterval(int)
		}
	}, 10)
	return idEl
}

export const renderReactComponent = (Component: ReactElement, containerEl?: HTMLElement | null): HTMLElement => {

	// if (cached.val) {
	// 	console.log(3333, cached.val);
	// 	return cached.val
	// }

	// if (!containerEl) return console.warn("[renderReactComponent] the container element was not found");
	if (!containerEl) containerEl = document.createElement("div");
	const root = createRoot(containerEl);
	root.render(Component);
	// cached.val = containerEl.cloneNode(true)
	// return null
	return containerEl
}

export const renderToString2 = renderToString
