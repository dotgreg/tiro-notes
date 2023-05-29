import { iActivityLog } from "../../../../shared/types.shared";
import {  generateReportFromDbs,   processTimeBatchInt, getReportPaths } from "../activity.manager";
import { getDateObj, iDateObj } from "../date.manager";

const getDate = ():iDateObj => {
    return getDateObj(`2023/05/27 16:58`)
    // return 
    // {"day": "27", "hour": "16", "min": "58", "month": "05", "year": "2023", full:}
}

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
        {eventName:"file1", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
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
    let exp = {"days": {"27": {"0": {"appUrl": [0], "eventAction": [0], "eventName": [0], "ip": [0], "time": ["16:58"], "ua": [0], "weight": [13]}, "1": {"appUrl": [0], "eventAction": [1], "eventName": [1], "ip": [1], "time": ["16:58"], "ua": [0], "weight": [3]}, "2": {"appUrl": [1], "eventAction": [2], "eventName": [2], "ip": [0], "time": ["16:58"], "ua": [1], "weight": [1]}}}, "fields": {"appUrl": ["url1", "url2"], "eventAction": ["read", "write", "log"], "eventName": ["file1", "file2", "file3"], "ip": ["3.3.3.3", "3.3.3.4"], "ua": ["ua1", "ua2"]}}
    expect(res).toStrictEqual(exp);
  })


  test('processTimeBatchInt:check result for several time batches', () => {
    
    let timebatch1:iActivityLog[] = [
        {eventName:"file1", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"write", ip:"3.3.3.4", ua:"ua1", appUrl:"url1"},
        {eventName:"file2", eventAction:"write", ip:"3.3.3.4", ua:"ua1", appUrl:"url1"},
        {eventName:"file2", eventAction:"write", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file3", eventAction:"log", ip:"3.3.3.3", ua:"ua2", appUrl:"url2"},
    ]
    let timebatch2:iActivityLog[] = [
        {eventName:"file1", eventAction:"download1", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
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

    let res = {"days": {"27": {"0": {"appUrl": [0, 0], "eventAction": [0, 3], "eventName": [0, 0], "ip": [0, 0], "time": ["16:0", "16:10"], "ua": [0, 0], "weight": [9, 3]}, "1": {"appUrl": [0, 0], "eventAction": [1, 5], "eventName": [1, 1], "ip": [1, 1], "time": ["16:0", "16:10"], "ua": [0, 0], "weight": [2, 2]}, "2": {"appUrl": [1, 1], "eventAction": [2, 7], "eventName": [2, 2], "ip": [0, 0], "time": ["16:0", "16:10"], "ua": [1, 1], "weight": [1, 1]}}}, "fields": {"appUrl": ["url1", "url2"], "eventAction": ["read", "write", "log", "download1", "download2", "download3", "download4", "download5"], "eventName": ["file1", "file2", "file3"], "ip": ["3.3.3.3", "3.3.3.4"], "ua": ["ua1", "ua2"]}}
    expect(newMonthlyDb2).toStrictEqual(res);

  })
  
  







  //
  // REPORTS
  //

  const getDb = () => {
    let timebatch1:iActivityLog[] = [
        {eventName:"file1", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"read", ip:"3.3.3.5", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"read", ip:"3.3.3.5", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"read", ip:"3.3.3.5", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"read", ip:"3.3.3.5", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"read", ip:"3.3.3.5", ua:"ua1", appUrl:"url1"},
        {eventName:"file1", eventAction:"read", ip:"3.3.3.5", ua:"ua1", appUrl:"url1"},
        {eventName:"file2", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file3", eventAction:"read", ip:"3.3.3.2", ua:"ua1", appUrl:"url1"},
        {eventName:"file4", eventAction:"read", ip:"3.3.3.3", ua:"ua1", appUrl:"url1"},
        {eventName:"file5", eventAction:"read", ip:"3.3.3.4", ua:"ua1", appUrl:"url1"},
    ]

    let time1 = getDate()
    time1.min = '0'

    const newMonthlyDb1 = processTimeBatchInt({
        monthlyDb: null, 
        newTimeBatch: timebatch1,
        currentDate:time1
    })
    return newMonthlyDb1
  }

  test('generateReportFromDbs:file report', () => {
    let monthlyDb = getDb()
    const report = generateReportFromDbs({
        startDate: "01/01/2023",
        endDate: "12/01/2023",
        organizeBy:"file",
    }, {
        ["2022-02"]: monthlyDb,
        ["2023-05"]: monthlyDb,
    })
    let exp = {"file1": {"arr": [{"date": "02/27/2022 16:00", "eventAction": "read", "ip": "3.3.3.3", "ua": "ua1", "weight": 7}, {"date": "05/27/2023 16:00", "eventAction": "read", "ip": "3.3.3.3", "ua": "ua1", "weight": 7}]}, "file2": {"arr": [{"date": "02/27/2022 16:00", "eventAction": "read", "ip": "3.3.3.3", "ua": "ua1", "weight": 1}, {"date": "05/27/2023 16:00", "eventAction": "read", "ip": "3.3.3.3", "ua": "ua1", "weight": 1}]}, "file3": {"arr": [{"date": "02/27/2022 16:00", "eventAction": "read", "ip": "3.3.3.2", "ua": "ua1", "weight": 1}, {"date": "05/27/2023 16:00", "eventAction": "read", "ip": "3.3.3.2", "ua": "ua1", "weight": 1}]}, "file4": {"arr": [{"date": "02/27/2022 16:00", "eventAction": "read", "ip": "3.3.3.3", "ua": "ua1", "weight": 1}, {"date": "05/27/2023 16:00", "eventAction": "read", "ip": "3.3.3.3", "ua": "ua1", "weight": 1}]}, "file5": {"arr": [{"date": "02/27/2022 16:00", "eventAction": "read", "ip": "3.3.3.4", "ua": "ua1", "weight": 1}, {"date": "05/27/2023 16:00", "eventAction": "read", "ip": "3.3.3.4", "ua": "ua1", "weight": 1}]}}
    expect(report).toStrictEqual(exp);
  })

  test('generateReportFromDbs:time report', () => {
    let monthlyDb = getDb()
    const report = generateReportFromDbs({
        startDate: "01/01/2023",
        endDate: "12/01/2023",
        organizeBy:"time",
    }, {
        ["2022-02"]: monthlyDb,
        ["2023-05"]: monthlyDb,
    })
    let exp = {"2022": {"02": {"27": {"16": [{"date": "02/27/2022 16:00", "eventAction": "read", "eventName": "file1", "ip": "3.3.3.3", "ua": "ua1", "weight": 7}, {"date": "02/27/2022 16:00", "eventAction": "read", "eventName": "file2", "ip": "3.3.3.3", "ua": "ua1", "weight": 1}, {"date": "02/27/2022 16:00", "eventAction": "read", "eventName": "file3", "ip": "3.3.3.2", "ua": "ua1", "weight": 1}, {"date": "02/27/2022 16:00", "eventAction": "read", "eventName": "file4", "ip": "3.3.3.3", "ua": "ua1", "weight": 1}, {"date": "02/27/2022 16:00", "eventAction": "read", "eventName": "file5", "ip": "3.3.3.4", "ua": "ua1", "weight": 1}]}}}, "2023": {"05": {"27": {"16": [{"date": "05/27/2023 16:00", "eventAction": "read", "eventName": "file1", "ip": "3.3.3.3", "ua": "ua1", "weight": 7}, {"date": "05/27/2023 16:00", "eventAction": "read", "eventName": "file2", "ip": "3.3.3.3", "ua": "ua1", "weight": 1}, {"date": "05/27/2023 16:00", "eventAction": "read", "eventName": "file3", "ip": "3.3.3.2", "ua": "ua1", "weight": 1}, {"date": "05/27/2023 16:00", "eventAction": "read", "eventName": "file4", "ip": "3.3.3.3", "ua": "ua1", "weight": 1}, {"date": "05/27/2023 16:00", "eventAction": "read", "eventName": "file5", "ip": "3.3.3.4", "ua": "ua1", "weight": 1}]}}}}
    expect(report).toStrictEqual(exp);
  })

  test('generateReportFromDbs:ip report', () => {
    let monthlyDb = getDb()
    const report = generateReportFromDbs({
        startDate: "01/01/2023",
        endDate: "12/01/2023",
        organizeBy:"ip",
    }, {
        ["2022-02"]: monthlyDb,
        ["2023-05"]: monthlyDb,
    })
    let exp = {"3.3.3.2": {"arr": [{"date": "02/27/2022 16:00", "eventAction": "read", "eventName": "file3", "ua": "ua1", "weight": 1}, {"date": "05/27/2023 16:00", "eventAction": "read", "eventName": "file3", "ua": "ua1", "weight": 1}]}, "3.3.3.3": {"arr": [{"date": "02/27/2022 16:00", "eventAction": "read", "eventName": "file1", "ua": "ua1", "weight": 7}, {"date": "05/27/2023 16:00", "eventAction": "read", "eventName": "file1", "ua": "ua1", "weight": 7}]}, "3.3.3.4": {"arr": [{"date": "02/27/2022 16:00", "eventAction": "read", "eventName": "file4", "ua": "ua1", "weight": 1}, {"date": "05/27/2023 16:00", "eventAction": "read", "eventName": "file4", "ua": "ua1", "weight": 1}]}, "3.3.3.5": {"arr": [{"date": "02/27/2022 16:00", "eventAction": "read", "eventName": "file2", "ua": "ua1", "weight": 1}, {"date": "05/27/2023 16:00", "eventAction": "read", "eventName": "file2", "ua": "ua1", "weight": 1}]}, "undefined": {"arr": [{"date": "02/27/2022 16:00", "eventAction": "read", "eventName": "file5", "ua": "ua1", "weight": 1}, {"date": "05/27/2023 16:00", "eventAction": "read", "eventName": "file5", "ua": "ua1", "weight": 1}]}}
    expect(report).toStrictEqual(exp);
  })











  test('getReportPaths:same year', () => {
    let res = getReportPaths(getDateObj("03/31/2023"), getDateObj("10/07/2023"))
    
    expect(
        res.paths[0].endsWith(".tiro/activity/2023-03.md") 
        && res.paths[res.paths.length-1].endsWith(".tiro/activity/2023-10.md") 
        && res.paths.length === 8 
    ? true : res
    ).toStrictEqual(true)
  })

  test('getReportPaths:wrong end/start', () => {
    let res = getReportPaths(getDateObj("12/30/2023"), getDateObj("10/30/2023"))
    expect(res.paths).toStrictEqual([]);
  })

  test('getReportPaths:several years', () => {
    let res = getReportPaths(getDateObj("12/30/2021"), getDateObj("10/30/2023"))
    expect(
        res.paths[0].endsWith(".tiro/activity/2021-12.md") 
        && res.paths[res.paths.length-1].endsWith(".tiro/activity/2023-10.md") 
        && res.paths.length === 23
        ? true : res
    ).toStrictEqual(true)
  })

