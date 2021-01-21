import { sharedConfig } from "../../../shared/shared.config";
import { backConfig } from "../config.back";
import { staticServerAuthLogic, verifyPassword } from "./password.manager";

var http = require('http');
var fs = require('fs');
var path = require('path');

const basicAuth = require('express-basic-auth')


export const startStaticServer = (path:string, port:number) => {
    var express = require('express');
    var server = express();

    server.use(basicAuth({
        authorizer: staticServerAuthLogic,
        challenge: true,
        authorizeAsync: true,
    }))

    server.use('/', express.static( path));
    // server.use('/app', express.static( frontendBuildFolder));
    server.listen(port);
    console.log(` ==> Static Server for ${path} running at http://localhost:${port}/`);

}
