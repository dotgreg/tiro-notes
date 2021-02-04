import React from 'react';
import styled from '@emotion/styled'
import { iFile } from '../../../../shared/types.shared';
import { debounce, throttle } from 'lodash';
import { listenOnUploadSuccess, uploadFile, uploadOnDrop, uploadOnInputChange } from '../../managers/upload.manager';
import { transformExtrawurstLinks, transformImagesInHTML, transformRessourcesInHTML, transformUrlInLinks } from '../../managers/textProcessor.manager';
import { MonacoEditorWrapper } from '../MonacoEditor.Component';
import { clientSocket } from '../../managers/sockets/socket.manager';
import { iSocketEventsParams, socketEvents } from '../../../../shared/sockets/sockets.events';
import { formatDateEditor } from '../../managers/date.manager';
import { Icon } from '../Icon.component';
import { safeString } from '../../managers/string.manager';
import { initClipboardListener } from '../../managers/clipboard.manager';
import { socketEventsManager } from '../../managers/sockets/eventsListener.sockets';
import { deviceType } from '../../managers/device.manager';
import { decryptText, encryptText } from '../../managers/encryption.manager';
import { PasswordPopup } from '../PasswordPopup.component';
import { getTextAreaLineInfos, insertAtCaret, LineTextInfos, TextModifAction, triggerTextModifAction, updateTextFromLetterInput } from '../../managers/textEditor.manager';
import {  ButtonToolbar, mainEditorToolbarConfig, NoteMobileToolbar } from './NoteToolbar.component';
const marked = require('marked');
 
export interface NoteProps {
  file:iFile
  fileContent:string
  onFileEdited: (filepath:string, content:string) => void
  onFilePathEdited: (initPath:string, endPath:string) => void
  onSavingHistoryFile: (filepath:string, content:string, historyFileType: string) => void
  onFileDelete: (filepath:string) => void
  onEditorDetached: (filepath:string) => void
}
interface State {
  editorEnabled: boolean
  fileContent: string
  dragzoneEnabled: boolean
  shouldSaveOnLeave: boolean
  filePath: string
  insertUnderCaret: string
  vimMode: boolean
  reloadEditor: boolean
  posY:number
  password:string|null
  askForPassword: string|null
  monacoEditor:MonacoEditorWrapper|null
}


export class Note extends React.Component<NoteProps, State> {

    textareaMobile:any
    dragzone:any
    uploadInput:any
    previewContentWrapper:any
    previewContent:any
    monacoEditorComp:any
    constructor(props:any) {
        super(props)
        this.state = {
          editorEnabled: true,
          fileContent: '',
          shouldSaveOnLeave: false,
          dragzoneEnabled: false,
          vimMode: false,
          filePath: '',
          insertUnderCaret: '',
          reloadEditor: false,
          posY: 0,
          askForPassword: null,
          password: null,
          monacoEditor: null
        }
        this.textareaMobile = React.createRef()
        this.dragzone = React.createRef()
        this.uploadInput = React.createRef()
        this.previewContentWrapper = React.createRef()
        this.previewContent = React.createRef()
        this.monacoEditorComp = React.createRef()

        setTimeout(() => {
          console.log(this.monacoEditorComp)
        }, 1000)
    }
    
    
    
    
    
    
    
    //
    // LIFECYCLES
    // 

    keyUploadSocketListener:number = -1
    componentDidMount() {
      console.log('[EDITOR] MOUNTED');
      this.restartAutomaticHistorySave()

      this.keyUploadSocketListener = listenOnUploadSuccess((file) => {
        let imageInMd = `![${safeString (file.name)}](${file.path})\n\n`
        this.setState({insertUnderCaret: imageInMd})

        let textAreaEl = this.textareaMobile.current
        if (textAreaEl) {
          insertAtCaret(textAreaEl, imageInMd)
          this.triggerContentSaveLogic(textAreaEl.value)
        }
      })

      initClipboardListener({
        onImagePasted: (imageBlob) => {
          uploadFile(imageBlob)
        }
      })

      uploadOnInputChange(this.uploadInput.current)
      uploadOnDrop(this.dragzone.current, {
        onDragEnd: () => {this.setState({dragzoneEnabled: false})},
        onDragStart: () => { this.setState({dragzoneEnabled: true})
          clientSocket.emit(socketEvents.uploadResourcesInfos, 
            {folderpath: this.props.file.folder} as iSocketEventsParams.uploadResourcesInfos) 
        },
      })
    }


