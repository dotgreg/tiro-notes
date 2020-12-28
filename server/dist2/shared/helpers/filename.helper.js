"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileInfos = void 0;
exports.getFileInfos = (path) => {
    let pathArr1 = path.split('/');
    let pathArr2 = path.split('\\');
    let pathArr = pathArr1.length > pathArr2.length ? pathArr1 : pathArr2;
    let filename = pathArr[pathArr.length - 1];
    let extensionArr = filename.split('.');
    let folder = path.replace(filename, '');
    let extension = '';
    if (extensionArr.length > 1)
        extension = extensionArr[extensionArr.length - 1];
    return { filename, extension, path, folder };
};
