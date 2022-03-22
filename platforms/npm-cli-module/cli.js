#!/usr/bin/env node
//const tHelpers = require('../shared.helpers.js'); // for dev purposes
const tHelpers = require(`./shared.helpers.build.js`);

// open frontend on default browser
const openInBrowser = (url) => {
    var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
    require('child_process').exec(start + ' ' + url);
}


function getCliArgs () {
		var args = process.argv;
		var argsObj = {
				port: 3023,
				tunnel: {
            enabled: false,
        },
		}
		for (var i = 0; i < args.length; i++) {
				if (i % 2 !== 0) continue
				console.log(i);
				var argName = args[i];
				var argVal = args[i+1];
				argName = argName.replace('--', '').replace('-','')
				if (argName === 'p' || argName === 'port') argsObj.port = parseInt(argVal);
				if (argName === 't' || argName === 'tunnel') {
            const argsArr = argVal.split(':')
            if (argsArr.length > 1) {
                argsObj.tunnel.enabled = true
                argsObj.tunnel.remoteUrl = argsArr[0]
                argsObj.tunnel.remotePort = parseInt(argsArr[1])
            }
        }
		}
		return argsObj;
}

function startTiroServer (argsObj, cb) {
		console.log(`Starting Tiro-Notes from CLI with following arguments : ${JSON.stringify(argsObj)}`);

		// start tiro server, detect success message and get server params
		tHelpers.execCmd('node', [`${__dirname}/node-build/server/server.js`], {
				env: { TIRO_PORT: argsObj.port },  
				onLog: str => {
						tHelpers.checkAndGetTiroConfig({platform: 'cli'}, cb)
				}
		})
}

const startSshTunnel = (argsObj) => {
		if (argsObj.tunnel.enabled) {
				// kill previous autossh processes
				tHelpers.execCmd('killall', [`autossh`], {logName:'tunnel'})

				// check if autossh is working
				try {
						tHelpers.execCmd('autossh', [`--help`], {logName:'tunnel'})
				} catch (e) {
						throw Error('autossh not installed on the system, please install it.')
				}

				// check if autossh enabled
				tHelpers.execCmd('autossh', ['-M','20000','-f','-N',argsObj.tunnel.remoteUrl,`-R ${argsObj.tunnel.remotePort}:localhost:${argsObj.port}`,'-C'], {logName:'tunnel'})
		}
		
}

// Main script
function main () {

		var argsObj = getCliArgs();

		startTiroServer(argsObj, (configServerObj) => {

				const c = configServerObj
				const protocol = c.https ? 'https' : 'http'
				const port = c.port

				// open in browser
				openInBrowser(`${protocol}://localhost:${port}`);

				// start tunnel with autossh if asked
				startSshTunnel(argsObj);
				
		})
}

// start everything
main();

