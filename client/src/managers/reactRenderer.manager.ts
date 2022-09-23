import { createRoot } from 'react-dom/client';
import { ReactElement } from "react";
import { renderToString } from 'react-dom/server'

export const renderReactComponent = (Component: ReactElement, containerEl: HTMLElement | null) => {
	if (!containerEl) return console.warn("[renderReactComponent] the container element was not found");
	const root = createRoot(containerEl);
	root.render(Component);
}

export const renderToString2 = renderToString
