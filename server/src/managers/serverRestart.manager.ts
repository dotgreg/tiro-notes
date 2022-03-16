import { log } from "./log.manager";

export const restartTiroServer = () => {
    const cmdArgsHist = [...process.argv]
    const cmd = cmdArgsHist.shift()
    const args = cmdArgsHist
    log("[RESTARTING SERVER] : with pid " + process.pid + `trying to restart after w cli: ${cmd} ${args}`);
    setTimeout(function () {
        process.on("exit", function () {
            require("child_process").spawn(cmd, args, {
                cwd: process.cwd(),
                detached : true,
                stdio: "inherit"
            });
        });
        process.exit();
    }, 1000);
}
