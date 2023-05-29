import { iApiDictionary } from "../../../../shared/apiDictionary.type"
import { getDateObj } from "../../../../shared/helpers/date.helper"
import { createFileHistoryVersion, fileHistoryParams, TEST_fileHistory_internals } from "../fileHistory.manager"
import { fileExists, openFile } from "../fs.manager"
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

test('createFileHistoryVersion: a file history version should be created in history folder', async () => {
    await testHelpers.fs.cleanFolder()

    const data:iApiDictionary["createHistoryFile"] = {
        filePath: testFilePath,
        content: '11111111111111111110000\n2311212121',
        historyFileType: 'enter',
    }

    let d = getDateObj("10/30/2023 10:20")
    let historyFile = getHistoryFile(data.filePath, d, data.historyFileType)
    
    // file /_auto_tests/folder1/.history/file_test.md/filename_enter_date.md should exists
    await createFileHistoryVersion(data, d)

    expect( 
        await fileExists(historyFile.path)
    ).toStrictEqual(true)
    
    expect( 
        await openFile(historyFile.path)
    ).toStrictEqual(data.content)
    
})

// if we rename a file, it should also rename its history folder
// if we move a file, it should also move its history folder
// housekeeping: if last history file +1day, start housekeeping process
