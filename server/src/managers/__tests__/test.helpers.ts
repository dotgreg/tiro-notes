import * as fsApi from "../fs.manager"
const h = `[TEST HELPERS]`
const testFolderPath = `/_auto_tests`

const cleanFolder = async () => {
    console.log(`${h} cleanFolder ${testFolderPath}`)
    await fsApi.deleteFolder(testFolderPath)
}

const testHelperFs = {
    params: {
        folderPath: testFolderPath
    },
    cleanFolder
}

export const testHelpers = {
    fs: testHelperFs
}