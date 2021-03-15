import { debounce } from "lodash";
import { iSocketEventsParams, socketEvents } from "../../../shared/sockets/sockets.events";
import { socketEventsManager } from "./sockets/eventsListener.sockets";
import { clientSocket } from "./sockets/socket.manager";

export interface iUploadedFile {
    name:string
    path:string
}


var siofu = require("socketio-file-upload");

const handleDrop = (ev) => {
  ev.preventDefault();
  if (ev.dataTransfer && ev.dataTransfer.items) {
    let files = ev.dataTransfer.items
    if(!files[0]) return
    //@TODO multiple files handling
    uploadFile(files[0].getAsFile())
  }
}





export const listenOnUploadSuccess = (cb:(file:iUploadedFile) => void):number => {
  return socketEventsManager.on(socketEvents.getUploadedFile, 
    (data:iSocketEventsParams.getUploadedFile) => {  
          cb(data)
      }
    )
  }
    
  export const uploadFile = (file:any) => {
    var instanceFile = new siofu(clientSocket);
    instanceFile.submitFiles([file]);
  }

  export const uploadOnInputChange = (el:HTMLInputElement) => {
    var instance = new siofu(clientSocket);
    instance.listenOnInput(el);
  }

  export const initListenUploadOnDrop = (callbacks: {
    onDragStart:Function
    onDragEnd:Function
  }) => {

    const handleDragOver = (e) => {
      e.preventDefault();
      dragEndDebounced()
    }
    const dragEndDebounced = debounce(() => {
      callbacks.onDragEnd()
    }, 100)

    console.log(`[UPLOAD] reinit drag/drop events`);
    
    window.removeEventListener('drop', handleDrop); 
    window.addEventListener('drop', handleDrop);

    window.removeEventListener('dragover', handleDragOver);
    window.addEventListener('dragover', handleDragOver);

    
  }