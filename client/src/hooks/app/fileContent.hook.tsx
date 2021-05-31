import { cloneDeepWith, filter, sortBy } from 'lodash';
import React, {  RefObject, useEffect, useRef, useState } from 'react';
import { iFile } from '../../../../shared/types.shared';
import { DualViewer, ViewType } from '../../components/dualView/DualViewer.component';
import { clientSocket, clientSocket2 } from '../../managers/sockets/socket.manager';
import { useStatMemo } from '../useStatMemo.hook';
import { getLoginToken } from './loginToken.hook';

export const useFileContent = (
  activeFile: iFile|null,
  activeFileIndex: number,
  selectedFolder:string, 
  files: iFile[],
  shouldLoadNoteIndex:any,

  cleanFileDetails: Function,
  askForMoveFile: Function,
  askForFolderFiles: Function,
) => {
    
    // STATE
    const [fileContent, setFileContent] = useState<string|null>(null)
    const [canEdit, setCanEdit] = useState(false)


    // SOCKET INTERACTIONS
    const listenerId = useRef<number>(0)
    useEffect(() => {
        console.log(`[FILE CONTENT] init socket listener`);
        listenerId.current = clientSocket2.on('getFileContent', data => {   
            if (data.filePath !== activeFile?.path) return
            setCanEdit(true)
            setFileContent(data.fileContent)
          }
        )
        return () => {
            console.log(`[FILE CONTENT] clean socket listener`);
            clientSocket2.off(listenerId.current)
        }
    }, [activeFile])

    const askForFileContent = (file:iFile) => { 
      if (file && file.name.endsWith('.md')) {
        setFileContent('loading...')
        setCanEdit(false)

        clientSocket2.emit('askForFileContent', {filePath: file.path, token: getLoginToken()} )  
      }
    } 


    // COMPONENT RENDERING
    const DualViewerComponent = (p:{
      isLeavingNote:boolean
      viewType:ViewType
      onBackButton:Function
      forceRender:boolean
    }) => 
    useStatMemo(
      <div className="note-wrapper">
        {   
          (activeFile) && 
            <DualViewer
              file={activeFile} 
              canEdit={canEdit}
              isLeavingNote={p.isLeavingNote}
              viewType={p.viewType}
              forceRender={p.forceRender}
              fileContent={fileContent ? fileContent : ''} 

              onFileEdited={(filepath, content) => {
                console.log(`[FILE CONTENT] API -> ask for file save`,{filepath, content});
                // this.askForFolderFiles(this.state.selectedFolder)
                clientSocket2.emit('saveFileContent', {filepath: filepath, newFileContent: content, token: getLoginToken()})  
              }}
              onFileTitleEdited={(initTitle, endTitle) => {
                let initPath = `${activeFile.folder}/${initTitle}.md`
                let endPath = `${activeFile.folder}/${endTitle}.md`
                console.log(`[FILE CONTENT] onFileTitleEdited =>`,{initPath, endPath});
                askForMoveFile(initPath, endPath)
                shouldLoadNoteIndex.current = 0
              }}
              onSavingHistoryFile={(filePath, content, historyFileType) => {
                console.log(`[FILE CONTENT] onSavingHistoryFile ${historyFileType} => ${filePath}`);
                clientSocket2.emit('createHistoryFile', {filePath, content, historyFileType, token: getLoginToken()})  
              }}
              onFileDelete={(filepath) => {
                console.log(`[FILE CONTENT] onFileDelete => ${filepath}`);
                
                let i = activeFileIndex  
                if (i > 0) shouldLoadNoteIndex.current = i-1   
                else if (i === 0 && files.length > 0) shouldLoadNoteIndex.current = 0
                // else if (i < files.length - 2) shouldLoadNoteIndex.current = i+1
                else cleanFileDetails()
                
                clientSocket2.emit('onFileDelete', {filepath, token: getLoginToken()}) 
                  
                askForFolderFiles(selectedFolder)
              }}
              onBackButton={p.onBackButton}
            />
        }
        { 
          !activeFile && 
            <div className='no-file'>No file</div>
        }
      </div>
    , [fileContent, activeFile,canEdit, p.isLeavingNote, p.viewType, p.forceRender])

    return {
      setFileContent,fileContent,
      setCanEdit,
      askForFileContent,
      DualViewerComponent
    }
}  



