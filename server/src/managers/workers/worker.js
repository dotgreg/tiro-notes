const { Worker, isMainThread, parentPort } = require('worker_threads');
const fs = require ('fs')
const path = require ('path')



const getFolderHierarchySync = async (folder, config) => {
    return new Promise((resolve, reject) => {
        // console.log('[WORKER THREAD] getFolderHierarchySync:', folder, config);
        // console.log(222, config.blacklist);

        if (!config.blacklist) return
        var stats = fs.lstatSync(folder)
        let relativeFolder = folder.replace(config.dataFolder, '')
        let info= {
            path: relativeFolder,
            title: path.basename(folder),
            key: relativeFolder
        };
        if (stats.isDirectory()) {
            fs.readdirSync(folder).map(async (child) => {
                let childFile = folder + '/' + child
                try {
                    let stats2 = fs.lstatSync(childFile)
                    if (stats2.isDirectory() && config.blacklist.indexOf(path.basename(child)) === -1) {
                        if (!info.children) info.children = []
                        info.children.push(await getFolderHierarchySync(childFile,config))
                    } 
                } catch (error) {
                    console.log("getFolderHierarchySync => error "+ error);    
                }
            });
        } 
        resolve(info)
    })
}

parentPort.on("message",(msg)  =>{
    console.log(`[WORKER THREAD] received =>  ${msg.action}`, msg.data);
    switch (msg.action) {
        case 'getFolderHierarchySync':
                getFolderHierarchySync(msg.data.folder, msg.data.config).then((folder) => {
                    console.log(`[WORKER THREAD] getFolderHierarchySync finished`, folder);
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