    shouldComponentUpdate ( nextProps: any,  nextState: any, nextContext: any) { 
      if (this.props.file !== nextProps.file) {
        this.onNoteLeaveLogic()
        
        this.setState({shouldSaveOnLeave: false, password: null})

        console.log('[EDITOR] ON CHANGING DOCUMENT', nextProps.file);
        clientSocket.emit(socketEvents.uploadResourcesInfos, 
          {folderpath: this.props.file.folder} as iSocketEventsParams.uploadResourcesInfos) 
        this.restartAutomaticHistorySave()

      }
      return true
    }

    componentWillUnmount(){
      console.log(`[EDITOR] will unmount ${this.keyUploadSocketListener}`);
      this.onNoteLeaveLogic()
      socketEventsManager.off(this.keyUploadSocketListener)
    }










    //
    // FUNCTIONS
    //

    onNoteLeaveLogic = () => {
      if (this.state.shouldSaveOnLeave) {
        console.log('[EDITOR] ON LEAVING AN EDITED DOCUMENT');
        this.props.onFileEdited(this.props.file.path, this.state.fileContent)
      } else {
        console.log('[EDITOR] ON LEAVING AN UNEDITED DOCUMENT');
      }

      console.log('ON LEAVE', this.shouldEncryptOnLeave);
      
      if (this.shouldEncryptOnLeave && this.state.password) {
        let res = encryptText(this.state.fileContent, this.state.password)
        if (res.cipher) this.props.onFileEdited(this.props.file.path, res.cipher)
        this.stopDelayedFileSave = true
        setTimeout(() => {this.stopDelayedFileSave = false}, 1000)
      }

      this.shouldEncryptOnLeave = false
      this.noHistoryBackup = false
    }

    triggerContentSaveLogic = (newContent:string) => {
      this.setState({fileContent: newContent, shouldSaveOnLeave: true})
      
      if (!this.state.shouldSaveOnLeave && !this.noHistoryBackup) {
        console.log('[EDITOR] ON NEW DOCUMENT EDITION');
        this.props.onSavingHistoryFile(this.props.file.path, newContent, 'enter')
      }
      // let ct = newContent.substr(newContent.length-100, 100)
      // console.log('[EDITOR] ON triggerContentSaveLogic', {ct});
      
      this.throttledOnFileEdited(this.props.file.path, newContent)
      this.debouncedOnFileEdited(this.props.file.path, newContent)
    }

    historySaveInterval: any
    historyContent: string = ''
    restartAutomaticHistorySave = () => {
      clearInterval(this.historySaveInterval)
      let historySaveInMin = 10 
      let historySaveIntTime = historySaveInMin * 60 * 1000 
      
      this.historySaveInterval = setInterval(() => {
        if (this.noHistoryBackup) return
        if (this.state.fileContent !== this.historyContent) {
          this.historyContent = this.state.fileContent
          console.log(`[EDITOR => HISTORY SAVE CRON] : content changed, saving history version ${this.props.file.path}`);
          this.props.onSavingHistoryFile(this.props.file.path, this.state.fileContent, 'int')
        } else {
          console.log(`[EDITOR => HISTORY SAVE CRON] : content not changed, do nothing`);
        }
      }, historySaveIntTime )
    }



    stopDelayedFileSave: boolean = false
    throttledOnFileEdited = throttle((filePath:string, content:string) => {
      if (this.stopDelayedFileSave) return
      this.props.onFileEdited(filePath, content)
    }, 1000)
    
    debouncedOnFileEdited = debounce((filePath:string, content:string) => {
      if (this.stopDelayedFileSave) return
      this.props.onFileEdited(filePath, content)
    }, 1000)

    submitOnEnter = (event:any) => {
      if (event.key === 'Enter') {
        if (this.state.filePath.length < 3) return
        this.props.onFilePathEdited(this.props.file.path ,this.state.filePath)
      }
    }

