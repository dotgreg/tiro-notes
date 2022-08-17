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
const checkAndGetTiroConfig = (str, p) => {
		if (!p) p = {}
		if (!p.platform) p.platform = false
		if (!p.cb) p.cb = () => {}
		const log = whichLog(p);

		if ( !hasStarted) {
				const successMessage = 'SERVER_LOAD_SUCCESS';
				if (str.includes(successMessage)) {
						hasStarted = true;
						str = str.split(successMessage)[1]
						log(`*** ${str} *** (server success message detected here)`);
						try {
								let objStr = str.match(/\{.*\}/gm);
								let configServerObj = JSON.parse(objStr)
								log(`server config loaded successfully: ${JSON.stringify(configServerObj)}`);
								if (p.cb) p.cb(configServerObj);
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
		if (!p.sync) p.sync = false
		if (!p.platform) p.platform = false
		p.logName = !p.logName ? '' : `${p.logName} `
		const log = whichLog(p);

		log(`[${p.logName}] === ExecCMD ${JSON.stringify({cmd, params, p})}`);

		let child 
		let spawn = p.sync ? require( 'child_process' ).spawnSync : require( 'child_process' ).spawn;
		child = spawn( cmd, params, {env: { ...process.env, ...p.env }});  

		// try {
		child.stdout.on( 'data', data => {
				const str = `[${p.logName}(${cmd})] : ${data}`;
				if (p.showLog) console.log( str );
				if (p && p.onLog) p.onLog(str)
		});
		child.stderr.on( 'data', data => {
				const str = `[${p.logName} (${cmd}) >> ERROR!] : ${data}`;
				console.log( str );
				if (p && p.onLog) p.onLog(str)
		});
		child.on( 'close', data => {
				const str = `[${p.logName} (${cmd}) ON CLOSE] : ${data}`;
				if (p.showLog) console.log( str );
				if (p && p.onClose) p.onClose(str)
		});
		return child;
}

const execCmdInFile = async (cmdStr, filePath, p) => {
		if (!p) p = {}
		p.logName = !p.logName ? '' : `${p.logName} `

		await saveFile(filePath, cmdStr)

		execCmd(`sh`, [filePath ], {
				logName:`execCmdInFile [${p.logName}]`,
				showLog: p.showLog,
				onLog: str => {}
		})
}

const killPreviousInstances = (cb) => {
		if (!cb) cb = () => {}

		// LINUX / MAC => unix like
		const isWin = process.platform.startsWith('win');

		if (isWin) {
				cb()
		} else {
				// execCmd('sh', ['-c', "ls"], { 
				execCmd('sh', ['-c', "ps -ef | grep \'tiro-server.js\' | grep -v grep | awk \'{print $2}\' | xargs -r kill -9"], { 
						// execCmd('sh', ['-c', "kill -9 $(ps aux | grep \'tiro-server.js\' | awk '{print $2}' )"], { 

						logName: 'Kill prev tiroServer',
						onClose: () => {
								cb()
						}
				})
		}
}

// SOME BASIC FILE MANIPULATION FOR CLI BACKUP SYSTEM
const fileExists = (path) => {
		try {
				return fs.existsSync(path)
		} catch (error) {
				return false
		}
}

const openFile = async (path) => {
		return new Promise((resolve, reject) => {
				fs.readFile(path, 'utf8', (err, data) => {
						if (err) { console.log(`[READFILE] could not read ${path}`); reject('NO_FILE') }
						else resolve(data)
				});
		})
}

const saveFile = async (path, content)  => {
		console.log(`[SAVEFILE] starting save ${path}`);
		return new Promise((resolve, reject) => {
				fs.writeFile(path, content, (err) => {
						if (err) { console.log(`[SAVEFILE] Error ${err.message} (${path})`); reject() }
						else resolve()
				});
		})
}

const createDir = async (path, mask = 0o775) => {
		return new Promise((resolve, reject) => {
				fs.mkdir(path, 0o775, (err) => {
						if (err) {
								if (err.code == 'EEXIST') resolve(null); 
								else reject(err.message); 
						} else {
								resolve(null); 
						}
				});
		});
}


const e = {
		checkAndGetTiroConfig,
		killPreviousInstances,
		execCmd,
		execCmdInFile,
		fileExists,
		openFile,
		saveFile,
		createDir,
}

module.exports = e;
