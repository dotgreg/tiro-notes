import { iApiDictionary } from "../../../../shared/apiDictionary.type"
import { getDateObj } from "../../../../shared/helpers/date.helper"
import { createFileHistoryVersion, fileHistoryParams, TEST_fileHistory_internals } from "../fileHistory.manager"
import { fileExists, openFile } from "../fs.manager"
import { getFolderPath } from "../path.manager"
import { testHelpers } from "./test.helpers"

const folder = testHelpers.fs.params.folderPath
const testFilePath = folder + '/folder1/file_test.md'
const {getHistoryFile} = TEST_fileHistory_internals

test('getHistoryFile',  () => {
    // const exp = {"extension": "md", "filenameWithoutExt": "file_test_10-31-2023_10h20m_enter", "folder": "/_auto_tests/folder1/.history/file_test.md/", "name": "file_test_10-31-2023_10h20m_enter.md", "nature": "file", "path": "/_auto_tests/folder1/.history/file_test.md/file_test_10-31-2023_10h20m_enter.md", "realname": "file_test_10-31-2023_10h20m_enter.md"}
    const exp = {"extension": "md", "filenameWithoutExt": "file_test_10-31-2023_10h20m_enter", "folder": "/_auto_tests/folder1/.history/file_test/", "name": "file_test_10-31-2023_10h20m_enter.md", "nature": "file", "path": "/_auto_tests/folder1/.history/file_test/file_test_10-31-2023_10h20m_enter.md", "realname": "file_test_10-31-2023_10h20m_enter.md"}
    expect(
        getHistoryFile(testFilePath, getDateObj("10/31/2023 10:20"), "enter")
    ).toStrictEqual(exp);
    // ).toStrictEqual(1);
})

test('createFileHistoryVersion: create a file history version', async () => {
    await testHelpers.fs.cleanFolder()

    const data:iApiDictionary["createHistoryFile"] = {
        filePath: testFilePath,
        content: '11111111111111111110000\n2311212121',
        historyFileType: 'enter',
    }

    let d = getDateObj("10/30/2023 10:20")
    let historyFile = getHistoryFile(data.filePath, d, data.historyFileType)
    
    await createFileHistoryVersion(data, d)
    // file /_auto_tests/folder1/.history/file_test.md/filename_enter_date.md should exists
    // const res = [await fileExists(historyFile.path), await openFile(historyFile.path) === data.content]
    // console.log(333, res)

    let r1 = await fileExists(historyFile.path)
    console.log(3334, r1, historyFile.path) 
 
    expect( 
        1 
    ).toStrictEqual(true)
     
  
    // clean folder
    // await testHelpers.fs.cleanFolder()
    
})
