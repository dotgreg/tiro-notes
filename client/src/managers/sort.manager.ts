import { each, sortBy } from "lodash";
import { iFile } from "../../../shared/types.shared";

export type SortMode = 'alphabetical' | 'created' | 'modified'
export const SortModesLabels = ['Az', 'Crea', 'Modif']
export const SortModes = ['alphabetical', 'created', 'modified']

// RENDERING FUNCTIONS & COMPONENT
export const sortFiles = (files: iFile[], sortMode: number): iFile[] => {
	let sortedFiles
	switch (SortModes[sortMode]) {
		case 'alphabetical':
			sortedFiles = sortBy(files, [file => file.realname.toLocaleLowerCase()])
			break;
		case 'created':
			sortedFiles = sortBy(files, ['created']).reverse()
			break;
		case 'modified':
			sortedFiles = sortBy(files, ['modified']).reverse()
			break;
		default:
			sortedFiles = sortBy(files, [file => file.realname.toLocaleLowerCase()])
			break;
	}
	return sortedFiles
}



export const getMostRecentFile = (files: iFile[]): iFile | null => {
	let res = files[0]
	if (!res) return null
	each(files, file => {
		if (
			file.created && res.created &&
			file.created > res.created
		) res = file
	})

	return res
}

