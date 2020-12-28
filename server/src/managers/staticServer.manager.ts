import { sharedConfig } from "../../../shared/shared.config";
import { backConfig } from "../config.back";
import { staticServerAuthLogic, verifyPassword } from "./password.manager";

var http = require('http');
var fs = require('fs');
var path = require('path');

const basicAuth = require('express-basic-auth')


export const startStaticServer2 = (rootPath:string) => {
    var express = require('express');
    var server = express();
    console.log(__dirname + rootPath);
    

    server.use(basicAuth({
        authorizer: staticServerAuthLogic,
        challenge: true,
        authorizeAsync: true,
        // users: { 'admin': 'supersecret' }
    }))
    

    server.use('/', express.static( rootPath));
    server.listen(sharedConfig.staticServerPort);
    console.log(` ==> Static Server 2 for ${rootPath} running at http://localhost:${sharedConfig.staticServerPort}/`);

}

export const startStaticServer = (rootPath:string) => {
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

        console.log({filePath});
        
    
        fs.readFile(filePath, function(error, content) {
            if (error) {
                if(error.code == 'ENOENT'){
                    fs.readFile('./404.html', function(error, content) {
                        response.writeHead(200, { 'Content-Type': contentType });
                        response.end(content, 'utf-8');
                    });
                }
                else {
                    response.writeHead(500);
                    response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                    response.end(); 
                }
            }
            else {
                response.writeHead(200, { 'Content-Type': contentType });
                // response.setHeader('Content-disposition', 'attachment');

                response.end(content, 'utf-8');
            }
        });
    
    }).listen(sharedConfig.staticServerPort);
    console.log(` ==> Static Server for ${rootPath} running at http://localhost:${sharedConfig.staticServerPort}/`);
}