import { filter, sortBy } from 'lodash';
import React, {  useEffect, useRef, useState } from 'react';
import { iSocketEventsParams, socketEvents } from '../../../../shared/sockets/sockets.events';
import { iFile } from '../../../../shared/types.shared';
import { DualViewer } from '../../components/dualView/DualViewer.component';
import { Icon } from '../../components/Icon.component';
import { List, SortModes, SortModesLabels } from '../../components/List.component';
import { socketEventsManager } from '../../managers/sockets/eventsListener.sockets';
import { clientSocket } from '../../managers/sockets/socket.manager';
import { useLocalStorage } from '../useLocalStorage.hook';
import { useStatMemo } from '../useStatMemo.hook';

export const useFileContent = (
  activeFile: iFile|null,
) => {
    
    // STATE
    const [fileContent, setFileContent] = useState<string|null>(null)


    
    


    // SOCKET INTERACTIONS
    const listenerId = useRef<number>(0)
    useEffect(() => {
        console.log(`[FILE CONTENT] init socket listener`);
        listenerId.current = socketEventsManager.on(
          socketEvents.getFileContent, 
          (data:iSocketEventsParams.getFileContent) => {   
            if (data.filePath !== activeFile?.path) return
            // console.log({data,activeFile, fileContent});
            setFileContent(data.fileContent)
          }
        )
        return () => {
            console.log(`[FILE CONTENT] clean socket listener`);
            socketEventsManager.off(listenerId.current)
        }
    }, [activeFile])

    const askForFileContent = (file:iFile) => {
      if (file && file.name.endsWith('.md')) {
        clientSocket.emit(socketEvents.askForFileContent, 
          {filePath: file.path} as iSocketEventsParams.askForFileContent
        )  
      }
    } 


    // COMPONENT RENDERING
    const DualViewerComponent = (p:{}) => 
    useStatMemo(
      <div className="note-wrapper">
        {   
          (activeFile) && 
            <DualViewer
              file={activeFile} 
              fileContent={fileContent ? fileContent : ''} 
              onFileEdited={(filepath, content) => {
                console.log(`[APP] API -> ask for file save`,{filepath, content});
                // this.askForFolderFiles(this.state.selectedFolder)
                clientSocket.emit(socketEvents.saveFileContent, 
                  {filepath: filepath, newFileContent: content} as iSocketEventsParams.saveFileContent)  
              }}
              onFilePathEdited={(initPath, endPath) => {
                console.log(`[APP] onFilePathEdited =>`,{initPath, endPath});
                // this.emptyFileDetails()
                // this.moveFile(initPath, endPath)
                // this.setState({activeFileIndex: 0})
              }}
              onSavingHistoryFile={(filePath, content, historyFileType) => {
                console.log(`[APP] onSavingHistoryFile ${historyFileType} => ${filePath}`);
                clientSocket.emit(socketEvents.createHistoryFile, 
                  {filePath, content, historyFileType} as iSocketEventsParams.createHistoryFile)  
              }}
              onFileDelete={(filepath) => {
                console.log(`[APP] onFileDelete => ${filepath}`);
                
                // let i = this.state.activeFileIndex  
                // if (i > 0) this.loadFileDetails(i-1)    
                // else if (i < this.state.files.length - 2) this.loadFileDetails(i+1)   
                // else this.emptyFileDetails()
                
                // clientSocket.emit(socketEvents.onFileDelete, 
                //   {filepath} as iSocketEventsParams.onFileDelete) 
                  
                // this.askForFolderFiles(this.state.selectedFolder)
              }}
            />
        }
        { 
          !activeFile && 
            <div>no file selected</div>
        }
      </div>
    , [fileContent, activeFile])

    return {
      setFileContent,fileContent,
      askForFileContent,
      DualViewerComponent
    }
} 