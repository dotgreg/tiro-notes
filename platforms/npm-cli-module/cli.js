#!/usr/bin/env node

function execCmd (cmd, params, p) {
		console.log(`ExecCMD ${JSON.stringify({cmd, params, p})}`);
		if (!p) p = {}
		if (!p.env) p.env = {}
		if (!p.onLog) p.onLog = () => {}

		var spawn = require( 'child_process' ).spawn;
		var child = spawn( cmd, params, {env: { ...process.env, ...p.env }});  

		child.stdout.on( 'data', data => {
				var str = `[${cmd}] : ${data}`;
				console.log( str );
		});
		child.stderr.on( 'data', data => {
				var str = `[${cmd} ERROR!] : ${data}`;
				console.log( str );
		});
		return child;
}

function getCliArgs () {
		var args = process.argv;
		var argsObj = {
				port: 3023
		}
		for (var i = 0; i < args.length; i++) {
				if (i % 2 !== 0) continue
				console.log(i);
				var argName = args[i];
				var argVal = args[i+1];
				argName = argName.replace('--', '').replace('-','')
				if (argName === 'p' || argName === 'port') argsObj.port = parseInt(argVal);
		}
		return argsObj;
}

// Main script
function startTiroServerAsCli () {
		var argsObj = getCliArgs();
		console.log(`Starting Tiro-Notes from CLI with following arguments : ${JSON.stringify(argsObj)}`);
		execCmd('node', [`${__dirname}/server/server.js`], {
				env: { TIRO_PORT: argsObj.port },  
		})
}

startTiroServerAsCli();
