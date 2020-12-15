import React from 'react';

import { iSocketEventsParams, socketEvents } from '../../shared/sockets/sockets.events';
import { clientSocket, initSocketConnection } from './managers/sockets/socket.manager';
import { bindEventManagerToSocketEvents, socketEventsManager } from './managers/sockets/eventsListener.sockets';
import { iFile, iFolder } from '../../shared/types.shared';
import { List } from './components/List.component';
import { Editor } from './components/Editor.component';
import { SearchBar } from './components/SearchBar.component';
import { TreeView } from './components/TreeView.Component';
import { Global } from '@emotion/react'
import { CssApp, GlobalCssApp } from './managers/style.manager';
import { onKey } from './managers/keys.manager';
const marked = require('marked');


const LocalStorageMixin = require('react-localstorage');
const reactMixin = require('react-mixin');
@reactMixin.decorate(LocalStorageMixin)
class App extends React.Component<{}, {
  files:iFile[], 
  activeFileIndex: number
  activeFileContent: string | null
  selectedFolder: string
  searchTerm: string
  isSearching: boolean
  folderHierarchy: iFolder 
  hoverMode: boolean 
}> {

  constructor(props:any) {
      super(props)
      this.state = {
        files: [],
        folderHierarchy: {title: '', key: '', path: ''},
        activeFileIndex: -1,
        selectedFolder: '',
        searchTerm: '',
        activeFileContent: null,
        isSearching: false,
        hoverMode: false
      }
  }
  listenerIds:number[] = []

  componentDidMount() {
    window.onkeydown = (e:any) => {
      onKey(e, 'up', () => {
        let i = this.state.activeFileIndex  
        if (i > 0) this.loadFileDetails(i-1)    
      })
      onKey(e, 'down', () => {
        let i = this.state.activeFileIndex  
        if (i < this.state.files.length - 1) this.loadFileDetails(i+1)   
      })
    }

    initSocketConnection().then(() => {
      bindEventManagerToSocketEvents()
      
      // INITIAL REQUESTS (including a folder scan every minute)
      setInterval(() => {
        this.askForFolderScan()
      }, 1000 * 60)
      this.askForFolderScan()
      this.askForFolderFiles(this.state.selectedFolder)

      let lastFolderIn = this.state.selectedFolder
      this.listenerIds[0] = socketEventsManager.on(
        socketEvents.getFiles, 
        (data:iSocketEventsParams.getFiles) => {  
          this.setState({
            files: data.files,
            isSearching: false
          })
          setTimeout(() => {
            if (this.state.selectedFolder !== lastFolderIn) {
              this.loadFileDetails(0)
              lastFolderIn = this.state.selectedFolder
            }
          })
      })

      this.listenerIds[1] = socketEventsManager.on(
        socketEvents.getFileContent, 
        (data:iSocketEventsParams.getFileContent) => {  
          this.setState({activeFileContent: data.fileContent})
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
  askForFolderScan = () => {
    clientSocket.emit(socketEvents.askFolderHierarchy, {folderPath: ''} as iSocketEventsParams.askFolderHierarchy)  
  }

  emptyFileDetails = () => {
    this.setState({activeFileIndex:-1, activeFileContent: ''})
  }

  loadFileDetails = (fileIndex:number) => {
    let file = this.state.files[fileIndex]
    if (file.name.endsWith('.md')) {
      this.setState({activeFileIndex:fileIndex, activeFileContent: ''})
      clientSocket.emit(socketEvents.askForFileContent, 
        {filePath: file.path} as iSocketEventsParams.askForFileContent)  
    }
  }

  componentWillUnmount(){
    this.listenerIds.forEach((id) => {
      socketEventsManager.off(id)
    })
  }

  render() { 
    return (
      <CssApp>
        <Global styles={GlobalCssApp} />


        <div className="main-wrapper">
          <div className="left-wrapper">

            {
              /////////////////////////////
              // TREE
              /////////////////////////////
            }
            <div className="left-wrapper-1">
              <TreeView 
                folder={this.state.folderHierarchy}
                onFolderClicked={(folderPath) => {
                  this.setState({selectedFolder: folderPath, searchTerm:'', activeFileIndex: -1})
                  this.askForFolderFiles(folderPath)
                }}
              />
            </div>

            {
              /////////////////////////////
              // SEARCH
              /////////////////////////////
            }
            <div className="left-wrapper-2">
              <SearchBar 
                onSearchSubmit={() => {
                    this.setState({ isSearching: true, selectedFolder: '', activeFileIndex: -1 })
                    clientSocket.emit(socketEvents.searchFor, {term:this.state.searchTerm} as iSocketEventsParams.searchFor) 
                }}
                onSearchTermUpdate={searchTerm => {this.setState({ searchTerm})}}
                searchTerm={this.state.searchTerm}
                isSearching={this.state.isSearching}
                isListEmpty={this.state.files.length === 0 ? true : false}
              />


            <div className='list-toolbar'>
            
              <button onClick={(e) => {
                    clientSocket.emit(socketEvents.createNote, 
                      {folderPath: this.state.selectedFolder} as iSocketEventsParams.createNote) 
                }}>New note</button>

                <input 
                  type="button" 
                  value={this.state.hoverMode ? 'Hover:On' : 'Hover:Off'} 
                  onClick={e => this.setState({hoverMode: !this.state.hoverMode})}
                />

            </div>



              {
              /////////////////////////////
              // LIST
              /////////////////////////////
              }
              <div className="list-wrapper">
                <List 
                  files={this.state.files} 
                  hoverMode={this.state.hoverMode}
                  activeFileIndex={this.state.activeFileIndex}
                  onFileClicked={(fileIndex) => {
                    this.loadFileDetails(fileIndex)
                  }}
                  />
              </div>
            </div>
          </div>





          {
          /////////////////////////////
          // EDITOR NOTE DETAILS
          /////////////////////////////
          }
          <div className="right-wrapper">
            <div className="note-wrapper">
              { 
                (this.state.activeFileIndex !== -1) && 
                  <Editor 
                    file={this.state.files[this.state.activeFileIndex]} 
                    fileContent={this.state.activeFileContent ? this.state.activeFileContent : ''} 
                    onFileEdited={(filepath, content) => {
                      console.log(`file edition updated to backend!`,{filepath, content});
                      clientSocket.emit(socketEvents.saveFileContent, 
                        {filepath: filepath, newFileContent: content} as iSocketEventsParams.saveFileContent)  
                    }}
                    onFilePathEdited={(initPath, endPath) => {
                      console.log(`onFilePathEdited =>`,{initPath, endPath});
                      clientSocket.emit(socketEvents.moveFile, 
                        {initPath, endPath} as iSocketEventsParams.moveFile)  
                    }}
                    onSavingHistoryFile={(filePath, content) => {
                      console.log(`onSavingHistoryFile => ${filePath}`);
                      clientSocket.emit(socketEvents.createHistoryFile, 
                        {filePath, content} as iSocketEventsParams.createHistoryFile)  
                    }}
                    onFileDelete={(filepath) => {
                      console.log(`onFileDelete => ${filepath}`);
                      
                      let i = this.state.activeFileIndex  
                      if (i > 0) this.loadFileDetails(i-1)    
                      else if (i < this.state.files.length - 2) this.loadFileDetails(i+1)   
                      else this.emptyFileDetails()
                      
                      clientSocket.emit(socketEvents.onFileDelete, 
                        {filepath} as iSocketEventsParams.onFileDelete) 
                        
                      this.askForFolderFiles(this.state.selectedFolder)
                    }}
                  />
              }
              { 
                this.state.activeFileIndex === -1 && 
                  <div>no file selected</div>
              }
            </div>
          </div>




        </div>
      </CssApp>
    );
  }
}


export default App; //dd

