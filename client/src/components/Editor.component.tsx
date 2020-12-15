import React from 'react';
import styled from '@emotion/styled'
import { iFile } from '../../../shared/types.shared';
import { debounce, throttle } from 'lodash';
import { uploadOnDrop } from '../managers/editor.manager';
import { transformImagesInHTML } from '../managers/textProcessor.manager';
import { MonacoEditorWrapper } from './MonacoEditor.Component';
const marked = require('marked');

interface Props {
  file:iFile
  fileContent:string
  onFileEdited: (filepath:string, content:string) => void
  onFilePathEdited: (initPath:string, endPath:string) => void
  onSavingHistoryFile: (filepath:string, content:string) => void
  onFileDelete: (filepath:string) => void
}
interface State {
  editorEnabled: boolean
  fileContent: string
  dragzoneEnabled: boolean
  shouldSaveOnLeave: boolean
  filePath: string
  insertUnderCaret: string
}


export class Editor extends React.Component<Props, State> {

    textarea:any
    dragzone:any
    constructor(props:any) {
        super(props)
        this.state = {
          editorEnabled: true,
          fileContent: '',
          shouldSaveOnLeave: false,
          dragzoneEnabled: false,
          filePath: '',
          insertUnderCaret: ''
        }
        this.textarea = React.createRef()
        this.dragzone = React.createRef()
    }

    componentDidMount() {
      uploadOnDrop(this.dragzone.current, {
        onUploadSuccess: (file) => {
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
          
        },
      })
    }
    

    triggerContentSaveLogic = (newContent:string) => {
      if (!this.state.shouldSaveOnLeave) {
        // console.log('init edit of new doc');
        this.props.onSavingHistoryFile(this.props.file.path,this.state.fileContent)
      }
      console.log('triggerContentSaveLogic');
      this.setState({fileContent: newContent, shouldSaveOnLeave: true})
      this.throttledOnFileEdited(this.props.file.path ,this.state.fileContent)
      this.debouncedOnFileEdited(this.props.file.path, this.state.fileContent)
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
 
    oldContentProp: string = ''
    render() {
      if (this.oldContentProp !== this.props.fileContent) {
        this.setState({
          fileContent: this.props.fileContent,
          filePath: this.props.file.path
        })
        this.oldContentProp = this.props.fileContent
      }

      return (
        <StyledWrapper>
          <div className="editor">

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
              <MonacoEditorWrapper
                value={this.state.fileContent}
                onChange={this.triggerContentSaveLogic}
                insertUnderCaret={this.state.insertUnderCaret}
              />
            </div>




            {
              /////////////////////////////
              // PREVIEW
              /////////////////////////////
            }
            <div className={`preview-area ${this.state.editorEnabled ? 'half' : 'full'}`}>
              <div className='toolbar-wrapper'>
                <input 
                  type="button" 
                  value='Editor'
                  onClick={(e) => {this.setState({editorEnabled: !this.state.editorEnabled})}}
                  />
                <input 
                  type="button" 
                  value='Delete'
                  onClick={(e) => { this.props.onFileDelete(this.props.file.path) }}
                  />

              </div>

              <h3>{this.props.file.name}</h3>
              <div dangerouslySetInnerHTML={{__html:marked( transformImagesInHTML (this.state.fileContent))}}></div>

            </div>

          </div>
        </StyledWrapper>
      ); 
    }
  }
  
  const StyledWrapper  = styled.div`
    
    
  `