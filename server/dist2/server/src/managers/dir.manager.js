"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFolderHierarchyParallel = exports.getFolderHierarchySync = exports.workerGetFolderHierarchy = exports.scanDir = exports.fileNameFromFilePath = exports.isDir = exports.createDir = void 0;
const config_back_1 = require("../config.back");
const fs_manager_1 = require("./fs.manager");
var fs = require('fs');
var path = require('path');
let defaultBlacklist = ['.resources'];
exports.createDir = async (path, mask = 0o775) => {
    return new Promise((resolve, reject) => {
        fs.mkdir(path, 0o775, (err) => {
            if (err) {
                if (err.code == 'EEXIST')
                    resolve(null); // ignore the error if the folder already exists
                else
                    reject(err.message); // something else went wrong
            }
            else {
                resolve(null); // successfully created folder
            }
        });
    });
};
exports.isDir = (path) => fs.lstatSync(path).isDirectory();
exports.fileNameFromFilePath = (path) => {
    let fileName = path.split('/').join('_');
    fileName = fileName.split('\\').join('_');
    return fileName;
};
exports.scanDir = async (path, blacklist = defaultBlacklist) => {
    console.log(`[SCANDIR] path : ${path}`);
    return new Promise((resolve, reject) => {
        let filesScanned = [];
        fs.readdir(path, async (err, files) => {
            if (!files)
                return reject(err.message);
            let counterFilesStats = 0;
            for (let i = 0; i < files.length; i++) {
                const fileName = files[i];
                let filePath = `${path}/${fileName}`;
                if (!fs_manager_1.fileExists(filePath)) {
                    counterFilesStats++;
                    if (counterFilesStats === files.length)
                        resolve(filesScanned);
                }
                else {
                    fs.lstat(filePath, {}, (err, stats) => {
                        // counter++
                        let extensionArr = fileName.split('.');
                        let extension = extensionArr[extensionArr.length - 1];
                        let folder = path.replace(config_back_1.backConfig.dataFolder, '').replace('//', '/');
                        // packs everything
                        let fileObj = {
                            nature: exports.isDir(`${path}/${fileName}`) ? 'folder' : 'file',
                            name: fileName,
                            realname: fileName,
                            index: i,
                            extension,
                            folder,
                            created: Math.round(stats.birthtimeMs),
                            modified: Math.round(stats.ctimeMs),
                            path: `${folder}/${fileName}`,
                        };
                        if (blacklist.indexOf(fileName) === -1) {
                            filesScanned.push(fileObj);
                        }
                        counterFilesStats++;
                        if (counterFilesStats === files.length)
                            resolve(filesScanned);
                    });
                }
            }
        });
    });
};
const { job, start, stop } = require("microjob");
exports.workerGetFolderHierarchy = async (folder) => {
    let configDataFolder = config_back_1.backConfig.dataFolder;
    try {
        console.log(1);
        await start();
        console.log(2);
        let resThreaded = await job(async () => {
            console.log(3);
            const fs = require('fs');
            const path = require('path');
            const getFolderHierarchySync = async (folder, blacklist = defaultBlacklist) => {
                return new Promise((resolve, reject) => {
                    var stats = fs.lstatSync(folder);
                    let relativeFolder = folder.replace(configDataFolder, '');
                    let info = {
                        path: folder,
                        title: path.basename(folder),
                        key: relativeFolder
                    };
                    if (stats.isDirectory()) {
                        fs.readdirSync(folder).map(async (child) => {
                            let childFile = folder + '/' + child;
                            let stats2 = fs.lstatSync(childFile);
                            if (stats2.isDirectory() && blacklist.indexOf(path.basename(child)) === -1) {
                                if (!info.children)
                                    info.children = [];
                                info.children.push(await getFolderHierarchySync(childFile, blacklist));
                            }
                        });
                    }
                    resolve(info);
                });
            };
            console.log(4);
            let res = await getFolderHierarchySync(folder);
            return res;
        }, { ctx: { folder, defaultBlacklist, configDataFolder } });
        return resThreaded;
    }
    catch (err) {
        console.log('threaded err', err);
    }
    finally {
        await stop();
    }
};
exports.getFolderHierarchySync = async (folder, blacklist = defaultBlacklist) => {
    // console.log(`getFolderHierarchySync ${folder}`);
    return new Promise((resolve, reject) => {
        var stats = fs.lstatSync(folder);
        let relativeFolder = folder.replace(config_back_1.backConfig.dataFolder, '');
        let info = {
            path: folder,
            title: path.basename(folder),
            key: relativeFolder
        };
        if (stats.isDirectory()) {
            fs.readdirSync(folder).map(async (child) => {
                let childFile = folder + '/' + child;
                let stats2 = fs.lstatSync(childFile);
                if (stats2.isDirectory() && blacklist.indexOf(path.basename(child)) === -1) {
                    if (!info.children)
                        info.children = [];
                    info.children.push(await exports.getFolderHierarchySync(childFile, blacklist));
                }
            });
        }
        resolve(info);
    });
};
exports.getFolderHierarchyParallel = async (folder, blacklist = defaultBlacklist) => {
    // console.log('getFolderHierarchy');
    return new Promise((resolve, reject) => {
        fs.lstat(folder, (err, stats) => {
            // console.log(stats);
            let relativeFolder = folder.replace(config_back_1.backConfig.dataFolder, '');
            let info = {
                path: folder,
                title: path.basename(folder),
                key: relativeFolder
            };
            if (stats.isDirectory()) {
                fs.readdir(folder, (err, files) => {
                    let c = 0;
                    files.map(async (child) => {
                        let childFile = folder + '/' + child;
                        fs.lstat(childFile, async (err, stats2) => {
                            if (stats2.isDirectory() && blacklist.indexOf(path.basename(child)) === -1) {
                                if (!info.children)
                                    info.children = [];
                                info.children.push(await exports.getFolderHierarchyParallel(childFile, blacklist));
                            }
                            c++;
                            if (c === files.length) {
                                resolve(info);
                            }
                        });
                    });
                });
            }
        });
    });
};
