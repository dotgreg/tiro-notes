import { iSocketEventsParams, socketEvents } from "../../../shared/sockets/sockets.events";
import { socketEventsManager } from "./sockets/eventsListener.sockets";
import { clientSocket } from "./sockets/socket.manager";

export const insertAtCaret =  (textarea:HTMLTextAreaElement, text:string) => {
    text = text || '';
   if (textarea.selectionStart || textarea.selectionStart === 0) {
      // Others
      var startPos = textarea.selectionStart;
      var endPos = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, startPos) +
        text +
        textarea.value.substring(endPos, textarea.value.length);
      textarea.selectionStart = startPos + text.length;
      textarea.selectionEnd = startPos + text.length;
    } else {
      textarea.value += text;
    }
  };
  

  export interface iUploadedFile {
    name:string
    path:string
}
  var siofu = require("socketio-file-upload");
  export const uploadOnDrop = (el:HTMLTextAreaElement, events: {
    onUploadSuccess:(file:iUploadedFile) => void
    onDragStart:Function
    onDragEnd:Function
  }) => {
    var instance = new siofu(clientSocket);
    // console.log({instance});
    // console.log(this.zoneEl);
    // instance.listenOnInput(el);
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

    socketEventsManager.on(socketEvents.getUploadedFile, 
        (data:iSocketEventsParams.getUploadedFile) => {  
            events.onUploadSuccess(data)
        }
    )
  }