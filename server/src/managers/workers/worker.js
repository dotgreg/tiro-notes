const { Worker, isMainThread, parentPort } = require('worker_threads');
const fs = require ('fs')
const path = require ('path')
import {getFolderHierarchySync} from '../dir.manager'


parentPort.on("message",(msg)  =>{
    // parentPort.postMessage(`[WORKER] received =>  ${msg.action}`);
    switch (msg.action) {
        case 'getFolderHierarchySync':
                getFolderHierarchySync(msg.data.folder).then((folder) => {
                    parentPort.postMessage(folder);
                })
            break;
        default:
    }
})

// (async () => {
//     getFolderHierarchySync('../../data').then((res) => {
//         // console.log(res);
//         parentPort.postMessage(res);
//         parentPort.postMessage('wohooo');
//     })
// })()