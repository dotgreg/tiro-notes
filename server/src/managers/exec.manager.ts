const execa = require('execa');


export const exec2 = async (command: string[]):Promise<any> => {
    console.log(`[EXEC2] ${JSON.stringify(command)}`);
    let args = [...command]
    args.shift()
    const {stdout} = await execa(command[0], args);
    return stdout 
}