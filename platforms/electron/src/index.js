const { app, BrowserWindow, dialog } = require('electron')

const aalert = (str) => {
		const options = {
				title: 'Alert',
				message: str,
		};
		dialog.showMessageBox(null, options);
};

// const isDev = false
const isDev = process.env.ISDEV
const tHelpers = isDev ? require('../../shared.helpers.js') : require(`./shared.helpers.build.js`);


////////////////////////
// PARAMS
////////////////////////
const appRootDir = require('app-root-dir').get();
const envs = {
		os: process.platform,
		archi: process.arch,
}
let tiroServerProcess




////////////////////////
// MAIN PROCESS
////////////////////////
app.whenReady().then(() => {
		cleanLog();
		tHelpers.killPreviousInstances(() => {
				log(`============ starting app : onReady event done, envs: ${JSON.stringify(envs)}`);
				startTiroServer((configServerObj) => {
						log(`starttiroserver callback`);
						createWindow(configServerObj);
				});
		});
})

// if in https, trust self-signed certificated
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
		log('certificate error because we are in https, cancel it and force chromium to render app');
    event.preventDefault();
    callback(true);
});



////////////////////////
// RENDERER CREATION
////////////////////////
const createWindow = (configServerObj) => {
		const c = configServerObj
		const protocol = c.https ? 'https' : 'http'
		const port = c.port

		log(`createWindow ${JSON.stringify({port, protocol, c})}`);

		const win = new BrowserWindow({
				width: 1200,
				height: 800,
				icon: __dirname + "../node-build/client/appicons/png/256x256.png"
		})

		win.loadURL(`${protocol}://localhost:${port}`);
		
		// Sending it a param object, but we actually dont need it
		//win.webContents.executeJavaScript("window.tiroElectronObj = {port:3023}")

		//win.webContents.openDevTools()
		win.on('close', () => { 
				if (tiroServerProcess) {
						log(`killing tiro server process`);
						tiroServerProcess.stdin.pause()
						tiroServerProcess.kill()
				}
				tHelpers.killPreviousInstances();
    });

}


////////////////////////
// SUPPORT FUNCTIONS
////////////////////////

// starting the server with the determined path of RG binary
const startTiroServer = (cb) => {

		tHelpers.killPreviousInstances();

		let hasStarted = false
		const rgPath = getRgPath();
		tiroServerProcess = execNode(`${appRootDir}/node-build/server/tiro-server.js`, {
				env: {TIRO_RG_PATH: rgPath},
				onLog : (str) => {
						//log('onLog')
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
												const msg = `ERROR! could not get the server config ${JSON.stringify(e)}`;
												log(msg);
												aalert(msg);
										}
								}
						}
				}
		});
};

// load JSON tiro-config file to check if need https

// get RipGrep Path according to computer context
const getRgPath = () => {
		let binPath = `rg`;

		let filename = 'rg'
		if (envs.os === 'win32') filename = `rg.exe`
		if (envs.os === 'darwin' && envs.archi === 'arm64') filename = `rg-darwin-arm.jpeg` // not working yet
		if (envs.os === 'darwin' && envs.archi === 'x64') filename = `rg-darwin-x64`

		binPath = `${appRootDir}/bin/${filename}`;

		log(`rg_path is ${binPath}`);
		return binPath
}

// Exec a node process from forked nodejs process of electron
const execNode = (path, p) => {
		log(`ExecNode ${JSON.stringify({path, p})}`);
		if (!p) p = {}
		if (!p.env) p.env = {}
		if (!p.onLog) p.onLog = () => {}

		log(`ExecNode node mode, using fork then`);
		let fork = require( 'child_process' ).fork;
		//child = fork(path, [], {din:cwd: process.cwd(), env: { ...process.env, ...p.env }});  
		let child = fork(path, [], {
				stdio: 'pipe',
				env: { ...process.env, ...p.env }  
		});

		child.stdout.on( 'data', data => {
				const str = `log : ${data}`;
				console.log( str );
				if (p && p.onLog) p.onLog(str)
		});
		child.stderr.on( 'data', data => {
				const str = `err : ${data}`;
				log( str );
				aalert(str);
		});
		log(`ExecNode SUCCESS`);
		return child;
}

// Logging
const homedir = require('os').homedir();
const electronLogFile = `${homedir}/.tiro-electron-log.txt` 
const fs = require('fs')
const cleanLog = () => {
		fs.writeFile(electronLogFile, '', err => {})
}
const log = (content) => {
		content = `[ELECTRON] ${new Date().getTime()} => ${content} \n\r`
		console.log(content);
		fs.appendFile(electronLogFile, content, err => {})
}
