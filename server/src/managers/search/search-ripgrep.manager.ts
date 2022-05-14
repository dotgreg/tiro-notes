import { each } from "lodash";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { sharedConfig } from "../../../../shared/shared.config";
import { iFile, iFileImage } from "../../../../shared/types.shared";
import { backConfig } from "../../config.back";
import { fileExists } from "../fs.manager";
import { log } from "../log.manager";
import { getRelativePath } from "../path.manager";
import { processRawDataToFiles, processRawPathToFile } from "./file.search.manager";
import { processRawStringsToImagesArr } from "./image.search.manager";
import { iMetasFiles, mergingMetaToFilesArr, processRawStringsToMetaObj } from "./metas.search.manager";

const h = `[RIPGREP SEARCH] `
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

// SEARCH WITH RG
export const searchWithRipGrep = async (params: {
	term: string,
	folder: string,
	titleSearch: boolean,
	imageSearch?: boolean,
	recursive: boolean,
	onSearchEnded: (res: { files?: iFile[], images?: iFileImage[] }) => Promise<void>
}): Promise<void> => {

	let processTerm = params.term.split('-').join('\\-')

	// if backconfigFolder doesnt exists, add it
	const relativeFolder = getRelativePath(params.folder)
	const folderToSearch = `${backConfig.dataFolder + relativeFolder}`;

	const perfs = { init: Date.now(), cmd1: Date.now(), cmd2: Date.now() }
	const searchType = (params.term === '') ? 'folder' : 'term'

	const debugMode = (folderToSearch === '/sdcard/tiro-notes/main') ? true : false

	// regex dictionary
	const r = {
		all: '[\\d\\D]*',
		imageMd: '!\[[^\]]+\]\([^\]]+\)',
		headerStart: sharedConfig.metas.headerStart,
		headerStop: sharedConfig.metas.headerEnd,
	}

	//////////////////////////////////////
	// SEARCH TYPE 1 : TERM SEARCH
	//
	if (searchType === 'term' && !params.imageSearch) {
		const titleFilter = params.titleSearch ? processTerm : ''
		const searchedTerm = params.titleSearch ? '' : processTerm

		const termRegex = `(${r.headerStart}${r.all}${r.headerStop})*${r.all}${searchedTerm}${r.all}(${r.headerStart}${r.all}${r.headerStop})*`
		const normalSearchParams = [
			termRegex,
			folderToSearch,
			'--ignore-case',
			'--type',
			'md',
			'--multiline',
		]


		let resultsRawArr: string[] = []
		const ripGrepStreamProcess1 = execa(backConfig.rgPath, normalSearchParams)
		ripGrepStreamProcess1.stdout.on('data', async dataRaw => {
			const rawMetaString = dataRaw.toString()
			// split multiline strings
			const rawMetaArr = rawMetaString.split('\n')
			resultsRawArr.push(...rawMetaArr)
		})
		ripGrepStreamProcess1.stdout.on('close', dataRaw => {
			const metasFilesObj = processRawStringsToMetaObj(resultsRawArr, relativeFolder, true);
			// if (debugMode) log(11, resultsRawArr, 'to', metasFilesObj)
			const scannedFilesObj: iFilesObj = {}
			let index = 0
			each(metasFilesObj, (metaObj, fileName) => {
				const file = processRawPathToFile(fileName, relativeFolder, index, titleFilter)
				if (file && file.name) {
					if (fileExists(`${backConfig.dataFolder}/${file.path}`)) {
						scannedFilesObj[file.name] = file
						index++
					}
				}
			})
			const filesWithMetaUpdated = mergingMetaToFilesArr(scannedFilesObj, metasFilesObj)
			const debugObj = debugMode ? { filesWithMetaUpdated, scannedFilesObj, metasFilesObj } : {}

			log(h, ` FOLDER => CMD2 => ENDED `, { files: filesWithMetaUpdated.length, metasFilesObj, normalSearchParams, debugObj });
			params.onSearchEnded({ files: filesWithMetaUpdated })
		})
	}

	//////////////////////////////////////
	// SEARCH TYPE 2 : FOLDER SEARCH
	//
	else if (searchType === 'folder' && !params.imageSearch) {
		const fullFolderSearchParams = [
			'--files',
			folderToSearch,
			'--max-depth=1',
			'--type',
			'md',
		]

		const metaFilesInFullFolderSearch = [
			`${r.headerStart}${r.all}${r.headerStop}`,
			folderToSearch,
			'--max-depth=1',
			'--type',
			'md',
			'--multiline',
		]

		// PROCESS 1
		const ripGrepStreamProcess1 = execa(backConfig.rgPath, fullFolderSearchParams)
		// const filesScanned:iFile[] = []
		const filesScannedObj: iFilesObj = {}
		ripGrepStreamProcess1.stdout.on('data', async dataRaw => {
			let data = dataRaw.toString()
			const files = processRawDataToFiles(data, params.titleSearch ? processTerm : '', relativeFolder)
			each(files, file => {
				if (file && file.name) {
					filesScannedObj[file.name] = file
				}
			})
		})
		ripGrepStreamProcess1.stdout.on('close', dataRaw => {
			log(h, ` FOLDER => CMD1 => ENDED : ${filesScannedObj.length} elements found`, { fullFolderSearchParams });
			perfs.cmd1 = Date.now()
			triggerAggregationIfEnded()
		})

		// PROCESS 2
		const ripGrepStreamProcess2 = execa(backConfig.rgPath, metaFilesInFullFolderSearch)
		const rawMetasStrings: string[] = []
		let metasFilesScanned: iMetasFiles = {}
		ripGrepStreamProcess2.stdout.on('data', async dataRaw => {
			const rawMetaString = dataRaw.toString()
			// split multiline strings
			const rawMetaArr = rawMetaString.split('\n')
			rawMetasStrings.push(...rawMetaArr)
		})
		ripGrepStreamProcess2.stdout.on('close', dataRaw => {
			// process raw strings to meta objs

			metasFilesScanned = processRawStringsToMetaObj(rawMetasStrings, relativeFolder)
			log(h, ` FOLDER => CMD2 => ENDED `, { metaFilesInFullFolderSearch });
			perfs.cmd2 = Date.now()
			triggerAggregationIfEnded()
		})

		// PROCESS 3 : AGGREGATE RESULTS WHEN BOTH CMDS ARE DONE
		let counterCmdsDone = 0
		const triggerAggregationIfEnded = () => {
			counterCmdsDone++
			if (counterCmdsDone === 2) {
				const filesWithMetaUpdated = mergingMetaToFilesArr(filesScannedObj, metasFilesScanned)
				const perfString = `tot:${Date.now() - perfs.init}ms / cmd1:${perfs.cmd1 - perfs.init}ms / cmd2:${perfs.cmd2 - perfs.init}ms`
				log(h, ` FOLDER => BOTH CMDS => ENDED `, { files: filesWithMetaUpdated.length, metasFilesScanned, perfString, perfs });
				params.onSearchEnded({ files: filesWithMetaUpdated })
			}
		}
	}


	//////////////////////////////////////
	// SEARCH TYPE 3 : IMAGE SEARCH
	//
	else if (searchType === 'term' && params.imageSearch) {
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
		]
		const ripGrepStreamProcessImg2 = execa(backConfig.rgPath, searchParams)
		const rawStrings: string[] = []
		ripGrepStreamProcessImg2.stdout.on('data', async dataRaw => {
			const partialRawString = dataRaw.toString()
			// split multiline strings
			const partialRawStringsArr = partialRawString.split('\n')
			rawStrings.push(...partialRawStringsArr)
		})
		ripGrepStreamProcessImg2.stdout.on('close', (dataRaw) => {
			const images = processRawStringsToImagesArr(rawStrings, relativeFolder, titleFilter);
			log(h, ` TERM SEARCH + IMAGE => ENDED ${images.length}`, { searchParams });
			params.onSearchEnded({ images })
		})
	}
	else if (searchType === 'folder' && params.imageSearch) {
		const searchParams = [
			`${r.imageMd}`,
			folderToSearch,
			'--max-depth=1',
			'--ignore-case',
			'--type',
			'md',
			'--multiline',
		]
		const ripGrepStreamProcessImg1 = execa(backConfig.rgPath, searchParams)
		const rawStrings: string[] = []
		ripGrepStreamProcessImg1.stdout.on('data', async dataRaw => {
			const partialRawString = dataRaw.toString()
			// split multiline strings
			const partialRawStringsArr = partialRawString.split('\n')
			rawStrings.push(...partialRawStringsArr)
		})
		ripGrepStreamProcessImg1.stdout.on('close', dataRaw => {
			const images = processRawStringsToImagesArr(rawStrings, relativeFolder);
			log(h, ` IMAGE FOLDER => ENDED ${images.length}`);
			params.onSearchEnded({ images })
		})
	}



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
