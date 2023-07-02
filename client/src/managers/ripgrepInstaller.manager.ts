import { getApi } from "../hooks/api/api.hook"
import { strings } from "./strings.manager"

export const startRipgrepInstallerProcess = () => {
    getApi(api => {
        api.popup.prompt({
            text: strings.rgNotWorking, 
            onAccept: () => {
                console.log(111)
            }, 
            onRefuse: () => {
                console.log(222)

            }, 
        })
    })
}