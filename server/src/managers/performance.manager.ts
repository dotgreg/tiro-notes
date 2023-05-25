
let isPerfMonitoringEnabled:any = process.env.TIRO_PERFORMANCE_MONITORING_BACKEND
// isPerfMonitoringEnabled = false

const h = `[PERFS]`
console.log(`${h} perf mode =`, isPerfMonitoringEnabled, process.env.TIRO_PERFORMANCE_MONITORING_BACKEND)

export const perf = (id:string) => {
    let startDate = new Date().getTime()
    const end = () => {
        if (isPerfMonitoringEnabled !== true) return
        // cache[id].stop = 
        let diff = new Date().getTime() - startDate
        console.log(`${h} ${id} => ${diff}ms`)
    }
    return end
}

// let end = monitorPerf('ttt')