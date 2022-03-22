// Logging
const homedir = require('os').homedir();
const electronLogFile = `${homedir}/.tiro-electron-log.txt` 
const fs = require('fs')
const cleanLog = () => {
		fs.writeFile(electronLogFile, '', err => {})
}
const writeLog = (p) => (content) => {
		content = `[ELECTRON] ${new Date().getTime()} => ${content} \n\r`
		console.log(content);
		fs.appendFile(electronLogFile, content, err => {})
}

const whichLog = (p) => p.platform === 'electron' ? writeLog : console.log


let hasStarted = false
const checkAndGetTiroConfig = (p, cb) => {
		if (!p) p = {}
		if (!p.platform) p.platform = false
		const log = whichLog(p);

		if ( !hasStarted) {
				const successMessage = 'SERVER_LOAD_SUCCESS';
				if (str.includes(successMessage)) {
						hasStarted = true;
						log(`-- ${str} --`);
						try {
								let objStr = str.match(/\{.*\}/gm);
								let configServerObj = JSON.parse(objStr)
								log(`server config loaded successfully: ${JSON.stringify(configServerObj)}`);
								if (cb) cb(configServerObj);
						} catch(e){
								log(`ERROR! could not get the server config ${JSON.stringify(e)}`)
						}

				}
		}
}

// more general exec func
const execCmd = (cmd, params, p) => {
		if (!p) p = {}
		if (!p.env) p.env = {}
		if (!p.platform) p.platform = false
		if (!p.logName) p.logName = ''
		const log = whichLog(p);

		log(`ExecCMD ${JSON.stringify({cmd, params, p})}`);

		let child 
		let spawn = require( 'child_process' ).spawn;
		child = spawn( cmd, params, {env: { ...process.env, ...p.env }});  

		// try {
		child.stdout.on( 'data', data => {
				const str = `[${p.logName} ${cmd}] : ${data}`;
				console.log( str );
				if (p && p.onLog) p.onLog(str)
		});
		child.stderr.on( 'data', data => {
				const str = `[${p.logName} ${cmd} ERROR!] : ${data}`;
				log( str );
		});
		log(`ExecCMD SUCCESS ${JSON.stringify({cmd, params, p})}`);
		return child;
}


const e = {
		checkAndGetTiroConfig,
		execCmd
}

module.exports = e;
