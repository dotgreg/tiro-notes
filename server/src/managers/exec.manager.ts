import { log } from "./log.manager";

const execa = require('execa');


export const exec2 = async (command: string[]): Promise<any> => {
	log(`[EXEC2] ${JSON.stringify(command)}`);
	let args = [...command]
	args.shift()
	const { stdout } = await execa(command[0], args);
	return stdout
}
export const execString = async (command: string): Promise<any> => {
	// let args = [...command]
	// args.shift()
	// const {stdout} = await execa(command[0], args);
	// return stdout 
	// const {stdout} = await execa.command(command, { shell: true })
	let res = ""
	try {
		// const { stdout } = await execa.command(command, { stdio: 'inherit' })
	const {stdout} = await execa.command(command, { shell: true })
		// const { stdout } = await execa.command(command)
		res = stdout
	}
	catch (e) {
		res = e
	}
	log(`[EXEC STRING] ${JSON.stringify(command)} => output : ${res}`);
	return res
}
