import { createRoot } from 'react-dom/client';
import { ReactElement } from "react";
import { renderToString } from 'react-dom/server'
import { generateUUID } from '../../../shared/helpers/id.helper';
import { memoize } from 'lodash';


/**
 * Render Component and return ID of wrapper to host it
 * ex :
 * 		let idEl = renderReactToId(<RessourcePreview url="" />)
 *		subst = `<div id="${idEl}" class="resource-link-wrapper"> ...
*/
// let compo: any = null
export const renderReactToId = (
	Component: ReactElement,
	options?: { delay?: number }
): string => {
	let idEl = `render-react-wrapper-${generateUUID()}`


	// if (!compo) compo = renderReactComponent(Component)
	const render = () => {
		let compo = renderReactComponent(Component)
		let int = setInterval(() => {
			let el = document.getElementById(idEl)
			if (el) {
				el.innerHTML = ""
				el.appendChild(compo)
				clearInterval(int)
			}
		}, 10)
	}


	if (options && options.delay) {
		setTimeout(render, options.delay)
	} else {
		render()
	}
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

export const renderToMemoString = (rel: any, args: any[]) => memoize(args => {
	return renderToString(rel)
}, args => JSON.stringify([...args]))

export const mem0 = (func: Function, args: any[]) => memoize(args => {
	return func(...args)
}, args => JSON.stringify([...args]))

export const mem = (func: Function) => memoize(
	(...args: any) => func(...args)
	, args => JSON.stringify([...args]))

// let html = renderToMemoString(<RessoucePreview>, [])
