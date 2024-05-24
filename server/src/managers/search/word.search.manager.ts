import { each } from "lodash";
import { iSearchWordRes } from "../../../../shared/types.shared";
import { searchWithRgGeneric, searchWithRipGrep } from "./search-ripgrep.manager";


// rg "#[^ #]+" "/Users/gregoirethiebault/desktop/your markdown notes/test_obsi/nodal_ex" --ignore-case --type md --multiline


export const searchWord = (p: {
	term: string,
	folder: string,
	disableMetadataSearch?: boolean,
	disableTitleSearch?: boolean,
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
			disableMetadataSearch: p.disableMetadataSearch,
			disableTitleSearch: p.disableTitleSearch,
			// exclude:[".resources"]
		},

		processRawLine: lineInfos => {
			// let l = lineInfos
			// console.log('lineInfos', l)
			// if (!l.found || l.found === '') return
			// l.file.folder = l.file.folder.replace(".md/", '.md')
			// l.file.path = l.file.path.replace(".md/", '.md')
			// if (!objRes[l.file.path]) objRes[l.file.path] = { file: l.file, results: []}
			// objRes[l.file.path].results.push(l.found)
			// console.log('lineInfos', lineInfos)
			return lineInfos
		},

		onSearchEnded: async (res) => {
			
			each(res.linesResult, (lineRes) => {
				let l = lineRes
				if (!l.found || l.found === '') return
				l.file.folder = l.file.folder.replace(".md/", '.md')
				l.file.path = l.file.path.replace(".md/", '.md')
				if (!objRes[l.file.path]) objRes[l.file.path] = { file: l.file, results: []}
				objRes[l.file.path].results.push(l.found)
			})
			// console.log('onSearchEnded', objRes, res)
			p.cb(objRes)
		},
		onRgDoesNotExists: p.onRgDoesNotExists
		
	})
	
 
	
}
