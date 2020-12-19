import React from 'react';
import styled from '@emotion/styled'
import { iFile } from '../../../shared/types.shared';
import { debounce, throttle } from 'lodash';
import { uploadOnDrop } from '../managers/editor.manager';
import { transformExtrawurstLinks, transformImagesInHTML, transformUrlLinks } from '../managers/textProcessor.manager';
import { MonacoEditorWrapper } from './MonacoEditor.Component';
import { clientSocket } from '../managers/sockets/socket.manager';
import { iSocketEventsParams, socketEvents } from '../../../shared/sockets/sockets.events';
import { formatDateEditor } from '../managers/date.manager';
import { Icon } from './Icon.component';
const marked = require('marked');

interface Props {
  file:iFile
  fileContent:string
  onFileEdited: (filepath:string, content:string) => void
  onFilePathEdited: (initPath:string, endPath:string) => void
  onSavingHistoryFile: (filepath:string, content:string) => void
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
        this.previewContentWrapper = React.createRef()
        this.previewContent = React.createRef()
    }

    componentDidMount() {
      uploadOnDrop(this.dragzone.current, {
        onUploadSuccess: (file) => {
          // we know the filepath will be ./.resources/UNIQUEID.jpg
          let imageInMd = `![${file.name}](${file.path})\n\n`
          this.setState({insertUnderCaret: imageInMd})
        },
        onDragEnd: () => {
          console.log('drag end');
          this.setState({dragzoneEnabled: false})
          
        },
        onDragStart: () => {
          this.setState({dragzoneEnabled: true})
          console.log('drag start');
           
          clientSocket.emit(socketEvents.uploadResourcesInfos, 
            {folderpath: this.props.file.folder} as iSocketEventsParams.uploadResourcesInfos) 
          
        },
      })
    }
    

    triggerContentSaveLogic = (newContent:string) => {
      if (!this.state.shouldSaveOnLeave) {
        console.log('init edit of new doc');
        this.props.onSavingHistoryFile(this.props.file.path, newContent)
      }
      let ct = newContent.substr(newContent.length-100, 100)
      console.log('triggerContentSaveLogic', {ct});
      
      this.setState({fileContent: newContent, shouldSaveOnLeave: true})
      this.throttledOnFileEdited(this.props.file.path, newContent)
      this.debouncedOnFileEdited(this.props.file.path, newContent)
    }

    throttledOnFileEdited = throttle((filePath:string, content:string) => {
      this.props.onFileEdited(filePath, content)
    }, 10000)

    debouncedOnFileEdited = debounce((filePath:string, content:string) => {
      this.props.onFileEdited(filePath, content)
    }, 10000)
    
    shouldComponentUpdate ( nextProps: any,  nextState: any, nextContext: any) { 
      if (this.props.file !== nextProps.file && this.state.shouldSaveOnLeave) {
        console.log('saving on leave');
        
        this.setState({shouldSaveOnLeave: false})
        this.props.onFileEdited(this.props.file.path, this.state.fileContent)
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
                <MonacoEditorWrapper
                  value={this.state.fileContent}
                  vimMode={this.state.vimMode}
                  onChange={this.triggerContentSaveLogic}
                  posY={this.state.posY}
                  insertUnderCaret={this.state.insertUnderCaret}
                />
              }
            </div>




            {
              /////////////////////////////
              // PREVIEW
              /////////////////////////////
            }
            <div 
              className={`preview-area ${this.state.editorEnabled ? 'half' : 'full'}`} 
              ref={this.previewContentWrapper}>
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
                    className='delete'
                    type="button" 
                    title='Delete'
                    onClick={(e) => { this.props.onFileDelete(this.props.file.path) }}
                  ><Icon name="faTrash" /></button>

              </div>

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
                transformImagesInHTML (currentFolder ,
                transformExtrawurstLinks (
                transformUrlLinks ( 
                  this.state.fileContent))))}}></div>

            </div>

          </div>
        </StyledWrapper>
      ); 
    }
  }
  
  const StyledWrapper  = styled.div`
    
    
  `