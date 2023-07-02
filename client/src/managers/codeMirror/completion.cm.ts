import { CompletionSource } from "@codemirror/autocomplete"
import { each } from "lodash"
import { sharedConfig } from "../../../../shared/shared.config"
import { iFile } from "../../../../shared/types.shared"
import { getApi } from "../../hooks/api/api.hook"
import { notifLog } from "../devCli.manager"
import { getParentFolder } from "../folder.manager"
import { iUrlInfos } from "../previewUrl.manager"

const h = `[Code Mirror]`
const log = sharedConfig.client.log.verbose

export interface iCompletionTerm { label: string, type: string, info?: string, apply: string, detail?: string, boost?: number }
const createCompletionTerm = (label: string, toInsert?: string, info?: string, boost?: number, detail?: string): iCompletionTerm => {
	let type = "tag"
	return {
		label,
		apply: toInsert || label,
		info,
		detail: detail,
		type,
		boost: boost || 0
	}
}

//
// ALL COMPLETION SOURCES
//
// cached in ram + file + update
export const getAllCompletionSources = (file: iFile): CompletionSource[] => {
	const completionSourceHashtags: any = getCompletionSourceHashtags(file)
	return [
		completionSourceCtag,
		// completionSourceHashtags,
		completionSourceSnippets
	]
}


//
// AUTOCOMPLETE WITH SNIPPETS 
// with --
//
export const completionSourceSnippets:any = (context) => {
	let before = context.matchBefore(/\-\-/);
	if (!context.explicit && !before) return null;
	const path = `${sharedConfig.path.configFolder}/snippets.md`
	return new Promise((reso, rej) => {
		getApi(api => {
			api.file.getContent(path, content => {
				const arr: iCompletionTerm[] = []
				const arrContent = content.split("\n")
				each(arrContent, line => {
					line = line.split("\\n").join("\n")
					let rawSnippet = line.split("|")
					let from = rawSnippet.shift()?.trim()
					let to = rawSnippet.join("|").trim()
					if (!to || !from) return
					from = "--" + from
					// if to is ${javascript} interpret it
					if (to.includes("${")) {
						let oto = to
						try { to = new Function("return `" + oto + "`")() }
						catch (e) { 
							let message = `${h} snippets error: ${JSON.stringify({e, oto})}`
							notifLog(message)
						}
					}
					let preview = to.length > 20 ? `${to.substring(0, 20)}...` : to

					arr.push(createCompletionTerm(from, to, undefined, undefined, preview))
				})
				let res = {
					from: before ? before.from : context.pos,
					options: arr,
					validFor: /.*/
				};
				reso(res)
			})
		})
	})
}


//
// SCAN HASHTAGS FROM FOLDER
//

// VERY SLOW as it scans / root for #!!!! so it is disabled
const getCompletionSourceHashtags = (file: iFile) => (context) => {
	let before = context.matchBefore(/\#/);
	if (!context.explicit && !before) return null;
	return new Promise((reso, rej) => {
		getApi(api => {
			// let parentFolder = getFolderParentPath(file)
			// let p1 = getParentFolder(file.folder)
			// let p2 = getParentFolder(p1)
			// let folder = getParentFolder(file.folder)
			let folder = getParentFolder(getParentFolder(file.folder))
			// let folder = file.folder
			api.search.hashtags(folder, hashs => {
				// console.log(folder, hashs);
				const arr: iCompletionTerm[] = []
				each(hashs.nodesArr, hash => {
					arr.push(createCompletionTerm(hash.name, hash.name))
				})
				let res = {
					from: before ? before.from : context.pos,
					options: arr,
					validFor: /.*/
				};
				// console.log(res);
				reso(res)
			})
		})
	})
}

//
// SCAN ALL CTAGS AVAILABLE
//
type iCtagInfos = { name: string, content: string }

const processCtagsToSuggestions = (ctags: iCtagInfos[]): iCompletionTerm[] => {
	const tags: iCompletionTerm[] = []
	each(ctags, c => {
		const name = c.name.replace(".md", "")
		const tagname = `[[${name}]]`
		const fulltagname = `${tagname} ${tagname}`
		let completion = fulltagname
		let info = `Insert installed custom tag ${tagname}`
		let boost = 0
		const lines = c.content.split("\n")
		let headerInsert = "// --insert:"
		let headerComment = "// --comment:"
		let headerBoost = "// --boost:"
		each(lines, line => {
			line = line.split("\\n").join("\n")
			if (line.startsWith(headerInsert)) {
				completion = line.replace(headerInsert, "")
			}
			if (line.startsWith(headerComment)) {
				info = line.replace(headerComment, "")
			}
			if (line.startsWith(headerBoost)) boost = parseInt(line.replace(headerBoost, ""))
		})
		tags.push(createCompletionTerm(tagname, completion, info, boost))
	})
	return tags
}

const completionSourceCtag: CompletionSource = (context) => {
	let before = context.matchBefore(/\[\[/);
	if (!context.explicit && !before) return null;

	return new Promise((reso, rej) => {

		// 1 : get from ctags
		const prom1 = new Promise<iCtagInfos[]>((res1, rej1) => {
			getApi(api => {
				const path = "/.tiro/tags"
				api.files.get(path, files => {
					let cnt = 0
					let ctagsInfos: iCtagInfos[] = []
					each(files, f => {
						api.file.getContent(f.path, content => {
							cnt++
							ctagsInfos.push({
								name: f.name,
								content
							})
							if (cnt === files.length) res1(ctagsInfos)
						})
					})
				})
			})
		})

		// 2 : get from plugins
		const prom2 = new Promise<iCtagInfos[]>((res2, rej2) => {
			getApi(api => {
				let arrTags: iCtagInfos[] = []
				api.plugins.list(plugins => {
					each(plugins, p => {
						if (p.type !== "tag") return
						arrTags.push({
							name: p.name,
							content: p.code
						})
					})
					// console.log(arrTags);
					res2(arrTags)
				})
			})
		})

		// at end of 2 process, trigger end
		Promise.all([prom2, prom1]).then(arrRes => {
			let arr = [...arrRes[0], ...arrRes[1]]
			let suggestions = processCtagsToSuggestions(arr)
			triggerRes(suggestions)
		}).catch(() => {
			console.warn("ERROR HERE")
		})


		// TRIGGER AT THE END
		const triggerRes = (tags: iCompletionTerm[]) => {
			let res = {
				from: before ? before.from : context.pos,
				options: tags,
				validFor: /.*/
			};
			reso(res)
		}
	})
}

const getLinesAndWordsSuggestions = (content) => {
	// lines
	const arr = content.split("\n");
	const res: any = [];
	for (let i = 0; i < arr.length; i++) {
		const line = arr[i];
		const preview = line.length > 20 ? line.substring(0, 20) + "... (line)" : line;
		res.push({
			label: preview,
			apply: line
		});
	}
	// words
	const words = content.split(/( |\n)/);
	let resWords: any = [];
	for (let i = 0; i < words.length; i++) {
		const word = words[i];
		let isWordArr = word.match(/[-'0-9a-zÀ-ÿ]+/gi);
		let isWord = isWordArr && isWordArr.length === 1 ? true : false;
		if (word.length > 1) {
			resWords.push({
				label: word + " (word)",
				apply: word
			});
		}
	}
	return [...resWords, ...res];
};

