import { iApiDictionary } from "../../../../shared/apiDictionary.type"
import { getDateObj } from "../../../../shared/helpers/date.helper"
import { createFileHistoryVersion, TEST_fileHistory_internals } from "../fileHistory.manager"
import { testHelpers } from "./test.helpers"

const folder = testHelpers.fs.params.folderPath
const testFilePath = folder + '/folder1/file_test.md'
const {getHistoryFile, processFileHistoryHousekeeping} = TEST_fileHistory_internals

// FUNCS
const TEST_createHistFileInfos = (datestr:string, content:string) => {
    const data:iApiDictionary["createHistoryFile"] = {
        filePath: testFilePath,
        content: content,
        historyFileType: 'enter',
    }
    let date = getDateObj(datestr)
    let historyFile = getHistoryFile(data.filePath, date, data.historyFileType)
    return {historyFile, date, data}
}

// these should be one left w1_
let f1 = TEST_createHistFileInfos("01/10/2023 10:20", "1111111111")
let f2 = TEST_createHistFileInfos("01/10/2023 15:20", "222222222222")

// these should be one left d15_11
let f3 = TEST_createHistFileInfos("11/15/2023 15:20", "33333333333")
let f4 = TEST_createHistFileInfos("11/15/2023 15:20", "444444444444"
)
// these should be kept
let f5 = TEST_createHistFileInfos("12/01/2023 01:20", "55555555555555")

let date_housekeeping = getDateObj("12/01/2023 10:20")















// TESTS

// test('getHistoryFile',  () => {
//     const exp = {"extension": "md", "filenameWithoutExt": "file_test_10-31-2023_10h20m_enter_dt1698747600", "folder": "/_auto_tests/folder1/.history/file_test/", "name": "file_test_10-31-2023_10h20m_enter_dt1698747600.md", "nature": "file", "path": "/_auto_tests/folder1/.history/file_test/file_test_10-31-2023_10h20m_enter_dt1698747600.md", "realname": "file_test_10-31-2023_10h20m_enter_dt1698747600.md"}
//     expect(
//         getHistoryFile(testFilePath, getDateObj("10/31/2023 10:20"), "enter")
//     ).toStrictEqual(exp);
//     // ).toStrictEqual(1);
// })
// test('createFileHistoryVersion: a file history version should be created in history folder', async () => {
//     await testHelpers.fs.cleanFolder()

//     await createFileHistoryVersion(f1.data, f1.date)
//     await createFileHistoryVersion(f2.data, f2.date)

//     expect( await fileExists(f1.historyFile.path) ).toStrictEqual(true)
//     expect( await openFile(f1.historyFile.path) ).toStrictEqual(f1.data.content)

//     expect( await fileExists(f2.historyFile.path) ).toStrictEqual(true)
//     expect( await openFile(f2.historyFile.path) ).toStrictEqual(f2.data.content)
// })

// housekeeping: if last history file +1day, start housekeeping process
test('housekeeping: if last history file +1day, start housekeeping process', async () => {
    await testHelpers.fs.cleanFolder()

    await createFileHistoryVersion(f1.data, f1.date)
    await createFileHistoryVersion(f2.data, f2.date)
    await createFileHistoryVersion(f3.data, f3.date)
    await createFileHistoryVersion(f4.data, f4.date)
    await createFileHistoryVersion(f5.data, f5.date)
    
    await processFileHistoryHousekeeping(f1.historyFile, date_housekeeping)

    expect(1).toStrictEqual(2)
})


 


// if we rename a file, it should also rename its history folder
// if we move a file, it should also move its history folder