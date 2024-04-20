import { iSearchWordRes } from "../../../../shared/types.shared";
import { searchWithRgGeneric } from "./search-ripgrep.manager";


// rg "#[^ #]+" "/Users/gregoirethiebault/desktop/your markdown notes/test_obsi/nodal_ex" --ignore-case --type md --multiline


export const searchWord = (p: {
	term: string,
	folder: string,
	cb: (res: iSearchWordRes) => void
	onRgDoesNotExists: () => void
}) => {
	const objRes: iSearchWordRes = {}
	// console.log('searchWord', p.term, p.folder)
	searchWithRgGeneric({
		term: p.term,
		folder: p.folder,

		options: {
			wholeLine: true,
			debug: true,
			// exclude:[".resources"]
		},

		processRawLine: lineInfos => {
			let l = lineInfos
			// console.log('lineInfos', l)
			if (!l.found || l.found === '') return
			l.file.folder = l.file.folder.replace(".md/", '.md')
			l.file.path = l.file.path.replace(".md/", '.md')
			if (!objRes[l.file.path]) objRes[l.file.path] = { file: l.file, results: []}
			objRes[l.file.path].results.push(l.found)
		},

		onSearchEnded: async () => {
			p.cb(objRes)
		},
		onRgDoesNotExists: p.onRgDoesNotExists
		
	})
}
