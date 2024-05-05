import { each } from "lodash";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { sharedConfig } from "../../../../shared/shared.config";
import { iFile, iFileImage } from "../../../../shared/types.shared";
import { backConfig } from "../../config.back";
import { execaWrapper } from "../exec.manager";
import { fileExists } from "../fs.manager";
import { log } from "../log.manager";
import { getRelativePath } from "../path.manager";
import { perf } from "../performance.manager";
import { processRawDataToFiles, processRawPathToFile } from "./file.search.manager";
import { processRawStringsToImagesArr } from "./image.search.manager";
import { getMetaFromHeaderWithJs, iMetasFiles, mergingMetaToFilesArr, processRawStringsToMetaObj } from "./metas.search.manager";
import { pathToIfile } from "../../../../shared/helpers/filename.helper";

const h = `[RIPGREP SEARCH1] `
const shouldLog = sharedConfig.server.log.ripgrep

const fs = require('fs')
const execa = require('execa');
export interface iFilesObj { [filePath: string]: iFile }


// CHECK IF RG path exists and command line is functional
export const isRgCliWorking = async (): Promise<boolean> => {
	try {
		const { stdout } = await execa(backConfig.rgPath, ['--version']);
		let res = stdout.includes('ripgrep') ? true : false
		return res
	} catch (e) {
		return false;
	}
}

// const rgDoesNotExists = () => {
// 	console.log("====> RG DOES NOT EXISTS")
// 	serverSocket2.emit('getFileHistory', { files: allHistoryFiles })
// }






















////////////////////////////////////////////////////////////////////////////////////
// NEW GENERIC SEARCH
//
type iLineRg = {
	raw: string,
	path: string,
	found: string,
	file: iFile
}




