import React, { useEffect, useRef } from 'react';

//
// INTERFACES
//

// 	clientApi.ui.browser.goTo(folder)
// clientApi.ui.browser.goToFile(folder, file)

export interface iBrowserApi {
	goTo: (
		folderPath: string,
		fileTitle?: string | null,
		options?: {
			appView: 'text' | 'image'
		}
	) => void
	selectedFolder: string,
}

export const useBrowserApi = (p: {
	goTo: iBrowserApi['goTo']
	selectedFolder: iBrowserApi['selectedFolder']
}) => {
	const { goTo, selectedFolder } = { ...p }

	const browserApi: iBrowserApi = {
		goTo,
		selectedFolder
	}
	return browserApi
}
