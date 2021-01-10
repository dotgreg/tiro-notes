const { Worker, isMainThread, parentPort } = require('worker_threads');
const fs = require ('fs')
const path = require ('path')
import {getFolderHierarchySync} from '../dir.manager'

(async () => {
    getFolderHierarchySync('../../data').then((res) => {
        // console.log(res);
        parentPort.postMessage(res);
        parentPort.postMessage('wohooo');
    })
})()