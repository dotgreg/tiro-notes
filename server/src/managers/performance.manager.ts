import { cloneDeep, each, orderBy } from "lodash"

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

export type iPerfStat = {
    title: string, 
    timeMs:number, 
    timeSec?:number, 
    timePerCall:number, 
    calls:number, 
    timePercent?:number,
    children?:{[name:string]:iPerfStat} 
    childrenArr?:iPerfStat[]
}
export type iPerfCampaignInfos = {
    startDate: null| number,
    endDate: null| number,
    timeInHour: null| number,
    stats: any,
}

const perfStatsObj:{[name:string]: iPerfStat} = {}
const perfCampaign:iPerfCampaignInfos = {
    startDate: null,
    endDate: null,
    timeInHour: null,
    stats: null
}

const addToPerfStats = (id:string, time:number) => {
    if (perfCampaign.startDate === null) perfCampaign.startDate = Date.now()
    let cat = id.split(" ")[0]
    let task = id.substring(cat.length+1) || null
    if(!perfStatsObj[cat]) perfStatsObj[cat] = {title: cat, timeMs: 0, calls:0, timePerCall:0, children:{}}
    perfStatsObj[cat].timeMs += time
    perfStatsObj[cat].timeSec = perfStatsObj[cat].timeMs / 1000
    perfStatsObj[cat].calls += 1
    perfStatsObj[cat].timePerCall = Math.round(perfStatsObj[cat].timeMs / perfStatsObj[cat].calls)

    if (task) {
        let cs = perfStatsObj[cat]['children']
        if (!cs) cs = {}
        if (!cs[task]) cs[task] = {timeMs: 0, calls:0, timePerCall:0, title: task}
        let o =cs[task]
        o.timeMs += time
        o.calls += 1
        o.timePerCall = Math.round(o.timeMs / o.calls)
    }
}

export interface iPerformanceReport {log:iPerfStat[], campaign:iPerfCampaignInfos }

export const getPerformanceReport = ():iPerformanceReport => {
    let res:iPerfStat[] = []
    let global = {timeMs: 0, reqs:0, timeMsPerReq:0}

    each(perfStatsObj, s => {
        global.timeMs += s.timeMs
        global.reqs += s.calls
        const ns = cloneDeep(s)
        ns.childrenArr = orderBy(s.children, ['timeMs'], ["desc"])
        each(ns.childrenArr, c => {
            c.timePercent = Math.round((c.timeMs/s.timeMs) * 100)
        })
        ns.children = {}
        res.push(ns)
    })
    global.timeMsPerReq = global.timeMs/global.reqs
    res = orderBy(res, ['timeMs'], ["desc"])
    if (res.length === 0) res.push({title: "no stats, are you in -v 3, performance log mode?", timeMs:0, timePerCall:0, calls: 0})
    
    perfCampaign.endDate = Date.now()
    perfCampaign.stats = global
    if (perfCampaign.startDate) perfCampaign.timeInHour = (perfCampaign.endDate - perfCampaign.startDate) / (60 * 60 * 1000)
    
    return {log:res, campaign: perfCampaign}
}
 

// let end = monitorPerf('ttt')