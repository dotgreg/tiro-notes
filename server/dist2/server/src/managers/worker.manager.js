"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startOnWorker = void 0;
const { job, start, stop } = require("microjob");
exports.startOnWorker = async (func) => {
    try {
        await start();
        let resThreaded = await job(async () => {
            let res = await func();
            console.log('threaded res', res);
            return res;
        }, { ctx: { func } });
        return resThreaded;
    }
    catch (err) {
        console.log('threaded err', err);
    }
    finally {
        await stop();
    }
};
