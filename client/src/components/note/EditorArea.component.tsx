import { debounce, throttle } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { iFile } from '../../../../shared/types.shared';
import { deviceType } from '../../managers/device.manager';
import { MonacoEditorWrapper } from '../MonacoEditor.Component';
import { useFileContent } from './noteFile.hook';
import {NoteTitleInput, PathModifFn} from './TitleEditor.component'

export type onSavingHistoryFileFn = (filepath:string, content:string, historyFileType: string) => void
export type onFileEditedFn  =(filepath:string, content:string) => void

export const EditorArea = (p:{
    editorEnabled: boolean,
    file:iFile, 
    posY:number, 
    fileContent:string

    onFilePathEdited: PathModifFn
    onSavingHistoryFile: onSavingHistoryFileFn
    onFileEdited: onFileEditedFn
}) => {

    const [vimMode, setVimMode] = useState(false)
    let monacoEditorComp = useRef<MonacoEditorWrapper>(null)


    //
    // FILE CONTENT UPDATE
    //
    const [fileContent, setFileContent] = useState('')
    useEffect(() => {
      setFileContent(p.fileContent)
    }, [p.fileContent])


    //
    // CONTENT SAVE
    //
    const triggerContentSaveLogic = (newContent:string) => {
      setFileContent(newContent)
      // this.setState({fileContent: newContent, shouldSaveOnLeave: true})
      
      if (!shouldSaveOnLeave && !this.noHistoryBackup) {
        console.log('[EDITOR] ON NEW DOCUMENT EDITION');
        p.onSavingHistoryFile(p.file.path, newContent, 'enter')
      }
      
      throttledOnFileEdited(p.file.path, newContent)
      debouncedOnFileEdited(p.file.path, newContent)
    }

    const [stopDelayedFileSave, setStopDelayedFileSave] = useState(false)
    const throttledOnFileEdited = throttle((filePath:string, content:string) => {
      if (stopDelayedFileSave) return
      p.onFileEdited(filePath, content)
    }, 1000)
    
    const debouncedOnFileEdited = debounce((filePath:string, content:string) => {
      if (stopDelayedFileSave) return
      p.onFileEdited(filePath, content)
    }, 1000)

    //
    // CONTENT SAVE ON LEAVE
    //
    const [shouldSaveOnLeave, setShouldSaveOnLeave] = useState(false)
    




    //
    // MOBILE EDITOR LOGIC
    //
    


    return (
        <div className={`editor-area ${p.editorEnabled ? 'active' : 'inactive'}`}>
                <NoteTitleInput 
                    path={p.file.path}
                    onEdited={p.onFilePathEdited}
                />

              {
                deviceType() === 'desktop' && 
                <MonacoEditorWrapper
                  value={p.fileContent}
                  vimMode={vimMode}
                  ref={monacoEditorComp}
                  onChange={triggerContentSaveLogic}
                  posY={p.posY}
                  insertUnderCaret={p.insertUnderCaret}
                />
              }
              {
                deviceType() !== 'desktop' && 
                <textarea
                  className='textarea-editor'
                  ref={this.textareaMobile}
                  value={this.state.fileContent}
                  onScroll={this.onTextareaScroll}
                  onChange={this.onTextareaChange}
                />
              }
        </div>
    )
}