    editorScrollLogic = (e:any) => {
      let direction = e.deltaY > 0 ? 1 : -1
      let delta = direction * Math.min(Math.abs(e.deltaY),40)
      let newY = this.state.posY + delta
      let previewDivWrapper = this.previewContentWrapper.current 
      let previewDiv = this.previewContent.current 
      // console.log(previewDiv.offsetHeight, previewDiv.clientHeight);
      
      let monacoHeight = this.monacoEditorComp ? this.monacoEditorComp.current.editor.getContentHeight() : 0
      let maxHeight = Math.max(previewDiv.offsetHeight, monacoHeight)
      
      if (newY > -200 && newY < maxHeight) {
        this.setState({posY: newY})
        previewDivWrapper.scrollTop = newY
      }
    }


    // 
    // ENCRYPTION FUNCTIONS
    //
    encryptContent = () => {
      if (!this.state.password) return 
      let newContent = this.state.fileContent
      let res = encryptText(newContent, this.state.password)
      if (res.status === 'failure') this.setState({password: null})
      else {
        this.shouldEncryptOnLeave = false
        let textEncrypted = res.cipher as string
        this.triggerContentSaveLogic(textEncrypted)
      }
    }

    noHistoryBackup: boolean = false
    shouldEncryptOnLeave: boolean = false
    decryptContent = () => {
      if (!this.state.password) return 
      let newContent = this.state.fileContent
      let res = decryptText(newContent, this.state.password)
      if (res.status === 'failure') {this.setState({password: null}); alert('wrong password')}
      else {
        this.noHistoryBackup = true
        this.shouldEncryptOnLeave = true
        let text = res.plaintext as string
        this.triggerContentSaveLogic(text)
      }
    }

    //
    // TEXT MANIPULATION ACTIONS 
    //
    currentCursorPos:any 
    saveCursorPos = (pos:any) => {
      this.currentCursorPos = pos
    }
    getLineTextInfos = ():LineTextInfos => {
      let res:LineTextInfos
      
      if (deviceType() === 'desktop' && this.monacoEditorComp) {
        res = this.monacoEditorComp.getCurrentLineInfos()
        this.currentCursorPos = res.monacoPosition
      } else {
        res = getTextAreaLineInfos(this.textareaMobile.current)
        this.currentCursorPos = res.currentPosition
        // this.saveYTextarea()
      }
      return res
    }
    resetCursorPosition = (decal:number) => {
      if (deviceType() === 'desktop' && this.monacoEditorComp) {
        this.monacoEditorComp.editor.setPosition(this.currentCursorPos);
      } else {
        let textarea = this.textareaMobile.current
        textarea.focus()
        setTimeout(()=>{
          textarea.selectionStart = this.currentCursorPos + decal
          textarea.selectionEnd = this.currentCursorPos + decal
          // this.resetYTextarea()
        })
      }
    }
    onTextModifAction = (action:TextModifAction) => {
      let newText = triggerTextModifAction(
        action, 
        this.getLineTextInfos(),
        charDecal => {
          this.resetCursorPosition(charDecal)
        }
      )
      this.triggerContentSaveLogic(newText)
    }
    


    //
    // MOBILE TEXT AREA LOGIC
    //
    onTextareaScroll = (e:any) => {
      if (this.isTextareaEdited) return
      // @ts-ignore
      let y = e.target.scrollTop
      this.saveYTextarea(y)
    }
    onTextareaChange = (e:any) => {
      this.isTextareaEdited = true
      this.debounceTextareaEdited()
      this.resetYTextarea()
      let updatedText = e.target.value
      let newLetter = updatedText[e.target.selectionStart-1].charCodeAt(0)
      // only react on insertion
      if (updatedText.length > this.state.fileContent.length) {
        updatedText = updateTextFromLetterInput (
          this.getLineTextInfos(),
          newLetter,
          decalChars => {
            this.resetCursorPosition(decalChars)
          }  
          )
        }
        this.triggerContentSaveLogic(updatedText); 
      }
      
