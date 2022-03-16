const { app, BrowserWindow } = require('electron')
const envs = {
		os: process.platform,
		archi: process.arch,
}

let tiroServerProcess

// CREATING A SIMPLE VIEW REDIRECTING TO IFRAME
const createWindow = () => {
		log(`[ELECTRON] createWindow`);
		const win = new BrowserWindow({
				width: 1200,
				height: 800,
				icon: __dirname + "../node-build/client/appicons/png/256x256.png"
		})
		win.loadURL("http://localhost:3023");
		
		// Sending it a param object
		win.webContents.executeJavaScript("window.tiroElectronObj = {port:3023}")

		//win.webContents.openDevTools()
		win.on('close', () => { 
				if (tiroServerProcess) {
						log(`[ELECTRON] killing tiro server process`);
						tiroServerProcess.stdin.pause()
						tiroServerProcess.kill()
				}
    });
}


app.whenReady().then(() => {
		cleanLog();
		log(`[ELECTRON] ============ starting app : onReady event done`);
		startTiroServer(() => {
				log(`[ELECTRON] starttiroserver callback`);
				createWindow();
		});
})

// starting the server with the determined path of RG binary
const startTiroServer = (cb) => {
		let hasStarted = false
		const rgPath = getRgPath();
		log({rgPath});
		tiroServerProcess = execCmd('node', ['./node-build/server/server.js'], {
				env: {TIRO_RG_PATH: rgPath},
				onLog : (str) => {
						if ( !hasStarted) {
								if (str.includes('SERVER_LOAD_SUCCESS')) {
										hasStarted = true;
										if (cb) cb();
								}

						}
				}
		});
};

/*
 * SUPPORT FUNCTIONS
 */
const getRgPath = () => {
		let binPath = `rg`;

		let filename = 'rg'
		const appRootDir = require('app-root-dir').get();
		if (envs.os === 'win32') filename = `rg.exe`
		if (envs.os === 'darwin' && envs.archi === 'arm64') filename = `rg-darwin-arm.jpeg`
		if (envs.os === 'darwin' && envs.archi === 'x64') filename = `rg-darwin-x64`

		binPath = `${appRootDir}/bin/${filename}`;

		log(`[ELECTRON] rg_path is ${binPath}`);
		return binPath
}


const { exec } = require('child_process');
const execCmd = (cmd, params, p) => {
		const spawn = require( 'child_process' ).spawn;
		try {
				const child = spawn( cmd, params, {env: { ...process.env, ...p.env }});  
				child.stdout.on( 'data', data => {
						const str = `[${cmd}] : ${data}`;
						console.log( str );
						if (p && p.onLog) p.onLog(str)
				});
				child.stderr.on( 'data', data => {
						const str = `[${cmd} ERROR!] : ${data}`;
						log( str );
				});
				return child;
		} catch (e) {
				log(`[${cmd} ERROR JS!] : ${e}`);
		}
}


const homedir = require('os').homedir();
const electronLogFile = `${homedir}/.tiro-electron-log.txt` 
const fs = require('fs')
const cleanLog = () => {
		fs.writeFile(electronLogFile, '', err => {})
}
const log = (content) => {
		content = `${new Date().getTime()} => ${content} \n\r`
		console.log(content);
		fs.appendFile(electronLogFile, content, err => {})
}
