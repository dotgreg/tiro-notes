import {each} from 'lodash'
import * as fs2 from './fs.manager';

import { imageScrape } from './imageScraper.manager';
import { createDir, scanDir } from './dir.manager';
import { backConfig } from '../config.back';
import { iFile, iFileData } from '../../../shared/types.shared';
import { getFileData, upsertFileData } from './fileData.manager';


export const updateFileMetadata = async (path: string, file:iFile) => {
  console.log(`updateFileMetadata ${file.name}`);
  // await sleep(100);
  const dbDirPath = `${path}/${backConfig.dbDirName}` 

  // ASYNC if json doesnt not exists, create a new one
  let jsonPath = `${dbDirPath}/${file.name}.json`
  if (!fs2.fileExists(jsonPath)) {
    // first time, so detect fileType
    

    await upsertFileData(jsonPath, {stars: 0, tags: []})
  }
  
  // ASYNC if image doesnt exists, look for first one on google image and save
  let imgPath = `${dbDirPath}/${file.name}.jpg`
  if (!fs2.fileExists(imgPath)) {
    let imgsScraped = await imageScrape(file.name)
    if (imgsScraped.length > 1) {
      await fs2.downloadFile(imgsScraped[0],imgPath)
    } else {
      // if no result, save default pic
      await fs2.copyFile(backConfig.defaultImage, imgPath)
    }
  }
}




let isProcessingMetadataUpdate:boolean = false
export const mediaScan = async (path:string):Promise<iFile[]> => {
    // scan folder
    let files:iFile[];
    try {files = await scanDir(path) as iFile[] }
    catch (e) { console.error(e);  }
  
    if (!files) {console.log(`[mediascan] no files, return nothing ${path}`); return []; };
    
    
    // create a .db_dir if not existing
    const dbDirPath = `${path}/${backConfig.dbDirName}` 
    await createDir(dbDirPath) 
  
    // after 1s, for each file
    
    setTimeout(async () => {
      if (isProcessingMetadataUpdate) return console.warn('Already processing isProcessingMetadataUpdate, doing nothing')
      isProcessingMetadataUpdate = true
      for (let i = 0; i < files.length; i++) {
        await updateFileMetadata(path, files[i]) 

        console.log(files.length, i + 1);
        
        if (files.length === i + 1) {
          isProcessingMetadataUpdate = false
          console.log('isProcessingMetadataUpdate FINISHED');
          
        }
      }
    }, 1000)
    
    // return list of files
    return files
  
  }

