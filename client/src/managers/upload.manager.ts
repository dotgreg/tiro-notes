import { debounce } from "lodash";
import { iSocketEventsParams, socketEvents } from "../../../shared/sockets/sockets.events";
import { socketEventsManager } from "./sockets/eventsListener.sockets";
import { clientSocket } from "./sockets/socket.manager";

export interface iUploadedFile {
    name:string
    path:string
}


var siofu = require("socketio-file-upload");
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

  export const uploadOnDrop = (el:HTMLDivElement, events: {
    onDragStart:Function
    onDragEnd:Function
  }) => {
    window.addEventListener('drop', function(ev) {
      ev.preventDefault();
      if (ev.dataTransfer && ev.dataTransfer.items) {
        // console.log(ev.dataTransfer.items[0].getAsFile()?.name);
        let files = ev.dataTransfer.items
        uploadFile(files[0].getAsFile())
        // for (var i = 0; i < ev.dataTransfer.items.length; i++) {
        //   if (ev.dataTransfer.items[i].kind === 'file') {
        //     var file = ev.dataTransfer.items[i].getAsFile();
        //     console.log('... file[' + i + '].name = ' + file?.name);
        //   }
        // }
      }
    }); 
    window.addEventListener('dragover', function(e) {
      e.preventDefault();
      dragEndDebounced()
    });
    const dragEndDebounced = debounce(() => {
      events.onDragEnd()
    }, 100)
  }