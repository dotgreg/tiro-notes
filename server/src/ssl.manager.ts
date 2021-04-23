import { isEnvDev } from "./managers/path.manager";

const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
var express = require('express');
    

// HTTPS : normally we are under server/src/managers but on prod, it is simply server/server.js
const sslPath = isEnvDev() ? '../' : './'

export const sslConfig = { 
    key: fs.readFileSync(path.resolve(__dirname,`${sslPath}ssl/server.key`)),
    cert: fs.readFileSync(path.resolve(__dirname,`${sslPath}ssl/server.cert`)),
};

export const createSecureServer = (port:number, cb?:Function, label?:string):{secureServer:any, expressApp:any} => {
    var expressApp = express();

    let secureServer
    secureServer = https.createServer(sslConfig, expressApp).listen(port, () => {
        console.log(`[SECURE SERVER] create at port ${port} with label ${label}`);
        cb && cb()
    })
    return {secureServer, expressApp};
}