import { cloneDeep, each } from "lodash";
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


				const partsHashtagIds: { [partId: string]: number[] } = {}
				each(rawResPerFile, (rawFile, i) => {
					// at first, notepart titleName is null
					const notePart: iNotePart = {
						file: rawFile.file,
						titleName: ""
					}


					each(rawFile.results, (line, j) => {

						// if line starts with #[#5] + space, titleName changes
						const matchTitle = line.match(regexs.titleMd)
						if (matchTitle && matchTitle[0]) {
							const title = matchTitle[0].split("#").join('').trim()
							notePart.titleName = title

						} else {
							// else match possible hashtags in the line
							const matchTags = line.match(regexs.hashtag)

							each(matchTags, tag => {
								// if #, ##, ###, remove
								if (tag.length < 2) return
								if (tag.substring(1).includes("#")) return

								if (!dic[tag]) {
									dic[tag] = {
										id: Object.keys(dic).length + 1,
										name: tag,
										noteParts: []
									}
								}

								dic[tag].noteParts.push(cloneDeep(notePart))
								const partId = notePart.file.name + "-" + notePart.titleName
								if (!partsHashtagIds[partId]) partsHashtagIds[partId] = []
								partsHashtagIds[partId].push(dic[tag].id)

							})
						}



						// console.log(2220, rawFile.file.name, line, notePart);
					})
				})

				each(dic, hashtag => {
					arr.push(hashtag)
				})

				const edges: iHashtagLink[] = []
				each(partsHashtagIds, partIds => {

					each(partIds, id1 => {
						each(partIds, id2 => {
							if (id1 === id2) return
							const nLink = `${id1}-${id2}`
							const nLink2 = `${id2}-${id1}`
							if (edges.indexOf(nLink) === -1 && edges.indexOf(nLink2) === -1) edges.push(nLink)
						})
					})

				})
				// each
				// RES
				const result: iHashtags = {
					nodesObj: dic,
					nodesArr: arr,
					edges
				}
				res(result)
			})
		})
	})
}
