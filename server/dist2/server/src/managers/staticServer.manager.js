"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startStaticServer = exports.startStaticServer2 = void 0;
const shared_config_1 = require("../../../shared/shared.config");
const password_manager_1 = require("./password.manager");
var http = require('http');
var fs = require('fs');
var path = require('path');
const basicAuth = require('express-basic-auth');
exports.startStaticServer2 = (rootPath) => {
    var express = require('express');
    var server = express();
    console.log(__dirname + rootPath);
    server.use(basicAuth({
        authorizer: password_manager_1.staticServerAuthLogic,
        challenge: true,
        authorizeAsync: true,
    }));
    server.use('/', express.static(rootPath));
    server.listen(shared_config_1.sharedConfig.staticServerPort);
    console.log(` ==> Static Server 2 for ${rootPath} running at http://localhost:${shared_config_1.sharedConfig.staticServerPort}/`);
};
exports.startStaticServer = (rootPath) => {
    http.createServer(function (request, response) {
        console.log('request starting...');
        var filePath = rootPath + request.url;
        // if (filePath == './')
        //     filePath = './index.html';
        var extname = path.extname(filePath);
        var contentType = 'text/html';
        console.log(333, extname);
        switch (extname) {
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.json':
                contentType = 'application/json';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.jpg':
                contentType = 'image/jpg';
                break;
            case '.wav':
                contentType = 'audio/wav';
                break;
        }
        console.log({ filePath });
        fs.readFile(filePath, function (error, content) {
            if (error) {
                if (error.code == 'ENOENT') {
                    fs.readFile('./404.html', function (error, content) {
                        response.writeHead(200, { 'Content-Type': contentType });
                        response.end(content, 'utf-8');
                    });
                }
                else {
                    response.writeHead(500);
                    response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
                    response.end();
                }
            }
            else {
                response.writeHead(200, { 'Content-Type': contentType });
                // response.setHeader('Content-disposition', 'attachment');
                response.end(content, 'utf-8');
            }
        });
    }).listen(shared_config_1.sharedConfig.staticServerPort);
    console.log(` ==> Static Server for ${rootPath} running at http://localhost:${shared_config_1.sharedConfig.staticServerPort}/`);
};
