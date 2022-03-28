#!/usr/bin/env node

// const isDev = false
const isDev = process.env.ISDEV
const tHelpers = isDev ? require('../shared.helpers.js') : require(`./shared.helpers.build.js`);


// CLI HELP MANUAL
const outputHelp = () => {
		var p = require('./package.json');
		const tiroHelpString = `
VERSION:
===
${p.name.toUpperCase()} v.${p.version} ${isDev ? '(**dev**)' : ''}

DESCRIPTION:
===
${p.description}

ARGS:
====

--https/-s : enable https ssl with self signed certificate (boolean, false by default)
--port/-p : port to use (number, 3023 by default)
--tunnel/-t : uses autossh to "publish" the app on the web, requires a server you can access with ssh and autossh installed on that device. (ex:npx tiro-notes@latest -t REMOTE_USER@REMOTE_URL:REMOTE_PORT)
--help/-h : help 

EXAMPLES:
====
- npx tiro-notes 
- npx tiro-notes --tunnel ubuntu@myserver.com:3023 --port 3033 --https true
- npx tiro-notes -t ubuntu@myserver.com:3023 -p 3033 -s true
`;
		console.log(tiroHelpString);	

}

// open frontend on default browser
const openInBrowser = (url) => {
    var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
    require('child_process').exec(start + ' ' + url);
}


function getCliArgs () {
		var args = process.argv;
		var argsObj = {
				port: 3023,
				https: false,
				help: false,
				tunnel: {
            enabled: false,
        },
		}
		for (var i = 0; i < args.length; i++) {
				if (i % 2 !== 0) continue
				var argName = args[i];
				var argVal = args[i+1];
				argName = argName.replace('--', '').replace('-','')
				if (argName === 'p' || argName === 'port') argsObj.port = parseInt(argVal);
				if (argName === 's' || argName === 'https') argsObj.https = true
				if (argName === 'h' || argName === 'help') argsObj.help = true
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

		// kill all possible remaining servers of tiro 
		tHelpers.killPreviousInstances(() => {

				// start tiro server, detect success message and get server params
				tHelpers.execCmd('node', [`${__dirname}/server/tiro-server.js`], {
						env: {
								TIRO_PORT: argsObj.port,
								TIRO_HTTPS: argsObj.https
						},  
						logName: 'tiroServer',
						onLog: str => {
								tHelpers.checkAndGetTiroConfig(str, {platform: 'cli', cb})
						}
				})
		});
}

const startSshTunnel = (argsObj) => {
		if (argsObj.tunnel.enabled) {
				// kill previous autossh processes
				let cb2 = true
				let cb1 = true
				tHelpers.execCmd('killall', [`autossh`], {
						logName:'tunnel 1/3',
						onLog: () => {
								if (!cb2) return
								cb2 = false
								// check if autossh is working
								tHelpers.execCmd('autossh', [`-V`], {
										logName:'tunnel 2/3',
										onLog: str => {
												if (!cb1) return
												cb1 = false
												// start autossh finally
												tHelpers.execCmd('autossh',['-M',`2${argsObj.tunnel.remotePort}`,'-N', argsObj.tunnel.remoteUrl,'-R', `${argsObj.tunnel.remotePort}:localhost:${argsObj.port}`,'-C'], {
														logName:'tunnel 3/3'
												})
										}
								})
						}
				})
		}
}

// Main script
function main () {

		var argsObj = getCliArgs();

		if (argsObj.help) {

				outputHelp();

		} else {

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
}

const test = () => {
		var argsObj = getCliArgs();
		startSshTunnel(argsObj);
}


// start everything
// isDev ? test() : main();
isDev ? main() : main();

