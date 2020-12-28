"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exec3 = exports.exec2 = void 0;
const execa = require('execa');
exports.exec2 = async (command) => {
    console.log(`[EXEC2] ${JSON.stringify(command)}`);
    let args = [...command];
    args.shift();
    const { stdout } = await execa(command[0], args);
    return stdout;
};
exports.exec3 = async (command) => {
    console.log(`[EXEC2] ${JSON.stringify(command)}`);
    // let args = [...command]
    // args.shift()
    // const {stdout} = await execa(command[0], args);
    // return stdout 
    execa.command(command, { shell: true });
};
