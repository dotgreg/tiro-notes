import {  generateReportFromDbs, iActivityLog, iDateTime, processTimeBatchInt } from "../activity.manager";

const getDate = ():iDateTime => {return {"day": "27", "hour": "16", "min": "58", "month": "05", "year": "2023"}}

test('processTimeBatchInt if null', () => {
    
    const newMonthlyDb = processTimeBatchInt({
        monthlyDb: null, 
        newTimeBatch: [],
        currentDate:getDate()
    })
    let exp = {"days": {}, "fields": {}}
    expect(newMonthlyDb).toStrictEqual(exp);
})

test('processTimeBatchInt:check result for one batch', () => {
    let timebatch:iActivityLog[] = [
        {eventName:"file1", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"write", ip:"3.3.3.4", ua:"ua1", appUrl:"url1"},
        {eventName:"file2", eventAction:"write", ip:"3.3.3.4", ua:"ua1", appUrl:"url1"},
        {eventName:"file2", eventAction:"write", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file2", eventAction:"write", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file3", eventAction:"log", ip:"3.3.3.3", ua:"ua2", appUrl:"url2"},
    ]

    const newMonthlyDb = processTimeBatchInt({
        monthlyDb: null, 
        newTimeBatch: timebatch,
        currentDate:getDate()
    })
    const res = newMonthlyDb
    let exp = {"days": {"27": {"0": {"appUrl": [0], "eventAction": [0], "eventName": [0], "ip": [0], "time": ["16:58"], "ua": [0]}, "1": {"appUrl": [0], "eventAction": [1], "eventName": [1], "ip": [1], "time": ["16:58"], "ua": [0]}, "2": {"appUrl": [1], "eventAction": [2], "eventName": [2], "ip": [0], "time": ["16:58"], "ua": [1]}}}, "fields": {"appUrl": ["url1", "url2"], "eventAction": ["read", "write", "log"], "eventName": ["file1", "file2", "file3"], "ip": ["3.3.3.3", "3.3.3.4"], "ua": ["ua1", "ua2"]}}
    expect(res).toStrictEqual(exp);
  })


  test('processTimeBatchInt:check result for several time batches', () => {
    
    let timebatch1:iActivityLog[] = [
        {eventName:"file1", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"write", ip:"3.3.3.4", ua:"ua1", appUrl:"url1"},
        {eventName:"file2", eventAction:"write", ip:"3.3.3.4", ua:"ua1", appUrl:"url1"},
        {eventName:"file2", eventAction:"write", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file3", eventAction:"log", ip:"3.3.3.3", ua:"ua2", appUrl:"url2"},
    ]
    let timebatch2:iActivityLog[] = [
        {eventName:"file1", eventAction:"download1", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"download2", ip:"3.3.3.4", ua:"ua1", appUrl:"url1"},
        {eventName:"file2", eventAction:"download3", ip:"3.3.3.4", ua:"ua1", appUrl:"url1"},
        {eventName:"file2", eventAction:"download4", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file3", eventAction:"download5", ip:"3.3.3.3", ua:"ua2", appUrl:"url2"},
    ]

    let time1 = getDate()
    time1.min = '0'

    let time2 = getDate()
    time2.min = `${parseInt(time1.min) + 10}`

    const newMonthlyDb1 = processTimeBatchInt({
        monthlyDb: null, 
        newTimeBatch: timebatch1,
        currentDate:time1
    })
    const newMonthlyDb2 = processTimeBatchInt({
        monthlyDb: newMonthlyDb1, 
        newTimeBatch: timebatch2,
        currentDate:time2
    })

    let res = {"days": {"27": {"0": {"appUrl": [0, 0], "eventAction": [0, 3], "eventName": [0, 0], "ip": [0, 0], "time": ["16:0", "16:10"], "ua": [0, 0]}, "1": {"appUrl": [0, 0], "eventAction": [1, 5], "eventName": [1, 1], "ip": [1, 1], "time": ["16:0", "16:10"], "ua": [0, 0]}, "2": {"appUrl": [1, 1], "eventAction": [2, 7], "eventName": [2, 2], "ip": [0, 0], "time": ["16:0", "16:10"], "ua": [1, 1]}}}, "fields": {"appUrl": ["url1", "url2"], "eventAction": ["read", "write", "log", "download1", "download2", "download3", "download4", "download5"], "eventName": ["file1", "file2", "file3"], "ip": ["3.3.3.3", "3.3.3.4"], "ua": ["ua1", "ua2"]}}

    expect(newMonthlyDb2).toStrictEqual(res);

  })
  
  
  test('generateReportFromDbs:check result for several time batches', () => {
    
    let timebatch1:iActivityLog[] = [
        {eventName:"file1", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"write", ip:"3.3.3.4", ua:"ua1", appUrl:"url1"},
        {eventName:"file2", eventAction:"write", ip:"3.3.3.4", ua:"ua1", appUrl:"url1"},
        {eventName:"file2", eventAction:"write", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file3", eventAction:"log", ip:"3.3.3.3", ua:"ua2", appUrl:"url2"},
    ]
    let timebatch2:iActivityLog[] = [
        {eventName:"file1", eventAction:"download1", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"download2", ip:"3.3.3.4", ua:"ua1", appUrl:"url1"},
        {eventName:"file2", eventAction:"download3", ip:"3.3.3.4", ua:"ua1", appUrl:"url1"},
        {eventName:"file2", eventAction:"download4", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file3", eventAction:"download5", ip:"3.3.3.3", ua:"ua2", appUrl:"url2"},
    ]

    // let time1 = getDate()
    // time1.min = '0'

    let time2 = getDate()
    time2.min = `${parseInt(time1.min) + 10}`

    const newMonthlyDb1 = processTimeBatchInt({
        monthlyDb: null, 
        newTimeBatch: timebatch1,
        currentDate:time1
    })
    // const newMonthlyDb2 = processTimeBatchInt({
    //     monthlyDb: newMonthlyDb1, 
    //     newTimeBatch: timebatch2,
    //     currentDate:time2
    // })

    let res = {"days": {"27": {"0": {"appUrl": [0, 0], "eventAction": [0, 3], "eventName": [0, 0], "ip": [0, 0], "time": ["16:0", "16:10"], "ua": [0, 0]}, "1": {"appUrl": [0, 0], "eventAction": [1, 5], "eventName": [1, 1], "ip": [1, 1], "time": ["16:0", "16:10"], "ua": [0, 0]}, "2": {"appUrl": [1, 1], "eventAction": [2, 7], "eventName": [2, 2], "ip": [0, 0], "time": ["16:0", "16:10"], "ua": [1, 1]}}}, "fields": {"appUrl": ["url1", "url2"], "eventAction": ["read", "write", "log", "download1", "download2", "download3", "download4", "download5"], "eventName": ["file1", "file2", "file3"], "ip": ["3.3.3.3", "3.3.3.4"], "ua": ["ua1", "ua2"]}}

    expect(newMonthlyDb2).toStrictEqual(res);

    

    const report = generateReportFromDbs({
        startDate: "01/01/2023",
        endDate: "12/01/2023",
        organizeBy:"file",
    }, {
        ["2022-02"]: newMonthlyDb2,
        ["2023-05"]: newMonthlyDb2,
    })

    expect(report).toStrictEqual(1);
  })
