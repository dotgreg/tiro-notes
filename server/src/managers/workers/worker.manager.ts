type WorkerAction = 'getFolderHierarchySync'

const { Worker } = require('worker_threads');
const worker = new Worker('./src/managers/workers/worker.js');

let callback:{f:Function} = { f : () => {}}

export const triggerWorker = (action:WorkerAction, data:any, cb:Function) => {
    console.log(`[MAIN] trigger worker`,{action,data});
    
    worker.postMessage({action, data});
    callback.f = cb
}

worker.on('message', (dataFromWorker) => {  
    callback.f(dataFromWorker)
    callback.f = () => {}
});  