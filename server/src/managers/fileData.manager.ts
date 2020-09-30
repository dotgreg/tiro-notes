import { iFileData } from "../../../shared/types.shared";
import * as fs2 from './fs.manager';

export const getFileData = async (path:string):Promise<iFileData|void> => {
    let jsonContentRaw = await fs2.openFile(path)
    let jsonContent:iFileData = {}
    try {
        jsonContent = JSON.parse(jsonContentRaw) as iFileData
        return jsonContent
    } catch (err) {
        return console.error('[JSON] parsing pb');
    } 
}

export const upsertFileData = async (path:string, content:iFileData):Promise<void> => {
    return await fs2.saveFile(path, JSON.stringify(content))
}