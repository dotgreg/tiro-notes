import React, { useRef, useState } from 'react';
import { iFile } from '../../../../shared/types.shared';
import { deviceType } from '../../managers/device.manager';
import { MonacoEditorWrapper } from '../MonacoEditor.Component';
import {  useNoteSaveLogic } from '../../hooks/noteSaveLogic.hook';
import {NoteTitleInput, PathModifFn} from './TitleEditor.component'
import { TextManipActionsHookParams, useTextManipActions } from '../../hooks/textManipActions.hook';
import { useMobileTextAreaLogic } from '../../hooks/mobileTextAreaLogic.hook';
import { useNoteEditorEvents } from '../../hooks/noteEditorEvents.hook';
import { useIntervalNoteHistory } from '../../hooks/noteHistory.hook';
import { useNoteEncryption } from '../../hooks/noteEncryption.hook';
import { ButtonToolbar, mainEditorToolbarConfig, NoteMobileToolbar } from './NoteToolbar.component';
import { textToId } from '../../managers/string.manager';
import { useEditorUploadLogic } from '../../hooks/editorUpload.hook';
import { editorToggleButtonConfig } from '../../managers/editorToggler.manager';
import { detachNoteNewWindowButtonConfig } from '../../managers/detachNote.manager';

export type onSavingHistoryFileFn = (filepath:string, content:string, historyFileType: string) => void
export type onFileEditedFn  =(filepath:string, content:string) => void
export type onFileDeleteFn  = (filepath:string) => void

