const { Worker, isMainThread, parentPort } = require('worker_threads');
parentPort.postMessage('Hello world!');
