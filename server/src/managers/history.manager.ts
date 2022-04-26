import { log } from "console";
import { debounce, each } from "lodash";
import { backConfig } from "../config.back";
import { moveFile, upsertRecursivelyFolders } from "./fs.manager";

const fs = require('fs');
const path = require('path');

const config = {
	delay: 1 * 60 * 60, // every hour trigger
	days: 30
}

//
// HIGH LEVEL FUNCTION
//

// only execute it every x hours using debounce
export const debounceCleanHistoryFolder = debounce(() => {
	log(`[HISTORY CLEAN] debounce Clean History Folder`);
	cleanHistoryFolder(config.days)
}, config.delay)


//
// SUPPORT FUNCTIONS
//
const cleanHistoryFolder = async (retainDays: number) => {

	const historyPathFolder = `${backConfig.dataFolder}/${backConfig.configFolder}/${backConfig.historyFolder}`
	handleOlderFiles({
		folder: historyPathFolder,
		retainDays,
		action: 'archive',
	});

}

const handleOlderFiles = async (
	p: {
		folder: string,
		retainDays: number,
		action: 'archive' | 'compress' | 'delete'
	}) => {

	// scan folder and get list of older files than retainDays
	const olderFiles = await getFilesOlderThan(p.folder, p.retainDays)
	//log(12121, olderFiles.length);

	if (p.action === 'archive') {

		const archivePathFolder = `${backConfig.dataFolder}/${backConfig.configFolder}/${backConfig.archiveFolder}`
		// make sure .archive folder exists
		upsertRecursivelyFolders(archivePathFolder)

		each(olderFiles, async oldFile => {
			await moveFile(
				oldFile.path,
				`${archivePathFolder}/${oldFile.fileName}`
			)
		})
	}
}

export type iFileToMove = { path: string, date: string, time: number, fileName: string }
export const getFilesOlderThan = (folder: string, days: number): Promise<iFileToMove[]> => {

	const folderPath = folder
	const daysInMs = days * 24 * 60 * 60 * 1000

	return new Promise((res, rej) => {
		fs.readdir(folderPath, (err, files) => {
			//log(1111, files.length, folderPath, days, daysInMs);
			const olderFiles: iFileToMove[] = []
			const toKeepFiles: iFileToMove[] = []
			let counter = 0;

			files.forEach((file) => {
				fs.stat(path.join(folderPath, file), (err, stat) => {
					counter++
					var endTime, now;
					if (err) {
						return log(`ERROR : getFilesOlderThan => ${err}`);
					}
					now = new Date().getTime();

					const ctime = new Date(stat.ctime).getTime()
					const mtime = new Date(stat.mtime).getTime()
					const oldestTime = (ctime < mtime) ? ctime : mtime

					endTime = oldestTime + daysInMs;
					const fileTime: iFileToMove = {
						path: `${folderPath}/${file}`,
						date: new Date(oldestTime).toDateString(),
						time: oldestTime,
						fileName: file,
					}
					if (now > endTime) {
						olderFiles.push(fileTime)
					} else {
						toKeepFiles.push(fileTime)
					}
					if (counter === files.length) {
						res(olderFiles);
					}
				});
			});
		});
	})
}