      //keeping scroll position stable
      textareaY:number = 0 
      saveYTextarea = (scrollTop?:number) => {
        this.textareaY = scrollTop ? scrollTop : this.textareaMobile.current.scrollTop
      }
      resetYTextarea = () => {
        this.textareaMobile.current.scrollTop = this.textareaY
      }
      isTextareaEdited: boolean = false
      debounceTextareaEdited = debounce(() => {
        this.isTextareaEdited = false
      }, 500)
      
      
     
      
      
      
      //
      // RENDER
      //
      oldPath: string = ''
      oldContent: string = ''
      render() {
        if (this.oldPath !== this.props.file.path || this.oldContent !== this.props.fileContent) {
          this.setState({
            fileContent: this.props.fileContent,
            filePath: this.props.file.path
          })
          this.oldPath = this.props.file.path
          this.oldContent = this.props.fileContent
        
      }
      let currentFolderArr = this.props.file.path.split('/')
      currentFolderArr.pop()
      let currentFolder = currentFolderArr.join('/')
      return (
        <StyledWrapper>
            {
              //////////////////////////////////////////////////////////////////////////
              // LEFT (EDITOR)
              //////////////////////////////////////////////////////////////////////////
            }
          <div 
            className="editor"
            onWheelCapture={this.editorScrollLogic}
            >

            <div 
              className={`dragzone ${this.state.dragzoneEnabled ? '' : 'hidden'}`} 
              ref={this.dragzone} >
            </div>

            {
              /////////////////////////////
              // TOOLBARS
              /////////////////////////////
            }

            <NoteMobileToolbar
              onButtonClicked={this.onTextModifAction}            
            />

            <div className='toolbar-wrapper'>
              <ButtonToolbar
                buttons={mainEditorToolbarConfig(this)}
              />
            </div>


            {
              /////////////////////////////
              // EDITORS
              /////////////////////////////
            }
            <div className={`editor-area ${this.state.editorEnabled ? 'active' : 'inactive'}`}>
              <div className='title-input-wrapper'>
                <input 
                      type="text" 
                      value={this.state.filePath}
                      onChange={(e) => {this.setState({filePath: e.target.value})}}
                      onKeyDown={this.submitOnEnter}
                  />
              </div>
              {
                !this.state.reloadEditor && 
                deviceType() === 'desktop' && 
                <MonacoEditorWrapper
                  value={this.state.fileContent}
                  vimMode={this.state.vimMode}
                  onChange={this.triggerContentSaveLogic}
                  ref={this.monacoEditorComp}
                  posY={this.state.posY}
                  insertUnderCaret={this.state.insertUnderCaret}
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




            {
              //////////////////////////////////////////////////////////////////////////
              // RIGHT (PREVIEW)
              //////////////////////////////////////////////////////////////////////////
            }
            <div 
              className={`preview-area ${this.state.editorEnabled ? 'half' : 'full'}`} 
              ref={this.previewContentWrapper}>
              <h3>{this.props.file.name}</h3>
              <br/>
              <div className='date modified'>modified: {formatDateEditor(new Date(this.props.file.modified || 0))}</div>
              <div className='date created'>created: {formatDateEditor(new Date(this.props.file.created || 0))}</div>
              {
                
              }
              <div 
                className='preview-content'
                ref={this.previewContent}
                dangerouslySetInnerHTML={{__html:
                marked( 
                transformRessourcesInHTML(currentFolder ,
                transformImagesInHTML (currentFolder ,
                transformExtrawurstLinks (
                transformUrlInLinks ( 
                  this.state.fileContent)))))}}></div>

            </div>

           
              {
                /////////////////////////////
                // POPUPS
                /////////////////////////////
              }

              {
                this.state.askForPassword &&
                  <PasswordPopup
                    onClose={() => {this.setState({askForPassword: null})}}
                    onSubmit={(password) => {
                      let action = this.state.askForPassword
                      this.setState({password, askForPassword: null})
                      if (action === 'toEncrypt') setTimeout(()=> { this.encryptContent() },100)
                      if (action === 'toDecrypt') setTimeout(()=> { this.decryptContent() },100)
                    }}
                  ></PasswordPopup>
              }

          </div>
        </StyledWrapper>
      ); 
    }
  }
  
  const StyledWrapper  = styled.div`
    
    
  `