import { iSockerRoute } from "./socket.manager"
import { socketEvents, iSocketEventsParams } from "../../../../shared/sockets/sockets.events";
import { backConfig } from "../../config.back";
import { mediaScan } from "../mediaScan.manager";

export const socketRoutes:iSockerRoute[] = [
    {
        event: socketEvents.askForFolder,
        action: async (socket, data:iSocketEventsParams.askForFolder) => {
            
            let params:iSocketEventsParams.getFolderFiles = {
                files: await mediaScan(backConfig.internalPath)
            }
            socket.emit(socketEvents.getFolderFiles, params)
        }
    },
    {
        event: socketEvents.disconnect,
        action: async (socket) => {
            
        }
    },
    
    // ...roomsRoutes,
]