const EditorAreaInternal = (p:{
    editorEnabled: boolean,
    file:iFile, 
    posY:number, 
    fileContent:string,

    onFilePathEdited: PathModifFn
    onSavingHistoryFile: onSavingHistoryFileFn
    onFileEdited: onFileEditedFn
    onFileDelete: onFileDeleteFn

    onEditorToggle: Function
}) => {

    const [vimMode, setVimMode] = useState(false)
    const [innerFileContent, setInnerFileContent] = useState('')
    let monacoEditorComp = useRef<MonacoEditorWrapper>(null)

    // LIFECYCLE EVENTS MANAGER HOOK
    const {triggerNoteEdition} = useNoteEditorEvents({
      file: p.file,
      fileContent: p.fileContent,

      onEditorDidMount: () => {
        
      },
      onEditorWillUnmount: () => {
      
      },
      onNoteContentDidLoad: () => {
        setInnerFileContent(p.fileContent)
        updateUploadFolder(p.file.folder)
        reinitUploadLogic()
      },
      onNoteEdition: (newContent, isFirstEdition) => {
        // reaction from triggerNoteEdition
        if (isFirstEdition) p.onSavingHistoryFile(p.file.path, p.fileContent /* still the old */, 'enter')
        setInnerFileContent(newContent)
        p.onFileEdited(p.file.path, newContent)
      },
      onNoteLeaving: (isEdited,oldPath) => {
        // if (isEdited) p.onFileEdited(oldPath, innerFileContent)
        ifEncryptOnLeave((encryptedText) => { p.onFileEdited(oldPath, encryptedText) })
      }
    })
    
    //  HOOK : CONTENT SAVE => REMOVED AS ITS A MESS TO USE DEBOUNCE/THROTTLE HERE :(
    // const {
    //   setStopDelayedNoteSave, throttledOnNoteEdited, debouncedOnNoteEdited} = useNoteSaveLogic({
    //     onNoteSave: (path, content) => {
    //       p.onFileEdited(path, content)
    //     }
    //   })

    // AUTOMATIC HISTORY HOOK Every 10m
    useIntervalNoteHistory(innerFileContent, {
      shouldCreateIntervalNoteHistory: () => {
        if (noHistoryBackupWhenDecrypted) return console.log('[HISTORY FILE] : noHistoryBackupWhenDecrypted')
        else {
          p.onSavingHistoryFile(p.file.path, innerFileContent, 'int')
          console.log(`[HISTORY FILE] : creating history file for ${p.file.path}`)
        }
      }
    })


    // UPLOAD LOGIC HOOK
    
    const { 
      UploadDragZone, uploadButtonConfig, reinitUploadLogic, updateUploadFolder
    } = useEditorUploadLogic({
        onUploadSuccess: ressLinkInMd => {
          insertTextAt(ressLinkInMd, 'currentPos')
        }
      })

    // MOBILE EDITOR LOGIC HOOK
    let mobileTextarea = useRef<HTMLTextAreaElement>(null)
    const {onTextareaChange, onTextareaScroll} = useMobileTextAreaLogic (innerFileContent, {
      mobileTextarea,
      onMobileNoteEdition: triggerNoteEdition
    })

    // TEXT MANIPULATION HOOK
    const {applyTextModifAction} = useTextManipActions ({
      editorType: deviceType(),
      editorRef:deviceType() !== 'desktop' ? mobileTextarea : monacoEditorComp
    })
    const insertTextAt = (textToInsert:string, insertPosition:number|'currentPos') => {
      let updatedText = applyTextModifAction('insertAt', { textToInsert, insertPosition })
      if (updatedText) triggerNoteEdition(updatedText) 
    }
    
    // ECRYPTION FUNCTIONS HOOKS
    const {APasswordPopup, askForPassword, 
      decryptButtonConfig, encryptButtonConfig,
      ifEncryptOnLeave, noHistoryBackupWhenDecrypted,
    } = useNoteEncryption ({
      fileContent:innerFileContent,
      onTextEncrypted:triggerNoteEdition,
      onTextDecrypted:triggerNoteEdition
    })

    // TOOLBAR ACTIONS
    const editorToolbarActions = [
      {
        title:'back', 
        icon:'faAngleLeft', 
        action: () => {
          window.history.back()
        }
      },
      editorToggleButtonConfig(p.onEditorToggle),
      detachNoteNewWindowButtonConfig(),
      {
        title:'insert unique id', 
        icon:'faFingerprint', 
        action: () => { 
          let id = textToId(p.file.realname)
          let idtxt = `--id-${id}`
          let idSearch = `__id_${id}`
          let folder = `${p.file.folder}`
          insertTextAt(`${idtxt}\n[search|${idSearch} ${folder}]\n`, 0)
        }
      },
      encryptButtonConfig,
      decryptButtonConfig,
      uploadButtonConfig,
      {
        title:'delete note', 
        class:'delete',
        icon:'faTrash', 
        action: () => {
          p.onFileDelete(p.file.path) 
        }
      },
    ]

                                          

    return (
        <div className={`editor-area ${p.editorEnabled ? 'active' : 'inactive'}`}>
                <UploadDragZone />

                <div className='toolbar-wrapper'>

                  {
                    deviceType() !== 'desktop' &&
                    <NoteMobileToolbar
                      onButtonClicked={action => {
                        let updatedText = applyTextModifAction(action)
                        if (updatedText) triggerNoteEdition(updatedText) 
                      }}            
                    />
                  }
                  <ButtonToolbar
                    buttons={editorToolbarActions}
                  />
                </div>

                <NoteTitleInput 
                    path={p.file.path}
                    onEdited={p.onFilePathEdited}
                />

              {
                deviceType() !== 'mobile' && 
                <MonacoEditorWrapper
                  value={innerFileContent}
                  vimMode={vimMode}
                  ref={monacoEditorComp}
                  onChange={triggerNoteEdition}
                  posY={p.posY}
                />
              }
              {
                deviceType() === 'mobile' && 
                <textarea
                  className='textarea-editor'
                  ref={mobileTextarea}
                  value={innerFileContent}
                  onScroll={onTextareaScroll}
                  onChange={onTextareaChange}
                />
              }

              {askForPassword && <APasswordPopup/>}
        </div>
    )
}

// let pass everything for the moment
export const EditorArea = React.memo(EditorAreaInternal, (props, nextProps) => {
  if(props.file.path === nextProps.file.path) {
    return false
  }
  return false
})