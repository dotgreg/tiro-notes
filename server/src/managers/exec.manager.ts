import { sharedConfig } from "../../../shared/shared.config";
import { iCommandStreamChunk } from "../../../shared/types.shared";
import { log } from "./log.manager";

const execa = require('execa');
const shouldLog = sharedConfig.server.log.verbose

// high level exec functions
export const execString = async (command: string): Promise<any> => {
	let res = ""
	try {
		console.log("exec => " + command)
		const { stdout } = await execa.command(command, { shell: true })
		res = stdout
	}
	catch (e) {
		res = e
	}
	shouldLog && log(`[EXEC STRING] ${JSON.stringify(command)} => output : ${res}`);
	return res
}

type iOnDataExec = (r: iCommandStreamChunk) => void

let h = `[EXEC STREAM]`
export const execStringStream = async (
	command: string,
	onData: iOnDataExec
) => {

	let err = null
	const commandStream = execa.command(command, { shell: true }).catch(error => {
		err = error
	});

	if (!commandStream.stdout) return console.log(h, `ERROR with cmd ${command}`, err)

	shouldLog && log(h,` ${JSON.stringify(command)}`);
	let index = 0
	let textTot = ""

	const processData = (isLast:boolean, isError:boolean) => async rawChunk => {
		let text = rawChunk.toString()
		if (text === "false" && isLast) text = ""
		textTot += text
		onData({ text, textTot, index, isLast, isError })
		index++
	}

	commandStream.stderr.on('data', processData(false, true))
	commandStream.stderr.on('close', processData(true, true))

	commandStream.stdout.on('data',  processData(false, false))
	commandStream.stdout.on('close', processData(true, false))
}

// low level exec functions
// for error catching
h = `[EXEC execaWrapper]`
export const execaWrapper = (cmdPath:any, args:any):any | null => {
	let streamProcess = execa(cmdPath, args)
	.catch(error => {
		console.log(h, "ERROR", {cmdPath, args}, error);
	});
	if (!streamProcess.stdout) return null
	return streamProcess
}