export interface iLineResult {
	file: iFile,
	raw: string,
	found: string
	path: string
}
export const searchWithRgGeneric = async (p: {
	term: string
	folder: string
	recursive?: boolean,
	options?: {
		wholeLine?: boolean,
		debug?: boolean
		filetype?: "md" | "all"
		disableMetadataSearch?: boolean
		// exclude?:string[]
	}
	processRawLine?: (infos: iLineRg) => any
	onSearchEnded: (res: { linesResult: iLineResult[] }) => void
	onRgDoesNotExists?: () => void
}): Promise<void> => {

	if (!p.recursive) p.recursive = true
	if (!p.processRawLine) p.processRawLine = (r: any) => [r]
	if (!p.options) p.options = {}
	if (!p.options.wholeLine) p.options.wholeLine = false
	if (!p.options.debug) p.options.debug = false
	if (!p.options.disableMetadataSearch) p.options.disableMetadataSearch = false
	let typeArgs = ['--type','md']
	if (p.options.filetype === "all") typeArgs = ['--files']
	const onRgDoesNotExists = (err) => {
		// console.log(h, err)
		if (!err.shortMessage.includes("ENOENT")) return
		if (p.onRgDoesNotExists) p.onRgDoesNotExists()
	}
	let exclusionArr:string[] = []
	// exclusion string // not working currenlty
	// if (p.options.exclude) {
	// 	each(p.options.exclude, excludePath => {
	// 		// exclusionArr += `--glob '!${excludePath}/'`
	// 		exclusionArr.push("--glob")
	// 		exclusionArr.push("'!${excludePath}/'")
	// 	})
	// }

	////////////////////////////////////////////////////v
	// 1/3 HEADER METADATA SEARCH
	//
	let end = perf(`🔎 searchWithRgGeneric 2 term:${p.term} folder:${p.folder}, with options ${JSON.stringify(p.options)}`)
	// if backconfigFolder doesnt exists, add it
	const relativeFolder = getRelativePath(p.folder)
	const folderToSearch = `${backConfig.dataFolder + relativeFolder}`;
	let lineParam = p.options.wholeLine ? '' : '--only-matching'
	const searchParams = [
		p.term,
		folderToSearch,
		'--ignore-case',
		...typeArgs,
		// do not print whole line, just one match per line
		lineParam,
		...exclusionArr
	]
	
	const linesResult: iLineResult[] = []
	const onData1 = async dataChunk => {
		const rawChunk = dataChunk.toString()
		const rawLines = rawChunk.split('\n')
		each(rawLines, line => {
			let lineRaw = line
			// search "found word:10"
			lineRaw = line.split(':')
			if (!lineRaw[0] || lineRaw[0] === '') return
			let found = lineRaw.slice(1).join(":")
			const processedLine:iLineResult = p.processRawLine({
				file: processRawPathToFile({ rawPath: lineRaw[0], folder: p.folder }),
				raw: line,
				path: lineRaw[0],  
				found,
			})
			if (processedLine) linesResult.push(processedLine)
		})
	}
	const onClose1 = async dataChunk => {
		await triggerAggregationIfEnded()
	}
	execaWrapper({
		cmdPath:backConfig.rgPath, 
		args: searchParams,
		onData: onData1,
		onClose: onClose1,
		onError: err => {
			// if no such file or directory, dont raise error
			if (JSON.stringify(err).includes("os error 2")) return
			onRgDoesNotExists(err)
		}
	})


	////////////////////////////////////////////////////v
	// 2/3 HEADER METADATA SEARCH
	//
	// const r = {
	// 	all: '[\\d\\D]*',
	// 	imageMd: '!\[[^\]]+\]\([^\]]+\)',
	// 	headerStart: sharedConfig.metas.headerStart,
	// 	headerStop: sharedConfig.metas.headerEnd,
	// }
	
	// const metaFilesInFullFolderSearch = [
	// 	`${r.headerStart}${r.all}${r.headerStop}`,
	// 	folderToSearch,
	// 	'--type',
	// 	'md',
	// 	'--multiline',
	// 	...exclusionArr
	// ]
	// const rawMetasStrings: string[] = []
	// let metasFilesScanned: iMetasFiles = {}
	// const onData4 =  async dataRaw => {
	// 	const rawMetaString = dataRaw.toString()
	// 	// split multiline strings
	// 	const rawMetaArr = rawMetaString.split('\n')
	// 	rawMetasStrings.push(...rawMetaArr)
	// }
	// const onClose4 =  dataRaw => {
	// 	// process raw strings to meta objs
	// 	metasFilesScanned = processRawStringsToMetaObj(rawMetasStrings, relativeFolder)
	// 	shouldLog && log(h, ` FOLDER => CMD2 => ENDED `, { metaFilesInFullFolderSearch });
	// 	triggerAggregationIfEnded()
	// }
	
	// if (!p.options.disableMetadataSearch) {
	// 	execaWrapper({
	// 		cmdPath:backConfig.rgPath, 
	// 		args: metaFilesInFullFolderSearch,
	// 		onData: onData4,
	// 		onClose: onClose4,
	// 		onError: err => {onRgDoesNotExists(err)}
	// 	})
	// }


	////////////////////////////////////////////////////v
	// 3/3 HEADER METADATA SEARCH
	//
	let count = 0
	const triggerAggregationIfEnded = async () => {
		count++
		// const endCount = p.options.disableMetadataSearch === false ? 2 : 1
		// if (count === endCount) {
		// 	console.log(count, endCount, linesResult.length)
		// 	for (let i = 0; i < linesResult.length; i++) { 
		// 		const file = linesResult[i].file 
		// 		each(metasFilesScanned, (metaObj, filePath) => { 
		// 			// remove / from filePath  
		// 			let fileFromMeta = pathToIfile(filePath)
		// 			if (file.path === fileFromMeta.path) {
		// 				linesResult[i].file.created = parseInt(`${metaObj.created}`)
		// 				linesResult[i].file.modified = parseInt(`${metaObj.updated}`)
		// 			}
		// 		})
		// 	}

		// for each linesResult.file, open the file and get the 4 first lines
		// p.onSearchEnded({linesResult})
		// end()
		if (p.options.disableMetadataSearch === true) {
			p.onSearchEnded({linesResult})
			end()
		} else {
			// for each linesResult.file
			for (let i = 0; i < linesResult.length; i++) {
				let nFile = await getMetaFromHeaderWithJs(linesResult[i].file)
				linesResult[i].file = nFile
			}
			p.onSearchEnded({linesResult})
			end()
		}
		// }
	}
}

























