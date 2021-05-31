import { sharedConfig } from "../../../shared/shared.config";
import { backConfig } from "../config.back";
import { createSecureServer } from "../ssl.manager";
import { staticServerAuthLogic, verifyPassword } from "./password.manager";

const fs = require('fs')
const path = require('path')
const basicAuth = require('express-basic-auth')
var express = require('express');

export const startStaticServer = (path:string, port:number, login:boolean=true) => {
    const {secureServer, expressApp} = createSecureServer(port)
    expressApp.use('/', express.static( path));
    // if (login) {
    //     expressApp.use(basicAuth({ 
    //         authorizer: staticServerAuthLogic,
    //         challenge: true,
    //         authorizeAsync: true,
    //     })) 
    // }

    console.log(` ==> Static Server for ${path} running at localhost:${port}/`);
}
