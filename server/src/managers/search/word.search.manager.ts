import { iSearchWordRes } from "../../../../shared/types.shared";
import { searchWithRgGeneric } from "./search-ripgrep.manager";


// rg "#[^ #]+" "/Users/gregoirethiebault/desktop/your markdown notes/test_obsi/nodal_ex" --ignore-case --type md --multiline


export const searchWord = (p: {
	term: string,
	folder: string,
	cb: (res: iSearchWordRes) => void
}) => {
	const objRes: iSearchWordRes = {}
	searchWithRgGeneric({
		term: p.term,
		folder: p.folder,

		options: {
			wholeLine: true,
			debug: true,
			// exclude:[".resources"]
		},

		processRawLine: lineInfos => {
			// console.log(444, lineInfos);
			let l = lineInfos
			if (!l.found || l.found === '') return
			if (!objRes[l.file.path]) objRes[l.file.path] = { file: l.file, results: []}
			objRes[l.file.path].results.push(l.found)
		},

		onSearchEnded: async () => {
			p.cb(objRes)
		}
	})
}
