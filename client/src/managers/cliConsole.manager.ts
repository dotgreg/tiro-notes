export interface iCliCmd {
    description: string,
    func:Function
}

export const consoleCli:{
    [command:string]:iCliCmd
} = {

}

export const addCliCmd = (name:string, cmd:iCliCmd) => {
    consoleCli[name] = cmd
}

//@ts-ignore
window.tiroCli = consoleCli