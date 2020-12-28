"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileStats = exports.downloadFile = exports.fileExists = exports.removeFile = exports.copyFile = exports.saveFile = exports.moveFile = exports.upsertRecursivelyFolders = exports.openFile = exports.openMetadataFile = void 0;
const config_back_1 = require("../config.back");
const dir_manager_1 = require("./dir.manager");
var http = require('http');
var https = require('https');
var fs = require('fs');
exports.openMetadataFile = async (path) => {
    return new Promise((resolve, reject) => {
    });
};
//////////////////////////
// LOW LEVEL
//////////////////////////
exports.openFile = async (path) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                console.error(`[READFILE] Error ${err.message}`);
                reject();
            }
            else
                resolve(data);
        });
    });
};
exports.upsertRecursivelyFolders = async (fullPathToCheck) => {
    // check for each folder if it exists, else create it
    fullPathToCheck = fullPathToCheck.replace(config_back_1.backConfig.dataFolder, '');
    let pathArr = fullPathToCheck.split('/');
    pathArr.pop(); // remove object.jpg
    pathArr.shift(); // remove ""
    console.log({ pathArr });
    let createFoldersRecursively = async (path, pathArray) => {
        let fullPath = `${path}/${pathArray[0]}`;
        console.log(`createFoldersRecursively`, { path, pathArr, fullPath });
        if (!exports.fileExists(fullPath)) {
            console.log('doesnt exists create it');
            await dir_manager_1.createDir(fullPath);
        }
        if (pathArr.length > 1) {
            pathArr.shift();
            console.log('pathArr > 1, new ', { pathArr });
            await createFoldersRecursively(fullPath, pathArr);
        }
    };
    await createFoldersRecursively(config_back_1.backConfig.dataFolder, pathArr);
    return;
};
exports.moveFile = async (pathInit, pathEnd) => {
    console.log(`[MOVEFILE] starting move ${pathInit} -> ${pathEnd}`);
    return new Promise(async (resolve, reject) => {
        fs.rename(pathInit, pathEnd, (err) => {
            if (err) {
                console.error(`[MOVEFILE] Error ${err.message} (${pathInit} -> ${pathEnd})`);
                reject();
            }
            else
                resolve();
        });
    });
};
exports.saveFile = async (path, content) => {
    console.log(`[SAVEFILE] starting save ${path}`);
    return new Promise((resolve, reject) => {
        fs.writeFile(path, content, (err) => {
            if (err) {
                console.error(`[SAVEFILE] Error ${err.message} (${path})`);
                reject();
            }
            else
                resolve();
        });
    });
};
exports.copyFile = async (pathOriginal, pathDestination) => {
    return new Promise((resolve, reject) => {
        fs.copyFile(pathOriginal, pathDestination, (err) => {
            if (err) {
                console.error(`[COPYFILE] Error ${err.message}`);
                reject();
            }
            else
                resolve();
        });
    });
};
exports.removeFile = async (filepath) => {
    return new Promise((resolve, reject) => {
        fs.unlink(filepath, (err) => {
            if (err) {
                console.error(`[REMOVE FILE] Error ${err.message}`);
                reject();
            }
            else
                resolve();
        });
    });
};
exports.fileExists = (path) => {
    return fs.existsSync(path);
};
const isHttps = (url) => url.indexOf("https") === 0;
exports.downloadFile = async (url, path) => {
    console.log(`===== DL FILE ${url} ${path}`);
    if (!url)
        return;
    let client = isHttps(url) ? https : http;
    return new Promise((resolve, reject) => {
        let file = fs.createWriteStream(path);
        client.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(); // close() is async, call cb after close completes.
                console.log(`[DLFILE] downloaded ${url} to ${path}`);
                resolve(path);
            });
        }).on('error', (err) => {
            fs.unlink(path); // Delete the file async. (But we don't check the result)
            console.error(`[SAVEFILE] error  ${err.message} ({url} to ${path})$`);
            reject(err.message);
        });
    });
};
exports.getFileStats = async (path) => {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, data) => {
            if (err) {
                console.error(`[GetFileStats] Error ${err.message}`);
                reject();
            }
            else
                resolve(data);
        });
    });
};
