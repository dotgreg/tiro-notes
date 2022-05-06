import React, { useEffect, useRef } from 'react';
import { iFile } from '../../../../shared/types.shared';

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
	files: {
		set: (nFiles: iFile[]) => void,
		//get: iFile[]
	},
	folders: {
		current: {
			//set: (nFolder:string) => void,
			get: string
		}
	}
}

export const useBrowserApi = (p: {
	goTo: iBrowserApi['goTo']
	selectedFolder: string,
	setFiles: iBrowserApi['files']['set']
}): iBrowserApi => {

	return {
		goTo: p.goTo,
		files: {
			set: p.setFiles
		},
		folders: {
			current: {
				get: p.selectedFolder
			}
		}
	}
}