//////////////////////////////////////////////////////////////////////////////////
// ODL SEARCH WITH RG
//
export const searchWithRipGrep = async (params: {
	term: string
	folder: string
	titleSearch: boolean
	typeSearch: 'term' | 'folder' | 'term-image' | 'folder-image' | 'folder-regex'

	onSearchEnded: (res: { files?: iFile[], images?: iFileImage[] }) => Promise<void>
	onRgDoesNotExists?: () => void

	// processRawEl?: (raw: string) => any
	// processFinalRes?: (raw: string) => any

}): Promise<void> => {
	let p = params
	let end = perf(`🔎 searchWithRipGrep 1 term:${p.term} folder:${p.folder}`)
	const onRgDoesNotExists = (err) => {
		if (!err.shortMessage.includes("ENOENT")) return
		if (p.onRgDoesNotExists) p.onRgDoesNotExists()
	}

	let processTerm = params.term.split('-').join('\\-')

	// if backconfigFolder doesnt exists, add it
	const relativeFolder = getRelativePath(params.folder)
	const folderToSearch = `${backConfig.dataFolder + relativeFolder}`;

	const perfs = { init: Date.now(), cmd1: Date.now(), cmd2: Date.now() }

	// let searchType = (params.term === '') ? 'folder' : 'term'
	// searchType = (params.imageSearch) ? searchType + '-image' : 
	// let searchType = ''
	// if (params.term === '' && params.imageSearch) searchType = ''

	// const debugMode = (folderToSearch === '/sdcard/tiro-notes/main') ? true : false

	// regex dictionary
	const r = {
		all: '[\\d\\D]*',
		imageMd: '!\[[^\]]+\]\([^\]]+\)',
		headerStart: sharedConfig.metas.headerStart,
		headerStop: sharedConfig.metas.headerEnd,
	}

	// exclusion string not working currently
	let exclusionArr:string[] = []
	// if (p.exclude) {
	// 	each(p.exclude, excludePath => {
	// 		// exclusionArr += `--glob '!${excludePath}/'`
	// 		exclusionArr.push("--glob")
	// 		exclusionArr.push("'!${excludePath}/'")
	// 	})
	// }

	//////////////////////////////////////
	// SEARCH TYPE 1 : TERM SEARCH
	//
	if (params.typeSearch === 'term') {
		const titleFilter = params.titleSearch ? processTerm : ''
		const searchedTerm = params.titleSearch ? '' : processTerm

		// search term but also header time
		const termRegex = `(${r.headerStart}${r.all}${r.headerStop})*${r.all}${searchedTerm}${r.all}(${r.headerStart}${r.all}${r.headerStop})*`
		const normalSearchParams = [
			termRegex,
			folderToSearch,
			'--ignore-case',
			'--type',
			'md',
			'--multiline',
			...exclusionArr
		]


		let resultsRawArr: string[] = []
		

		const onData2 =  async dataRaw => {
			const rawMetaString = dataRaw.toString()
			// split multiline strings
			const rawMetaArr = rawMetaString.split('\n')
			resultsRawArr.push(...rawMetaArr)
		}

		const onClose2 = dataRaw => {
			const metasFilesObj = processRawStringsToMetaObj(resultsRawArr, relativeFolder, true);
			const scannedFilesObj: iFilesObj = {}
			let index = 0
			each(metasFilesObj, (metaObj, fileName) => {
				const file = processRawPathToFile({ rawPath: fileName, folder: relativeFolder, index, titleFilter })
				if (file && file.name) {
					if (fileExists(`${backConfig.dataFolder}/${file.path}`)) {
						scannedFilesObj[file.name] = file
						index++
					}
				}
			})
			const filesWithMetaUpdated = mergingMetaToFilesArr(scannedFilesObj, metasFilesObj)
			// const debugObj = debugMode ? { filesWithMetaUpdated, scannedFilesObj, metasFilesObj } : {}

			log(h, ` FOLDER => CMD2 => ENDED `, { files: filesWithMetaUpdated.length, metasFilesObj, normalSearchParams });
			params.onSearchEnded({ files: filesWithMetaUpdated })
			end()
		}
		execaWrapper({
			cmdPath:backConfig.rgPath, 
			args: normalSearchParams,
			onData: onData2,
			onClose: onClose2,
			onError: err => {onRgDoesNotExists(err)}
		})
	}

	//////////////////////////////////////
	// SEARCH TYPE 2 : FOLDER SEARCH
	//
	else if (params.typeSearch === 'folder') {
		const fullFolderSearchParams = [
			'--files',
			folderToSearch,
			'--max-depth=1',
			'--type',
			'md',
			...exclusionArr
		]

		const metaFilesInFullFolderSearch = [
			`${r.headerStart}${r.all}${r.headerStop}`,
			folderToSearch,
			'--max-depth=1',
			'--type',
			'md',
			'--multiline',
			...exclusionArr
		]

		// PROCESS 1
		// let ripGrepStreamProcess1
		// let ripGrepStreamProcess1 = execaWrapper(backConfig.rgPath, fullFolderSearchParams)
		// if (!ripGrepStreamProcess1) errturn onRgDoesNotExists(err)

		
		// ripGrepStreamProcess1.stdout.on('data', async dataRaw => {
		// 	let data = dataRaw.toString()
		// 	const files = processRawDataToFiles(data, params.titleSearch ? processTerm : '', relativeFolder)
		// 	each(files, file => {
		// 		if (file && file.name) {
		// 			filesScannedObj[file.name] = file
		// 		}
		// 	})
		// })
		// ripGrepStreamProcess1.stdout.on('close', dataRaw => {
		// 	shouldLog && log(h, ` FOLDER => CMD1 => ENDED : ${filesScannedObj.length} elements found`, { fullFolderSearchParams });
		// 	perfs.cmd1 = Date.now()
		// 	triggerAggregationIfEnded()
		// })
		const filesScannedObj: iFilesObj = {}
		const onData3 = async dataRaw => {
			let data = dataRaw.toString()
			const files = processRawDataToFiles(data, params.titleSearch ? processTerm : '', relativeFolder)
			each(files, file => {
				if (file && file.name) {
					filesScannedObj[file.name] = file
				}
			})
		}
		const onClose3 =  dataRaw => {
			shouldLog && log(h, ` FOLDER => CMD1 => ENDED : ${filesScannedObj.length} elements found`, { fullFolderSearchParams });
			perfs.cmd1 = Date.now()
			triggerAggregationIfEnded()
		}
		execaWrapper({
			cmdPath:backConfig.rgPath, 
			args: fullFolderSearchParams,
			onData: onData3,
			onClose: onClose3,
			onError: err => {onRgDoesNotExists(err)}
		})

		
		const rawMetasStrings: string[] = []
		let metasFilesScanned: iMetasFiles = {}
		const onData4 =  async dataRaw => {
			const rawMetaString = dataRaw.toString()
			// split multiline strings
			const rawMetaArr = rawMetaString.split('\n')
			rawMetasStrings.push(...rawMetaArr)
		}
		const onClose4 =  dataRaw => {
			// process raw strings to meta objs

			metasFilesScanned = processRawStringsToMetaObj(rawMetasStrings, relativeFolder)
			shouldLog && log(h, ` FOLDER => CMD2 => ENDED `, { metaFilesInFullFolderSearch });
			perfs.cmd2 = Date.now()
			triggerAggregationIfEnded()
		}
		execaWrapper({
			cmdPath:backConfig.rgPath, 
			args: metaFilesInFullFolderSearch,
			onData: onData4,
			onClose: onClose4,
			onError: err => {onRgDoesNotExists(err)}
		})


		// PROCESS 3 : AGGREGATE RESULTS WHEN BOTH CMDS ARE DONE
		let counterCmdsDone = 0
		const triggerAggregationIfEnded = () => {
			counterCmdsDone++
			if (counterCmdsDone === 2) {
				const filesWithMetaUpdated = mergingMetaToFilesArr(filesScannedObj, metasFilesScanned)
				const perfString = `tot:${Date.now() - perfs.init}ms / cmd1:${perfs.cmd1 - perfs.init}ms / cmd2:${perfs.cmd2 - perfs.init}ms`
				shouldLog && log(h, ` FOLDER => BOTH CMDS => ENDED `, { files: filesWithMetaUpdated.length, metasFilesScanned, perfString, perfs });
				params.onSearchEnded({ files: filesWithMetaUpdated })
				end()
			}
		}
	}


	//////////////////////////////////////
	// SEARCH TYPE 3 : IMAGE SEARCH
	// term in folder and its subfolders
	else if (params.typeSearch === 'term-image') {
		const titleFilter = params.titleSearch ? processTerm : ''
		const searchedTerm = params.titleSearch ? '' : processTerm

		const termRegex = `(${r.imageMd}${r.all}${searchedTerm}|${searchedTerm}${r.all}${r.imageMd})+`
		const searchParams = [
			termRegex,
			folderToSearch,
			'--ignore-case',
			'--type',
			'md',
			'--multiline',
			...exclusionArr
		]
		// let ripGrepStreamProcessImg2 = execaWrapper(backConfig.rgPath, searchParams)
		// if (!ripGrepStreamProcessImg2) errturn onRgDoesNotExists(err)

		// const rawStrings: string[] = []
		// ripGrepStreamProcessImg2.stdout.on('data', async dataRaw => {
		// 	const partialRawString = dataRaw.toString()
		// 	// split multiline strings
		// 	const partialRawStringsArr = partialRawString.split('\n')
		// 	rawStrings.push(...partialRawStringsArr)
		// })
		// ripGrepStreamProcessImg2.stdout.on('close', (dataRaw) => {
		// 	const images = processRawStringsToImagesArr(rawStrings, relativeFolder, titleFilter);
		// 	shouldLog && log(h, ` TERM SEARCH + IMAGE => ENDED ${images.length}`, { searchParams });
		// 	params.onSearchEnded({ images })
		// 	end()
		// })
		

		const rawStrings: string[] = []
		const onData5 = async dataRaw => {
			const partialRawString = dataRaw.toString()
			// split multiline strings
			const partialRawStringsArr = partialRawString.split('\n')
			rawStrings.push(...partialRawStringsArr)
		}
		const onClose5 = (dataRaw) => {
			const images = processRawStringsToImagesArr(rawStrings, relativeFolder, titleFilter);
			shouldLog && log(h, ` TERM SEARCH + IMAGE => ENDED ${images.length}`, { searchParams });
			params.onSearchEnded({ images })
			end()
		}
		execaWrapper({
			cmdPath:backConfig.rgPath, 
			args: searchParams,
			onData: onData5,
			onClose: onClose5,
			onError: err => {onRgDoesNotExists(err)}
		})
	}
	// IMAGE SEARCH : only in folder and NOT in subfolders
	else if (params.typeSearch === 'folder-image') {
		const searchParams = [
			`${r.imageMd}`,
			folderToSearch,
			'--max-depth=1',
			'--ignore-case',
			'--type',
			'md',
			'--multiline',
			...exclusionArr
		]
		// const ripGrepStreamProcessImg1 = execaWrapper(backConfig.rgPath, searchParams)
		// if (!ripGrepStreamProcessImg1) errturn onRgDoesNotExists(err)

		// const rawStrings: string[] = []
		// ripGrepStreamProcessImg1.stdout.on('data', async dataRaw => {
		// 	const partialRawString = dataRaw.toString()
		// 	// split multiline strings
		// 	const partialRawStringsArr = partialRawString.split('\n')
		// 	rawStrings.push(...partialRawStringsArr)
		// })
		// ripGrepStreamProcessImg1.stdout.on('close', dataRaw => {
		// 	const images = processRawStringsToImagesArr(rawStrings, relativeFolder);
		// 	shouldLog && log(h, ` IMAGE FOLDER => ENDED ${images.length}`);
		// 	params.onSearchEnded({ images })
		// 	end()
		// })
		
		const rawStrings: string[] = []
		const onData6 = async dataRaw => {
			const partialRawString = dataRaw.toString()
			// split multiline strings
			const partialRawStringsArr = partialRawString.split('\n')
			rawStrings.push(...partialRawStringsArr)
		}
		const onClose6 = dataRaw => {
			const images = processRawStringsToImagesArr(rawStrings, relativeFolder);
			shouldLog && log(h, ` IMAGE FOLDER => ENDED ${images.length}`);
			params.onSearchEnded({ images })
			end()
		}
		execaWrapper({
			cmdPath:backConfig.rgPath, 
			args: searchParams,
			onData: onData6,
			onClose: onClose6,
			onError: err => {onRgDoesNotExists(err)}
		})
	}


	//////////////////////////////////////
	// SEARCH TYPE 4 : GENERIC

	else if (params.typeSearch === 'folder-regex') {
		const titleFilter = params.titleSearch ? processTerm : ''
		const searchedTerm = params.titleSearch ? '' : processTerm

		const termRegex = params.term
		const searchParams = [
			termRegex,
			folderToSearch,
			'--ignore-case',
			'--type',
			'md',
			'--multiline',
			...exclusionArr
		]

		// const ripGrepStreamProcessImg2 = execaWrapper(backConfig.rgPath, searchParams)
		// if (!ripGrepStreamProcessImg2) errturn onRgDoesNotExists(err)
		
		// const rawStrings: string[] = []
		// ripGrepStreamProcessImg2.stdout.on('data', async dataRaw => {
		// 	const partialRawString = dataRaw.toString()
		// })
		// ripGrepStreamProcessImg2.stdout.on('close', (dataRaw) => {
		// 	params.onSearchEnded({})
		// 	end()
		// })
		
		const rawStrings: string[] = []
		const onData7 = async dataRaw => {
			const partialRawString = dataRaw.toString()
		}
		const onClose7 = (dataRaw) => {
			params.onSearchEnded({})
			end()
		}
		execaWrapper({
			cmdPath:backConfig.rgPath, 
			args: searchParams,
			onData: onData7,
			onClose: onClose7,
			onError: err => {onRgDoesNotExists(err)}
		})
	}

	// // IMAGE SEARCH : only in folder and NOT in subfolders
	// else if (params.typeSearch === 'term-regex') {
	// 	const searchParams = [
	// 		`${r.imageMd}`,
	// 		folderToSearch,
	// 		'--max-depth=1',
	// 		'--ignore-case',
	// 		'--type',
	// 		'md',
	// 		'--multiline',
	// 	]
	// 	const ripGrepStreamProcessImg1 = execa(backConfig.rgPath, searchParams)
	// 	const rawStrings: string[] = []
	// 	ripGrepStreamProcessImg1.stdout.on('data', async dataRaw => {
	// 		const partialRawString = dataRaw.toString()
	// 		// split multiline strings
	// 		const partialRawStringsArr = partialRawString.split('\n')
	// 		rawStrings.push(...partialRawStringsArr)
	// 	})
	// 	ripGrepStreamProcessImg1.stdout.on('close', dataRaw => {
	// 		const images = processRawStringsToImagesArr(rawStrings, relativeFolder);
	// 		log(h, ` IMAGE FOLDER => ENDED ${images.length}`);
	// 		params.onSearchEnded({ images })
	// 	})
	// }

}





export const analyzeTerm = (term: string): {
	rawTerm: string,
	termId: string,
	term: string,
	folderToSearch: string,
	titleSearch: boolean
} => {
	let res = { rawTerm: term, termId: term, term: term, folderToSearch: '', titleSearch: false }

	// if only folder, term = ''
	let folderRaw1 = term.match(regexs.searchFolderNoSpace)
	if (folderRaw1 && folderRaw1[0]) {
		res.term = ''
		res.folderToSearch = folderRaw1[0]
	}

	// if folder in 'toto /hello/world'
	let folderRaw2 = term.match(regexs.searchFolder)
	if (folderRaw2 && folderRaw2[0]) {
		res.term = term.replace(folderRaw2[0], '')
		res.folderToSearch = folderRaw2[0].substr(1)
	}

	// if search term is intitle:toto, only search in title
	if (res.term.startsWith('intitle:')) {
		res.titleSearch = true
		res.term = res.term.replace('intitle:', '')
	}

	res.termId = res.termId.replace('/', '')

	return res
}
