import React from 'react';
import styled from '@emotion/styled'
import { iFile } from '../../../shared/types.shared';
import { throttle } from 'lodash';
import { insertAtCaret, uploadOnDrop } from '../managers/editor.manager';
// import ReactMarkdown from 'react-markdown'
const marked = require('marked');

interface Props {
  file:iFile
  fileContent:string
  onFileEdited: (file:iFile, content:string) => void
}
interface State {
  editorEnabled: boolean
  fileContent: string
  dragzoneEnabled: boolean
}

export class Editor extends React.Component<Props, State> {

    textarea:any
    dragzone:any
    constructor(props:any) {
        super(props)
        this.state = {
          editorEnabled: true,
          fileContent: '',
          dragzoneEnabled: false
        }
        this.textarea = React.createRef()
        this.dragzone = React.createRef()
    }

    componentDidMount() {
      uploadOnDrop(this.dragzone.current, {
        onUploadSuccess: (file) => {
          insertAtCaret(this.textarea.current, `![${file.name}](${file.path})\n\n`)
          this.setState({fileContent: this.textarea.current.value})
          this.throttledOnFileEdited()
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

    componentDidUpdate(nextProps:Props, nextState:State) {
      if (this.props.fileContent !== nextProps.fileContent) {
        console.log('updating filecontent');
        this.setState({fileContent: nextProps.fileContent})
        // setTimeout(() => {
        //   insertAtCaret(this.textarea.current, 'woooop')
        // }, 3000)
      }
    }

    throttledOnFileEdited = throttle(() => {
      this.props.onFileEdited(this.props.file, this.state.fileContent)
    }, 10000)

    render() {
      return (
        <StyledWrapper>
          <div className="editor">

            <div className={`dragzone ${this.state.dragzoneEnabled ? '' : 'hidden'}`} ref={this.dragzone} ></div>

            <div className={`editor-area ${this.state.editorEnabled ? 'active' : 'inactive'}`}>
                  <textarea
                    ref={this.textarea}
                    onChange={(e) => {
                      this.setState({fileContent: e.target.value})
                      this.throttledOnFileEdited()
                    }}
                    value={this.state.fileContent}
                  /> 
            </div>

            <div className={`preview-area ${this.state.editorEnabled ? 'half' : 'full'}`}>
              <div className='toolbar-wrapper'>
                {/* <MyDropzone ></MyDropzone> */}
                {/* <UploadZone></UploadZone> */}
                <input 
                  type="button" 
                  value='Editor'
                  onClick={(e) => {this.setState({editorEnabled: !this.state.editorEnabled})}}
                  />

              </div>

              <h3>{this.props.file.name}</h3>
              {/* <ReactMarkdown> */}
              <div dangerouslySetInnerHTML={{__html:marked(this.state.fileContent)}}></div>
              {/* </ReactMarkdown> */}
              {/* <ReactMarkdown>
              </ReactMarkdown> */}

            </div>

          </div>
        </StyledWrapper>
      ); 
    }
  }
  
  const StyledWrapper  = styled.div`
    .editor {
      display: flex;
      .dragzone {
        &.hidden {
          display:none;
        }
        display:block;
        position: absolute;
        top: 0px;
        left: 0px;
        width: 100vw;
        height: 100vh;
        z-index: 10;
        background: rgba(255,255,255,0.4);
      }
      .editor-area {
        &.inactive {
          display: none;
        }
        width: 50%;
        textarea {
          width: 100%;
          padding: 10px;
          height: 100vh;
          overflow: hidden;
          overflow-y: scroll;
          background: rgba(255,255,255,0.5);
          padding: 10px;
          border: 0px;
        }
      }
      .preview-area {
        .toolbar-wrapper {
          padding: 10px 0px 10px 0px;

        }
        &.full {
          width: 100%
        }
        width: 50%;
        padding: 0px 30px 30px 30px;
        height: 100vh;
        overflow: hidden;
        overflow-y: scroll;
      }
    }
    
  `