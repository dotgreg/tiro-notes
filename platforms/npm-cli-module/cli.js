#!/usr/bin/env node

// const isDev = false
const isDev = process.env.ISDEV
const tHelpers = isDev ? require('../shared.helpers.js') : require(`./shared.helpers.build.js`);
const pathServerJs = isDev ? `${__dirname}/node-build/server/tiro-server.js` : `${__dirname}/server/tiro-server.js`


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
--no-open/-no : do not open Tiro in browser when starting
--verbose/-v : control logs verbosity [0/1/2/3] (0:none, 1: critical, 2: all, 3: performance monitoring)

--tunnel/-t : [require autossh] uses autossh to "publish" the app on the web, requires a server you can access with ssh and autossh installed on that device. (ex:npx tiro-notes@latest -t REMOTE_USER@REMOTE_URL:REMOTE_PORT)

--backup/-b : [require tar] will incrementally backup changes in archives like tiro.0.xz.tar, tiro.1.xz.tar... every day in a specific folder. You can then execute commands after that process in a post backup script (useful for syncing these archives to clouds, think rsync, rclone etc.) 
--backup-folder : modify backup folder destination. (default: "your/path/to/tiro/data_folder"+_backup
--backup-post-script : modify script to be executed after a backup finishes. Should be a ".txt" file with your OS commands. (default: "your/path/to/tiro/data_folder"+_backup/post_backup_script.txt

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
				open: true,
				verbose: false,
				backup: {
						enabled: false,
						location: "default", 
						scriptLocation: "default"
				},
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
				if (argName === 'no-open' || argName === 'no') argsObj.open = false
				if (argName === 'v' || argName === 'verbose') argsObj.verbose = parseInt(argVal)

				if (argName === 'b' || argName === 'backup') argsObj.backup.enabled = true
				if (argName === 'backup-location') argsObj.backup.location = argVal
				if (argName === 'backup-post-script') argsObj.backup.scriptLocation = argVal 

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















//////////////////////////////////////////////////////////////////////////////////////////////////
// TIRO MAIN SERVER LOGIC
//
function startTiroServer (argsObj, cb) {
		console.log(`Starting Tiro-Notes from CLI with following arguments : ${JSON.stringify(argsObj)}`);

		// kill all possible remaining servers of tiro 
		tHelpers.killPreviousInstances(() => {

				// start tiro server, detect success message and get server params
				tHelpers.execCmd('node', ["--experimental-wasi-unstable-preview1",pathServerJs], {
						logLevel: argsObj.verbose,
						env: {
								TIRO_PORT: argsObj.port,
								TIRO_HTTPS: argsObj.https,
								TIRO_PERFORMANCE_MONITORING_BACKEND: argsObj.verbose === 3
						},  
						logName: 'tiroServer',
						onLog: str => {
								// we get params like dataFolder from server.js directly
								tHelpers.checkAndGetTiroConfig(str, {platform: 'cli', cb})
						}
				})
		});
}














//////////////////////////////////////////////////////////////////////////////////////////////////
// BACKUP LOGIC
//
const startBackupScript = async (argsObj, dataFolder) => {
		if (!argsObj.backup.enabled) return;
		if (!dataFolder) return console.warn ("[BACKUP] no dataFolder detected!");

		// get BACKUP_FOLDER path
		const defaultBackupFolder = dataFolder + "_backup/"
		const backupFolder = argsObj.backup.location !== "default" ? argsObj.backup.location : defaultBackupFolder
		// if does not exists, create it
		if (!tHelpers.fileExists(backupFolder)) await tHelpers.createDir(backupFolder)
		

		// get POST_BACKUP_SCRIPT
		const defaultPostBackupScript = backupFolder + "post_backup_script.txt"
		const postBackupScriptFile = argsObj.backup.scriptLocation !== "default" ? argsObj.backup.scriptLocation : defaultPostBackupScript 
		// if does not exists, create it, empty
		if (!tHelpers.fileExists(postBackupScriptFile)) await tHelpers.saveFile(postBackupScriptFile, "")
		let postBackupScript = await tHelpers.openFile(postBackupScriptFile) 
		if (postBackupScript) postBackupScript += ";"


		// get LAST_BACKUP_TIMESTAMP
		const timestampFile = backupFolder + "last_backup_timestamp.txt"
		const now = () => new Date().getTime()
		// if does not exists, create it, then give a timestamp of 0
		if (!tHelpers.fileExists(timestampFile)) await tHelpers.saveFile(timestampFile, "0")
		const getLastTimestamp = async () => {
				let lastBackupTimestampRaw = await tHelpers.openFile(timestampFile);		
				let lastBackupTimestamp = parseInt(lastBackupTimestampRaw) 
				return lastBackupTimestamp
		}
		let replaceTimestampCli = () => `echo ${now()} > '${timestampFile}'`
		
		// START INTERVAL
		const timeInterval = 1000 * 60 * 60 // one hour
		const backupInterval = 1000 * 60 * 60 * 24 // one day

		const tarExec = process.platform === "darwin" ? "gtar" : "tar"


		console.log ("[BACKUP] starting backup logic!");

		const debugBackupNow = isDev ? false : false
		const processBackupEveryDay = async () => {
				// if > 1 day
				const lastTimestamp = await getLastTimestamp()
				const diff = backupInterval + lastTimestamp - new Date().getTime()
				const diffMin = Math.round(diff / (1000 * 60))
				if (diff < 0 || debugBackupNow) {
						console.log(`[BACKUP] time has come, BACKUP!`);

						let backupCli = `${replaceTimestampCli()}; mkdir '${backupFolder}'; mkdir '${backupFolder}/backups'; cd '${backupFolder}'; echo '[${new Date().toLocaleString()}] -> new backup started' >> backups.txt; ${tarExec} --xz --verbose --create --file="backups/tiro.$(ls backups/ | wc -l | sed 's/^ *//;s/ *$//').tar.xz" '${dataFolder}' --listed-incremental='${backupFolder}metadata.snar'; ${postBackupScript}` 
						// append to backup CLI current timestamp to last_backup_timestamp
						// execute cli
						tHelpers.execCmdInFile(backupCli, backupFolder+"cli.sh", {
							logLevel: argsObj.verbose
						})

						const debugObj = {backupFolder, postBackupScriptFile, lastTimestamp, postBackupScript, timeInterval, backupCli}

						console.log (debugObj);
				} else {
						console.log(`[BACKUP] time has no come... still waiting for ${diffMin} mins`);
				}
		}

		// every hour
		processBackupEveryDay();
		let int = setInterval(() => {
				processBackupEveryDay()
		}, timeInterval)

}





//////////////////////////////////////////////////////////////////////////////////////////////////
// SSH LOGIC
//
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


















//////////////////////////////////////////////////////////////////////////////////////////////////
// MAIN LOGIC
//
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
						const dataFolder = c.dataFolder

						// open in browser
						if (argsObj.open) openInBrowser(`${protocol}://localhost:${port}`);

						// start tunnel with autossh if asked
						startSshTunnel(argsObj);

						// start backup script
						startBackupScript(argsObj, dataFolder);
						
				})
		}
}

const test = () => {
		var argsObj = getCliArgs();
		// startBackupScript(argsObj, "/Users/gregoirethiebault/Desktop/your markdown notes")
		startBackupScript(argsObj, "/Users/gregoirethiebault/Desktop/nodal_ex")
}


// start everything
// isDev ? test() : main();
isDev ? main() : main();

