import fs from 'fs';

export const scanFolderAsStream = (folderScanned:string, breakIfFound:boolean, blacklist:string[] = []) => {
    const items = fs.readdirSync(folderScanned, { withFileTypes: true });
    let res:string[] = []
    for (const dirent of items) {
        const item = {
            name: dirent.name,
            isDirectory: dirent.isDirectory(),
        };
    
        if (item.isDirectory) {
            if (blacklist.indexOf(dirent.name) === -1) {
                res.push(item.name)
                if (breakIfFound) break; // Stop the loop when a directory is found
            }
        } 
    }  
    return res
};