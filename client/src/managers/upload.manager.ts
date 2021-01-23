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

  export const uploadOnInputChange = (el:HTMLTextAreaElement) => {
    var instance = new siofu(clientSocket);
    instance.listenOnInput(el);
  }

  export const uploadOnDrop = (el:HTMLTextAreaElement, events: {
    onDragStart:Function
    onDragEnd:Function
  }) => {
    var instance = new siofu(clientSocket);
    instance.listenOnDrop(el);

    window.addEventListener('dragenter', function(e) {
        events.onDragStart()
    });
    
    el.addEventListener('dragleave', function(e) {
        events.onDragEnd()
    });
    window.addEventListener('drop', function(e) {
        events.onDragEnd()
    });
  }