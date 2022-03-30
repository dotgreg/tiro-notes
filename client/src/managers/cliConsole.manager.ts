export interface iCliCmd {
	description: string,
	func: Function,
	f?: Function
}

export const consoleCli: {
	[command: string]: iCliCmd
} = {

}

export const addCliCmd = (name: string, cmd: iCliCmd) => {
	cmd.f = cmd.func
	consoleCli[name] = cmd
}

//@ts-ignore
window.tiroCli = consoleCli
