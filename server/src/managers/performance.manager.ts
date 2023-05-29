import { each, orderBy } from "lodash"

let isPerfMonitoringEnabled:any = process.env.TIRO_PERFORMANCE_MONITORING_BACKEND
if (isPerfMonitoringEnabled === true) isPerfMonitoringEnabled = true
if (isPerfMonitoringEnabled === 'true') isPerfMonitoringEnabled = true


// isPerfMonitoringEnabled = true  

const h = `[PERFS]`
console.log(`${h} perf mode =`, isPerfMonitoringEnabled, process.env.TIRO_PERFORMANCE_MONITORING_BACKEND)

export const perf = (id:string) => {
    let startDate = new Date().getTime()
    const end = () => {
        if (isPerfMonitoringEnabled === true) {
            let diff = new Date().getTime() - startDate
            console.log(`${h} ${id} => ${diff}ms`)
            addToPerfStats(id, diff)
        }
    }
    return end
}

export type iPerfStat = {title: string, timeMs:number, timePerCall:number, calls:number, children?:{[name:string]:iPerfStat} }
const perfStatsObj:{[name:string]: iPerfStat} = {}
const addToPerfStats = (id:string, time:number) => {
    let cat = id.split(" ")[0]
    let task = id.substring(cat.length+1) || null
    if(!perfStatsObj[cat]) perfStatsObj[cat] = {title: cat, timeMs: 0, calls:0, timePerCall:0, children:{}}
    perfStatsObj[cat].timeMs += time
    perfStatsObj[cat].calls += 1
    perfStatsObj[cat].timePerCall = perfStatsObj[cat].timeMs / perfStatsObj[cat].calls

    if (task) {
        let cs = perfStatsObj[cat]['children']
        if (!cs) cs = {}
        if (!cs[task]) cs[task] = {timeMs: 0, calls:0, timePerCall:0, title: task}
        let o =cs[task]
        o.timeMs += time
        o.calls += 1
        o.timePerCall = o.timeMs / o.calls
    }
}
export const getPerformanceReport = ():iPerfStat[] => {
    let res:iPerfStat[] = []
    each(perfStatsObj, s => {
        res.push(s)
    })
    res = orderBy(res, ['timeMs'], ["desc"])
    if (res.length === 0) res.push({title: "no stats, are you in -v 3, performance log mode?", timeMs:0, timePerCall:0, calls: 0})
    return res
}
 

// let end = monitorPerf('ttt')