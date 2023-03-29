import { cloneDeep, random } from "lodash"
import { getLs, setLs } from "./localstorage.manager"
import { testCliAddFn, testCliGetFn } from "./testCli.manager"

const cat = `local_node_history`
const h = `[${cat.toUpperCase()}]`

export interface iLocalNoteHistory {
    content: string
    timestamp: number
    path: string
}

const lsId = "notes-history-ls"
const lsLimitInMb = 3 // dedicating only X MB to it (usually limit is 5MB / site)

export const getLocalNoteHistory = (notePath?:string):iLocalNoteHistory[] => {
    let res:iLocalNoteHistory[] = []

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

export const addLocalNoteHistory = (nLocalNoteHist: iLocalNoteHistory, limitPerPath: number = 10, debug?:boolean) => {
    let itAdd = nLocalNoteHist
    let nAllNotesHist = getLocalNoteHistory()
    let nAllNotesHistPath = getLocalNoteHistory(itAdd.path)
    debug && console.log(h, `adding el to ls : `,{itAdd})

    // remove all path notes
    nAllNotesHist = nAllNotesHist.filter(i => i.path !== itAdd.path)

    // add new el to hist path arr
    nAllNotesHistPath.unshift(itAdd)

    // if > limitPerPath, create a subArr
    if (nAllNotesHistPath.length > limitPerPath) nAllNotesHistPath = nAllNotesHistPath.slice(0,limitPerPath)

    // insert nAllNotesHistPath to nAllNotesHist
    nAllNotesHist = [...nAllNotesHistPath,...nAllNotesHist]

    // if bigger than limit, remove items in arr
    let nNotesHist:iLocalNoteHistory[] = recursivelyReduceArrTillSmallerThan<iLocalNoteHistory>(nAllNotesHist, lsLimitInMb)

    // finally save itAdd
    setLs(lsId, nNotesHist)
}


//
// SUPPORT
//
const recursivelyReduceArrTillSmallerThan = <T>(arr:Array<T>, limitInMb: number):Array<T> => {
    let res:Array<T> = arr
    let arrStr = JSON.stringify(res)
    if (getStringSizeInMB(arrStr) > limitInMb && res.length > 1) {
        res.pop()
        console.log(h, "recursivelyReduceArrTillSmallerThan REDUCE ARR > new length=", res.length)
        return recursivelyReduceArrTillSmallerThan(res, limitInMb)
    } else {
        return res
    }
}

// ref string to bytes https://stackoverflow.com/questions/2219526/how-many-bytes-in-a-javascript-string
// ref limit mb https://stackoverflow.com/questions/2989284/what-is-the-max-size-of-localstorage-values
const getStringSizeInMB = (str:string):number => {
    const toMB = 1048576
    return new Blob([str]).size / toMB
}





////////////////////////////////////////////////
// DEBUG - TESTING CLI
//
testCliAddFn(cat, "addLocalNoteHistory",  (debug:boolean=false, path:string="/woopy/doopy") => {
    let nit:iLocalNoteHistory = {timestamp: Date.now(), path: path, content: `${random(0, 10000000)} helllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllohelllo helllo helllo`}
    addLocalNoteHistory(nit, 10, debug)
})

testCliAddFn(cat, "addLocalNoteHistorySeveral", (nb:number=10, debug:boolean=false, path:string="/woopy/doopy") => {
    for (let i = 0; i < nb; i++) {
        testCliGetFn(cat, "addLocalNoteHistory")(debug, path)
    }
})

testCliAddFn(cat, "getLocalNoteHistory", (path) => {
    console.log(getLocalNoteHistory(path), `size: ${getStringSizeInMB(JSON.stringify(getLocalNoteHistory(path)))}MB`)
})

testCliAddFn(cat, "cleanLocalNoteHistory", () => {
    setLs(lsId, [])
    console.log(getLocalNoteHistory(), `size: ${getStringSizeInMB(JSON.stringify(getLocalNoteHistory()))}MB`)
})