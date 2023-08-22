import { backConfig } from "../config.back";
import { upsertRecursivelyFolders, fileExists } from "./fs.manager";
import { isEnvDev, p } from "./path.manager";

const { readFile } = require('node:fs/promises');
const { WASI } = require('wasi');
const { argv, env } = require('node:process');
const { join } = require('node:path');

const cacheWasmFolder = `${backConfig.dataFolder}/${backConfig.configFolder}/${backConfig.cacheFolder}/wasm`
const h = `[WEBASSEMBLY]`
// HTTPS : normally we are under server/src/managers but on prod, it is simply server/server.js
const wasmFolderPath = isEnvDev() ? '../../' : './'

export const wasmWasiRun = async (p2:{
    wasmName: string,
    folderWasiPath: string,
    cb: (res:any) => void
}) => {
    p2.folderWasiPath = p(p2.folderWasiPath)

    if (!fileExists(cacheWasmFolder)) await upsertRecursivelyFolders(cacheWasmFolder)
    console.log(h, "wasmWasiRun >", p2)

    const wasi = new WASI({
        version: 'preview1',
        args: argv,
        env,
        preopens: {
            '/f': p2.folderWasiPath, 
            '/app': cacheWasmFolder,
        },
    });

    const wasm = await WebAssembly.compile(
        await readFile(join(__dirname, `${wasmFolderPath}wasm/bin/${p2.wasmName}.wasm`)),
    );
    const instance = await WebAssembly.instantiate(wasm, { wasi_snapshot_preview1: wasi.wasiImport } );
    wasi.start(instance);
    let data = await readFile(p(`${cacheWasmFolder}/${p2.wasmName}.log`), 'utf8')
    
    // return data
    p2.cb(data)
}