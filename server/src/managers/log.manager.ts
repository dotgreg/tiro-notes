
export const log = (message: any, obj1?: any, obj2?: any, obj3?: any) => {
	let objsStr = ''
	if (obj1) objsStr += ',' + JSON.stringify(obj1)
	if (obj2) objsStr += ',' + JSON.stringify(obj2)
	if (obj3) objsStr += ',' + JSON.stringify(obj3)
	const finalString = `${message} ${objsStr}`
	console.log(finalString);
	// fileLogWrite(finalString);
}


const fileExists = (path: string): boolean => {
	try {
		return fs.existsSync(path)
	} catch (error) {
		return false
	}
}

const userHomePath = (): string => {
	let path = '../../'
	const homedir = require('os').homedir();
	if (fileExists(homedir)) path = homedir
	return path
}

const fs = require('fs')
const logFilePath = `${userHomePath()}/.tiro-logs.txt`
const securityLogFilePath = `${userHomePath()}/.tiro-security-logs.txt`

export const fileLogClean = () => {
	fs.writeFile(logFilePath, '', err => { })
}

type iLogType = "normal" | "security"
export const fileLogWrite = (content, type:iLogType = "normal") => {
	let filePath = type === "normal" ? logFilePath : securityLogFilePath
	content = `${new Date().toJSON()} => ${content} \n\r`
	fs.appendFile(filePath, content, err => { })
}

