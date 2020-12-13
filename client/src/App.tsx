import React from 'react';
import styled from '@emotion/styled'
import { Global, css } from '@emotion/core'

import { iSocketEventsParams, socketEvents } from '../../shared/sockets/sockets.events';
import { clientSocket, initSocketConnection } from './managers/sockets/socket.manager';
import { bindEventManagerToSocketEvents, socketEventsManager } from './managers/sockets/eventsListener.sockets';
import { iFile, iFolder } from '../../shared/types.shared';
import { List } from './components/List.component';
import { Editor } from './components/Editor.component';
import { SearchBar } from './components/SearchBar.component';
import { TreeView } from './components/TreeView.Component';
const marked = require('marked');

class App extends React.Component<{}, {
  files:iFile[], 
  selectedFile: iFile | null
  selectedFileContent: string | null
  selectedFolder: string
  isSearching: boolean
  folderHierarchy: iFolder 
}> {

  constructor(props:any) {
      super(props)
      this.state = {
        files: [],
        folderHierarchy: {title: '', key: '', path: ''},
        selectedFile: null,
        selectedFolder: '',
        selectedFileContent: null,
        isSearching: false
      }
  }
  listenerIds:number[] = []

  componentDidMount() {
    initSocketConnection().then(() => {
      bindEventManagerToSocketEvents()
      
      // INITIAL REQUESTS
      this.askForFolderFiles(this.state.selectedFolder)
      clientSocket.emit(socketEvents.askFolderHierarchy, {folderPath: ''} as iSocketEventsParams.askFolderHierarchy)  

      this.listenerIds[0] = socketEventsManager.on(
        socketEvents.getFiles, 
        (data:iSocketEventsParams.getFiles) => {  
          this.setState({
            files: data.files,
            isSearching: false
          })
      })

      this.listenerIds[1] = socketEventsManager.on(
        socketEvents.getFileContent, 
        (data:iSocketEventsParams.getFileContent) => {  
          this.setState({selectedFileContent: data.fileContent})
      })

      this.listenerIds[2] = socketEventsManager.on(
        socketEvents.getFolderHierarchy, 
        (data:iSocketEventsParams.getFolderHierarchy) => {  
          this.setState({folderHierarchy: data.folder})
      })

    })
  }
  
  askForFolderFiles = (folderPath:string) => {
    clientSocket.emit(socketEvents.askForFiles, {folderPath: folderPath} as iSocketEventsParams.askForFiles)
  }

  componentWillUnmount(){
    this.listenerIds.forEach((id) => {
      socketEventsManager.off(id)
    })
  }

  render() {
    return (
      <Wrapper>
        
        <Global
          styles={GlobalStyle}
        />
        <div className="main-wrapper">


          <div className="left-wrapper">

            <SearchBar 
              onSearchSubmit={term => {
                  this.setState({ isSearching: true })
                  clientSocket.emit(socketEvents.searchFor, {term} as iSocketEventsParams.searchFor) 
              }}
              isSearching={this.state.isSearching}
              isListEmpty={this.state.files.length === 0 ? true : false}
            />

            <TreeView 
              folder={this.state.folderHierarchy}
              onFolderClicked={(folderPath) => {
                console.log(folderPath);
                this.setState({selectedFolder: folderPath})
                this.askForFolderFiles(folderPath)
              }}
            />

            <div className="list-wrapper">
              <List 
                files={this.state.files} 
                onFileClicked={file => {
                  file.path = `${this.state.selectedFolder}/${file.path}`
                  console.log({file});
                  
                  this.setState({selectedFile: file})
                  clientSocket.emit(socketEvents.askForFileContent, 
                    {filePath: file.path} as iSocketEventsParams.askForFileContent)  
                }}
                />
            </div>
          </div>




          <div className="right-wrapper">
            <div className="note-wrapper">
              { 
                this.state.selectedFile && 
                  <Editor 
                    file={this.state.selectedFile} 
                    fileContent={this.state.selectedFileContent ? this.state.selectedFileContent : ''} 
                    onFileEdited={(file, content) => {
                      console.log(`file edited!`,{file, content});
                    }}
                  />
              }
              { 
                !this.state.selectedFile && 
                  <div>no file selected</div>
              }
            </div>
          </div>




        </div>
      </Wrapper>
    );
  }
}


export default App; //dd

const GlobalStyle = css`
  body {
    margin: 0;
    padding: 0px;
    height: 100vh;
    overflow: hidden;
    /* background: rgb(221, 221, 221); */
    background: #fceeded6;
    font-size: 11px;
    font-family: Consolas, Menlo, Monaco, Lucida Console, Liberation Mono, DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace, serif;
  }
  .vis-timeline {
    background: #fceeded6;
    border: 0px solid;
    border-bottom: 1px #cacaca solid;
    border-top: 1px #cacaca solid;
  }
`

const Wrapper  = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content:center;

  .main-wrapper {
    display: flex;
    .left-wrapper {
        height:100vh;
        background: rgb(221, 221, 221); 
        /* max-height: 100vh; */
        width: 30vw;
        overflow: hidden;
        overflow-y: scroll;
      .list-wrapper {
        ul {
            list-style: none;
            padding: 0px 0px 0px 25px;
            li {
                text-decoration: underline;
                color: blue;
                /* display:inline-block; */
                cursor: pointer;
            }
        }
      }
      .search-input {
          input {
            border: none;
            background: #eaeaea;
            padding: 10px 2vw;
            margin: 10px 3vw; 
          }
      }
      .search-status {
        text-align: center;
        font-size: 8px;
      }
    }
    .right-wrapper {
        width: 70vw;
        /* padding: 10px; */
        padding-top: 0px;
        /* max-height: 100vh;
        overflow-y: scroll; */
      .note-wrapper {
        h3 {
          margin-bottom: 0px;
        }
        .date {
          font-size: 10px;
          color: grey;
        }
        pre {
          white-space: -moz-pre-wrap; /* Mozilla, supported since 1999 */
          white-space: -pre-wrap; /* Opera */
          white-space: -o-pre-wrap; /* Opera */
          white-space: pre-wrap; /* CSS3 - Text module (Candidate Recommendation) http://www.w3.org/TR/css3-text/#white-space */
          word-wrap: break-word; /* IE 5.5+ */
        }
      }
    }
  }
`