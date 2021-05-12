import { debounce } from "lodash";
import { clientSocket, clientSocket2 } from "./sockets/socket.manager";

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
    // @TODO multiple files handling
    for (let i = 0; i < files.length; i++) {
      // const element = files[i];
      uploadFile(files[i].getAsFile())
    }
    // console.log('uploadfile');
    // uploadFile(files[0].getAsFile())
  }
}


// const test = document.getElementById("image-file") as HTMLInputElement
// const filetest.files?[0]


export const listenOnUploadSuccess = (cb:(file:iUploadedFile) => void):number => {
  return clientSocket2.on('getUploadedFile', data => {  cb(data) })
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