import { uniq } from "lodash"
import { dirname } from "path"
import { cleanPath } from "../../../shared/helpers/filename.helper"
import { iLineRg, searchWithRgGeneric } from "./search/search-ripgrep.manager"


const isSubDirFile = (path: string, folderToSearch: string): boolean => {
	path = cleanPath(path)
	folderToSearch = cleanPath(folderToSearch)
	path = path.replace(folderToSearch, '')
	const res = path.includes('/')
	// if (res) console.log(333, path, folderToSearch, res);
	return res
}
const fileName = (path: string) => {
	return path.replace(dirname(path), "")
}

export const getSuggestions = (folderToSearch: string): Promise<string[]> => {
	return new Promise((res, rej) => {
		let subdirs: string[] = []
		const suggestionsRes: string[] = []
		// console.log(334, folderToSearch);
		searchWithRgGeneric({
			term: '',
			folder: folderToSearch,
			debug: true,
			flags: ["--files", "--max-depth=2"],
			processRawLine: l => {
				// console.log(335, l.raw, l.file);
				if (isSubDirFile(l.file.folder, folderToSearch)) subdirs.push(l.file.folder)
				else return l
			},
			onSearchEnded: async (r: iLineRg[]) => {
				subdirs = uniq(subdirs)
				subdirs.map(s => { suggestionsRes.push(fileName(s)) })
				r.map(s => { suggestionsRes.push(fileName(s.file.path)) })
				res(suggestionsRes)
			}
		})
	})
}
