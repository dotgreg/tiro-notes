import { cloneDeep, random } from "lodash"
import { sharedConfig } from "../../../shared/shared.config"
import { devCliAddFn, devCliGetFn } from "./devCli.manager"
import { getLs, setLs } from "./localstorage.manager"

const cat = `local_node_history`
const h = `[${cat.toUpperCase()}]`
let shouldLog = sharedConfig.client.log.verbose

export interface iLocalNoteHistory {
	content: string
	timestamp: number
	path: string
}

const lsId = "notes-history-ls"
const lsLimitInMb = 3 // dedicating only X MB to it (usually limit is 5MB / site)

export const getLocalNoteHistory = (notePath?: string): iLocalNoteHistory[] => {
	let res: iLocalNoteHistory[] = []

	let allNotesHist = cloneDeep(getLs<iLocalNoteHistory[]>(lsId))
	if (allNotesHist) {
		// return all notes if no notePath selected
		if (!notePath) res = allNotesHist
		else {
			let noteHist = allNotesHist.filter(n => n.path === notePath)
			res = noteHist
		}
	}

	return res
}

export const addLocalNoteHistory = (
	nLocalNoteHist: iLocalNoteHistory,
	limitPerPath: number = 6,
	debug?: boolean
) => {
	if (nLocalNoteHist.content.includes(`--disable-history--`)) return 
	
	let itAdd = nLocalNoteHist
	let nAllNotesHist = getLocalNoteHistory()
	let nAllNotesHistPath = getLocalNoteHistory(itAdd.path)
	debug && console.log(h, `adding el to ls : `, { itAdd })

	// remove all path notes
	nAllNotesHist = nAllNotesHist.filter(i => i.path !== itAdd.path)

	// add new el to hist path arr
	nAllNotesHistPath.unshift(itAdd)

	// if > limitPerPath, create a subArr
	if (nAllNotesHistPath.length > limitPerPath) nAllNotesHistPath = nAllNotesHistPath.slice(0, limitPerPath)

	// insert nAllNotesHistPath to nAllNotesHist
	nAllNotesHist = [...nAllNotesHistPath, ...nAllNotesHist]

	// if bigger than limit, remove items in arr
	let nNotesHist: iLocalNoteHistory[] = recursivelyReduceArrTillSmallerThan<iLocalNoteHistory>(nAllNotesHist, lsLimitInMb)

	// finally save itAdd
	setLs(lsId, nNotesHist)
}


//
// SUPPORT
//
const recursivelyReduceArrTillSmallerThan = <T>(arr: Array<T>, limitInMb: number): Array<T> => {
	let res: Array<T> = arr
	let arrStr = JSON.stringify(res)
	if (getStringSizeInMB(arrStr) > limitInMb && res.length > 1) {
		res.pop()
		shouldLog && console.log(h, "recursivelyReduceArrTillSmallerThan REDUCE ARR > new length=", res.length)
		return recursivelyReduceArrTillSmallerThan(res, limitInMb)
	} else {
		return res
	}
}

// ref string to bytes https://stackoverflow.com/questions/2219526/how-many-bytes-in-a-javascript-string
// ref limit mb https://stackoverflow.com/questions/2989284/what-is-the-max-size-of-localstorage-values
const getStringSizeInMB = (str: string): number => {
	const toMB = 1048576
	return new Blob([str]).size / toMB
}





////////////////////////////////////////////////
// DEBUG - TESTING CLI
//
devCliAddFn(cat, "addLocalNoteHistory", (debug: boolean = false, path: string = "/woopy/doopy") => {
	let nit: iLocalNoteHistory = { timestamp: Date.now(), path: path, content: `${random(0, 10000000)} helllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllo` }
	addLocalNoteHistory(nit, 10, debug)
})

devCliAddFn(cat, "addLocalNoteHistorySeveral", (nb: number = 10, debug: boolean = false, path: string = "/woopy/doopy") => {
	for (let i = 0; i < nb; i++) {
		devCliGetFn(cat, "addLocalNoteHistory")(debug, path)
	}
})

devCliAddFn(cat, "getLocalNoteHistory", (path) => {
	console.log(getLocalNoteHistory(path), `size: ${getStringSizeInMB(JSON.stringify(getLocalNoteHistory(path)))}MB`)
})

devCliAddFn(cat, "cleanLocalNoteHistory", () => {
	setLs(lsId, [])
	console.log(getLocalNoteHistory(), `size: ${getStringSizeInMB(JSON.stringify(getLocalNoteHistory()))}MB`)
})
