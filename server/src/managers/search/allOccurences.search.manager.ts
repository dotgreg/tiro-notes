import { processRawPathToFile } from "./file.search.manager";
import { searchWithRgGeneric } from "./search-ripgrep.manager";


// rg "#[^ #]+" "/Users/gregoirethiebault/desktop/your markdown notes/test_obsi/nodal_ex" --ignore-case --type md --multiline

export const searchWord = (p: {
	term: string,
	folder: string,
	cb: (res: any) => void
}) => {
	const objRes = {}
	searchWithRgGeneric({
		term: p.term,
		folder: p.folder,
		debug: true,

		processRawLine: lineInfos => {
			let l = lineInfos
			if (!l.found || l.found === '') return
			if (!objRes[l.file.path]) objRes[l.file.path] = {file: l.file, results:[]}
			objRes[l.file.path].results.push(l.found) 
			// return res
		},

		onSearchEnded: async () => {
			p.cb(objRes)
		}

	})
}
