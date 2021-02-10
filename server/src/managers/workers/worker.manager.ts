type WorkerAction = 'getFolderHierarchySync'

var path = require('path')
const { Worker } = require('worker_threads');
const worker = new Worker(path.join(__dirname,'/worker.js'));

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