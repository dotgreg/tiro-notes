import { sharedConfig } from "../../../shared/shared.config";
import { iCommandStreamChunk } from "../../../shared/types.shared";
import { log } from "./log.manager";

const execa = require('execa');
const shouldLog = sharedConfig.server.log.verbose

export const exec2 = async (command: string[]): Promise<any> => {
	log(`[EXEC2] ${JSON.stringify(command)}`);
	let args = [...command]
	args.shift()
	const { stdout } = await execa(command[0], args);
	return stdout
}
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


export const execStringStream = async (
	command: string,
	onData: iOnDataExec
) => {
	const commandStream = execa.command(command, { shell: true })

	shouldLog && log(`[EXEC STRING] ${JSON.stringify(command)}`);
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
