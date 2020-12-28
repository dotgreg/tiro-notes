import React from 'react';
import styled from '@emotion/styled'
import { iFile } from '../../../shared/types.shared';
import { debounce, throttle } from 'lodash';
import { listenOnUploadSuccess, uploadFile, uploadOnDrop, uploadOnInputChange } from '../managers/upload.manager';
import { transformExtrawurstLinks, transformImagesInHTML, transformRessourcesInHTML, transformUrlInLinks } from '../managers/textProcessor.manager';
import { MonacoEditorWrapper } from './MonacoEditor.Component';
import { clientSocket } from '../managers/sockets/socket.manager';
import { iSocketEventsParams, socketEvents } from '../../../shared/sockets/sockets.events';
import { formatDateEditor } from '../managers/date.manager';
import { Icon } from './Icon.component';
import { textToId } from '../managers/string.manager';
import { initClipboardListener } from '../managers/clipboard.manager';
import { socketEventsManager } from '../managers/sockets/eventsListener.sockets';
import { deviceType } from '../managers/device.manager';
const marked = require('marked');

interface Props {
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
  
}


export class Editor extends React.Component<Props, State> {

    textarea:any
    dragzone:any
    uploadInput:any
    previewContentWrapper:any
    previewContent:any
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
          posY: 0
        }
        this.textarea = React.createRef()
        this.dragzone = React.createRef()
        this.uploadInput = React.createRef()
        this.previewContentWrapper = React.createRef()
        this.previewContent = React.createRef()
    }

    keyUploadSocketListener:number = -1
    componentDidMount() {
      console.log('[EDITOR] MOUNTED');
      
      this.restartAutomaticHistorySave()
      
      this.keyUploadSocketListener = listenOnUploadSuccess((file) => {
        let imageInMd = `![${file.name}](${file.path})\n\n`
        this.setState({insertUnderCaret: imageInMd})
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

    componentWillUnmount(){
      console.log(`[EDITOR] will unmount ${this.keyUploadSocketListener}`);
      socketEventsManager.off(this.keyUploadSocketListener)
    }
    

    triggerContentSaveLogic = (newContent:string) => {
      if (!this.state.shouldSaveOnLeave) {
        console.log('[EDITOR] ON NEW DOCUMENT EDITION');
        this.props.onSavingHistoryFile(this.props.file.path, newContent, 'enter')
      }
      let ct = newContent.substr(newContent.length-100, 100)
      console.log('[EDITOR] ON triggerContentSaveLogic', {ct});
      
      this.setState({fileContent: newContent, shouldSaveOnLeave: true})
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
        if (this.state.fileContent !== this.historyContent) {
          this.historyContent = this.state.fileContent
          console.log(`[EDITOR => HISTORY SAVE CRON] : content changed, saving history version ${this.props.file.path}`);
          this.props.onSavingHistoryFile(this.props.file.path, this.state.fileContent, 'int')
        } else {
          console.log(`[EDITOR => HISTORY SAVE CRON] : content not changed, do nothing`);
        }
      }, historySaveIntTime )
    }

    throttledOnFileEdited = throttle((filePath:string, content:string) => {
      this.props.onFileEdited(filePath, content)
    }, 1000)

    debouncedOnFileEdited = debounce((filePath:string, content:string) => {
      this.props.onFileEdited(filePath, content)
    }, 1000)
    
    
    shouldComponentUpdate ( nextProps: any,  nextState: any, nextContext: any) { 
      if (this.props.file !== nextProps.file) {
        if (this.state.shouldSaveOnLeave) {
          console.log('[EDITOR] ON LEAVING AN EDITED DOCUMENT');
          
          this.props.onFileEdited(this.props.file.path, this.state.fileContent)
          
          this.setState({shouldSaveOnLeave: false})
        } else {
          console.log('[EDITOR] ON LEAVING AN UNEDITED DOCUMENT');
        }

        console.log('[EDITOR] ON CHANGING DOCUMENT');
        clientSocket.emit(socketEvents.uploadResourcesInfos, 
          {folderpath: this.props.file.folder} as iSocketEventsParams.uploadResourcesInfos) 
        this.restartAutomaticHistorySave()

      }
      return true
    }

    submitOnEnter = (event:any) => {
      if (event.key === 'Enter') {
        if (this.state.filePath.length < 3) return
        this.props.onFilePathEdited(this.props.file.path ,this.state.filePath)
      }
    }

    editorScrollLogic = (e:any) => {
      let newY = this.state.posY + e.deltaY
      let previewDivWrapper = this.previewContentWrapper.current 
      let previewDiv = this.previewContent.current 
      // console.log(previewDiv.offsetHeight, previewDiv.clientHeight);
      
      if (newY > -100 && newY < previewDiv.offsetHeight) {
        this.setState({posY: this.state.posY + e.deltaY})
        previewDivWrapper.scrollTop = this.state.posY
      }
    }
 
    oldContentProp: string = ''
    render() {
      // if (!this.props.file) return <div></div>
      if (this.oldContentProp !== this.props.fileContent) {
        this.setState({
          fileContent: this.props.fileContent,
          filePath: this.props.file.path
        })
        this.oldContentProp = this.props.fileContent
      }
      let currentFolderArr = this.props.file.path.split('/')
      currentFolderArr.pop()
      let currentFolder = currentFolderArr.join('/')
      return (
        <StyledWrapper>
          <div 
            className="editor"
            onWheelCapture={this.editorScrollLogic}
            >


            
            <div className={`dragzone ${this.state.dragzoneEnabled ? '' : 'hidden'}`} ref={this.dragzone} ></div>


            <div className='toolbar-wrapper'>
                <button 
                  type="button" 
                  title='Editor'
                  onClick={(e) => {this.setState({editorEnabled: !this.state.editorEnabled})}}
                  ><Icon name="faEdit" /></button>
               
                <button 
                  type="button" 
                  title={this.state.vimMode ? 'Vim:On' : 'Vim:off'}
                  onClick={(e) => { 
                    this.setState({vimMode: !this.state.vimMode, reloadEditor: true})
                    setTimeout(() => {
                      this.setState({reloadEditor: false})
                    }) 
                  }}
                  ><Icon name="faCode" /></button>
                <button 
                  type="button" 
                  title='Detach'
                  onClick={(e) => { 
                    this.props.onEditorDetached(this.props.file.path)
                  }}
                  ><Icon name="faExternalLinkAlt" /></button>
                <button 
                  type="button" 
                  title='insert-unique-id'
                  onClick={(e) => { 
                    let newContent = this.state.fileContent
                    let id = textToId(this.props.file.realname)
                    let idtxt = `--id-${id}`
                    let idSearch = `__id_${id}`
                    let folder = `${this.props.file.folder}`
                    newContent = `${idtxt}\n\n [search|${idSearch} ${folder}]\n\n` + newContent
                    this.setState({fileContent: newContent})
                    
                  }}
                  ><Icon name="faFingerprint" /></button>
                  

                <button 
                  type="button" 
                  className='upload-button-wrapper'
                  title='insert-unique-id'
                  >
                    <input className='input-file-hidden' id="file" name="file" type="file" ref={this.uploadInput}  />
                    <label 
                      //@ts-ignore 
                      for="file"><Icon name="faPaperclip" /></label>
                  </button>
                  

                   <button 
                    className='delete'
                    type="button" 
                    title='Delete'
                    onClick={(e) => { this.props.onFileDelete(this.props.file.path) }}
                    ><Icon name="faTrash" /></button>

              </div>

            {
              /////////////////////////////
              // EDITOR
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
                  posY={this.state.posY}
                  insertUnderCaret={this.state.insertUnderCaret}
                />
              }
              {
                deviceType() !== 'desktop' && 
                <textarea
                  className='textarea-editor'
                  value={this.state.fileContent}
                  onChange={e => {this.triggerContentSaveLogic(e.target.value)}}
                />
              }
            </div>




            {
              /////////////////////////////
              // TOOLBAR
              /////////////////////////////
            }
            <div 
              className={`preview-area ${this.state.editorEnabled ? 'half' : 'full'}`} 
              ref={this.previewContentWrapper}>
              

              {
                /////////////////////////////
                // PREVIEW
                /////////////////////////////
              }
              <h3>{this.props.file.name}</h3>
              <br/>
              <div className='date modified'>modified: {formatDateEditor(new Date(this.props.file.modified || 0))}</div>
              <div className='date created'>created: {formatDateEditor(new Date(this.props.file.created || 0))}</div>
              {
                
              }
              <div 
                ref={this.previewContent}
                dangerouslySetInnerHTML={{__html:
                marked( 
                transformRessourcesInHTML(currentFolder ,
                transformImagesInHTML (currentFolder ,
                transformExtrawurstLinks (
                transformUrlInLinks ( 
                  this.state.fileContent)))))}}></div>

            </div>

          </div>
        </StyledWrapper>
      ); 
    }
  }
  
  const StyledWrapper  = styled.div`
    
    
  `