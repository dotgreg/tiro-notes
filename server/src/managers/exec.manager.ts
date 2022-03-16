import { log } from "./log.manager";

const execa = require('execa');


export const exec2 = async (command: string[]):Promise<any> => {
    log(`[EXEC2] ${JSON.stringify(command)}`);
    let args = [...command]
    args.shift()
    const {stdout} = await execa(command[0], args);
    return stdout 
}
export const exec3 = async (command: string):Promise<any> => {
    log(`[EXEC2] ${JSON.stringify(command)}`);
    // let args = [...command]
    // args.shift()
    // const {stdout} = await execa(command[0], args);
    // return stdout 
    execa.command(command,{shell:true})
}
