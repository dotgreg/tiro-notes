import { cloneDeep, each, uniq } from "lodash";
import { regexs } from "../../../shared/helpers/regexs.helper";
import { iFile } from "../../../shared/types.shared";
import { getClientApi2 } from "../hooks/api/api.hook";

export interface iNotePart {
	titleName: string
	file: iFile
}
export interface iHashtag {
	id: number
	name: string
	lines: number[],
	noteParts: iNotePart[]
}
// export type iHashtagLink = [number, number]
export type iHashtagLink = string
export interface iHashtagsDic { [name: string]: iHashtag }
export type iHashtagsArr = iHashtag[]

export interface iHashtags {
	nodesObj: iHashtagsDic,
	nodesArr: iHashtagsArr,
	edges: iHashtagLink[]
}

export const getHashtags = async (path: string): Promise<iHashtags> => {
	return new Promise((res, rej) => {
		const dic: iHashtagsDic = {}
		const arr: iHashtagsArr = []

		getClientApi2().then(api => {
			api.search.word("#", path, rawResPerFile => {

				const edges: iHashtagLink[] = []

				const partsHashtagIds: { [partId: string]: number[] } = {}
					console.log(rawResPerFile);
				each(rawResPerFile, (rawFile, i) => {
					// console.log(22231, i, rawFile);
					// at first, notepart titleName is null
					const notePart: iNotePart = {
						file: rawFile.file,
						titleName: ""
					}


					each(rawFile.results, (line, j) => {

						const currentLineTags: iHashtag[] = []

						// if line starts with #[#5] + space, titleName changes
						const matchTitle = line.match(regexs.titleMd)
						if (matchTitle && matchTitle[0]) {
							const title = matchTitle[0].split("#").join('').trim()
							notePart.titleName = title
						}

						// + match possible hashtags in the line (then it can be inside the title)
						const matchTags = line.match(regexs.hashtag3)
						each(matchTags, tag => {

							// tag = tag.split("'").join("")
							tag = tag.substring(1)

							if (!dic[tag]) {
								dic[tag] = {
									id: Object.keys(dic).length + 1,
									name: tag,
									lines: [],
									noteParts: []
								}
							}

							dic[tag].noteParts.push(cloneDeep(notePart))
							dic[tag].lines.push(j)
							dic[tag].lines = uniq(dic[tag].lines)
							const partId = notePart.file.name + "-" + notePart.titleName
							if (!partsHashtagIds[partId]) partsHashtagIds[partId] = []
							partsHashtagIds[partId].push(dic[tag].id)
							currentLineTags.push(dic[tag])

						})
						// } // end each tag

						// 2. connecting nodes per line
						each(currentLineTags, (ctag1, i) => {
							each(currentLineTags, (ctag2, j) => {
								if (i === j) return
								// const tags = currentLineTags
								// let ins = tags.length > i + 1 ? [i, i + 1] : null
								// console.log(22234, ins, tags.length, i + 1, line);

								// if (ins) {
								// let id1 = tags[ins[0]].id
								// let id2 = tags[ins[1]].id
								let id1 = ctag1.id
								let id2 = ctag2.id
								const nLink = `${id1}-${id2}`
								const nLink2 = `${id2}-${id1}`
								// console.log(22233, edges, nLink, nLink2, line);
								if (
									edges.indexOf(nLink) === -1 &&
									edges.indexOf(nLink2) === -1
								) edges.push(nLink)
								// }
							})
						})
					})
				}) // end each line

				each(dic, hashtag => {
					arr.push(hashtag)
				})

				// // 1. connecting per notePart
				// each(partsHashtagIds, partIds => {
				// 	each(partIds, id1 => {
				// 		each(partIds, id2 => {
				// 			if (id1 === id2) return
				// 			const nLink = `${id1}-${id2}`
				// 			const nLink2 = `${id2}-${id1}`
				// 			if (edges.indexOf(nLink) === -1 && edges.indexOf(nLink2) === -1) edges.push(nLink)
				// 		})
				// 	})
				// })



				// each
				// RES
				const result: iHashtags = {
					nodesObj: dic,
					nodesArr: arr,
					edges
				}
				console.log(22232, result);
				res(result)
			})
		})
	})
}
