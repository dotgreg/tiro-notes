import React from 'react';

import { iSocketEventsParams, socketEvents } from '../../shared/sockets/sockets.events';
import { clientSocket, initSocketConnection } from './managers/sockets/socket.manager';
import { bindEventManagerToSocketEvents, socketEventsManager } from './managers/sockets/eventsListener.sockets';
import { iFile, iFolder } from '../../shared/types.shared';
import { List, SortModes, SortModesLabels } from './components/List.component';
import { Editor } from './components/Editor.component';
import { SearchBar } from './components/SearchBar.component';
import { TreeView } from './components/TreeView.Component';
import { Global } from '@emotion/react'
import { CssApp, GlobalCssApp } from './managers/style.manager';
import { onKey } from './managers/keys.manager';
import { configClient } from './config';
import { filter, sortBy } from 'lodash';
import { Icon } from './components/Icon.component';
import { listenToHashChanges } from './managers/hash.manager';
import { initClipboardListener } from './managers/clipboard.manager';
import { deviceType, MobileView } from './managers/device.manager';


const LocalStorageMixin = require('react-localstorage');
const reactMixin = require('react-mixin');
@reactMixin.decorate(LocalStorageMixin)
class App extends React.Component<{
}, {
  files:iFile[], 
  activeFileIndex: number
  activeFileContent: string | null
  selectedFolder: string
  searchTerm: string
  isSearching: boolean
  folderHierarchy: iFolder 
  hoverMode: boolean 
  ctrlPressed: boolean 
  multiSelectMode: boolean 
  multiSelectArray: number[] 
  sortMode: number
  mobileView: MobileView
  isSocketConnected: boolean
}> {

  static displayName = 'extrawurstApp';
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
        ctrlPressed: false,
        hoverMode: false,
        multiSelectMode: false,
        sortMode: 0,
        multiSelectArray: [],
        mobileView:'navigator', 
        isSocketConnected: false
      }
  }
  listenerIds:number[] = []

  componentDidMount() {
    console.log(`[APP] MOUNTED on a ${deviceType()}`);
    this.updatePageTitle()

    listenToHashChanges((newHash) => {
        this.setState({searchTerm: newHash})
        setTimeout(() => {
          this.triggerSearch(this.state.searchTerm)
        })
    })

    // initClipboardListener()

    window.onkeydown = (e:any) => {
      onKey(e, 'up', () => {
        let i = this.state.activeFileIndex  
        if (i > 0) this.loadFileDetails(i-1)    
      })
      onKey(e, 'down', () => {
        let i = this.state.activeFileIndex  
        if (i < this.state.files.length - 1) this.loadFileDetails(i+1)   
      })
      onKey(e, 'ctrl', () => {
        this.setState({ctrlPressed: true})
      })
    }
    window.onkeyup = (e:any) => {
      onKey(e, 'ctrl', () => {
        this.setState({ctrlPressed: false})
      })
    }

    initSocketConnection().then(() => {
      this.toggleSocketConnection(true)
      bindEventManagerToSocketEvents()
      
      // INITIAL REQUESTS (including a folder scan every minute)
      setInterval(() => {
        // this.askForFolderScan()
      }, 1000 * 60)

      // reload file details 
      this.state.activeFileIndex !== -1 && this.loadFileDetails(this.state.activeFileIndex)
      this.askForFolderScan()
      this.setState({ctrlPressed: false})

      let lastFolderIn = this.state.selectedFolder
      let lastSearchIn = this.state.searchTerm
      this.listenerIds[0] = socketEventsManager.on(
        socketEvents.getFiles, 
        (data:iSocketEventsParams.getFiles) => {  

          // only keep md files in file list
          let files = filter(data.files, {extension: 'md'})

          // sort them
          files = this.sortFiles(files, this.state.sortMode)

          this.setState({
            files,
            isSearching: data.temporaryResults ? true : false
          })
          this.state.activeFileIndex !== -1 && this.loadFileDetails(this.state.activeFileIndex)

          setTimeout(() => {

            // IF RELOAD LIST SAME FOLDER
            if (this.state.selectedFolder === lastFolderIn) {
              this.loadFileDetails(0)
            }
            // ON LIST ITEMS CHANGES
            if (this.state.selectedFolder !== lastFolderIn || this.state.searchTerm !== lastSearchIn) {
              
              // Load first item list 
              this.loadFileDetails(0)
              lastFolderIn = this.state.selectedFolder
              lastSearchIn = this.state.searchTerm
              
              // clean multiselect
              this.cleanMultiSelect()
            }
          }, 100)
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

      this.listenerIds[3] = socketEventsManager.on(socketEvents.disconnect, () => { this.toggleSocketConnection(false) })
      this.listenerIds[4] = socketEventsManager.on(socketEvents.reconnect, () => {this.toggleSocketConnection(true) })
      this.listenerIds[5] = socketEventsManager.on(socketEvents.connect, () => {this.toggleSocketConnection(true) })
  })
}

updatePageTitle = () => {
  let newTitle = ''

  if (window.location.host.includes(configClient.global.staticPort.toString())) newTitle =  `${document.title} (PROD ${configClient.version})`
  else newTitle = `/!\\ DEV /!\\`

  // if(!this.state.isSocketConnected) newTitle += ``
  newTitle += this.state.isSocketConnected ? ` (Connected)` : ` (DISCONNECTED)`

  document.title = newTitle
}

  toggleSocketConnection = (state: boolean) => {
    console.log(`[SOCKET CONNECTION TOGGLE] to ${state}`);
    this.setState({isSocketConnected: state}) 
    setTimeout(() => {this.updatePageTitle()}, 100)
  }

  toggleMobileView = (mobileView:MobileView) => {
    // let mobileView:MobileView = this.state.mobileView === 'editor' ? 'navigator' : 'editor'
    this.setState({mobileView})
  }
  
  cleanFilesList = () => {
    this.setState({files: []})
  }
  askForFolderFiles = (folderPath:string) => {
    clientSocket.emit(socketEvents.askForFiles, {folderPath: folderPath} as iSocketEventsParams.askForFiles)
  }
  cleanAndAskForFolderFiles = (folderPath:string) => {
    this.setState({isSearching: true})
    this.cleanFilesList()
    this.askForFolderFiles(folderPath)
  }
  askForFolderScan = () => {
    clientSocket.emit(socketEvents.askFolderHierarchy, {folderPath: ''} as iSocketEventsParams.askFolderHierarchy)  
  }

  moveFile = (initPath:string, endPath:string) => {
    console.log(`[MOVEFILE] ${initPath} -> ${endPath}`);
    clientSocket.emit(socketEvents.moveFile, {initPath, endPath, shouldRescan: true} as iSocketEventsParams.moveFile)  
  }

  promptAndBatchMoveFiles = (folderpath:string) => {
    let userAccepts = window.confirm(`Are you sure you want to move ${this.state.multiSelectArray.length} files and their resources to ${folderpath}`)
    if (userAccepts) {
      for (let i = 0; i < this.state.multiSelectArray.length; i++) {
        const fileId = this.state.multiSelectArray[i];
        let file = this.state.files[fileId]
        let filenameArr = file.name.split('/')
        // in case we are in research, the file.name === file.path
        let realFileName = filenameArr[filenameArr.length-1]
        this.moveFile(file.path, `${folderpath}/${realFileName}`)
      }
      this.cleanMultiSelect() 
      this.emptyFileDetails()
    }
  }
  
  triggerSearch = (term:string) => {
    console.log(`[APP -> TRIGGER SEARCH] ${term}`);
    this.emptyFileDetails()
    this.cleanFilesList()
    this.cleanMultiSelect()
    this.setState({ isSearching: true, selectedFolder: '', activeFileIndex: -1 })
    clientSocket.emit(socketEvents.searchFor, {term} as iSocketEventsParams.searchFor) 
  }

  sortFiles = (files:iFile[], sortMode:any):iFile[] => {
    let sortedFiles
    switch (SortModes[sortMode]) {
      case 'none':
        sortedFiles = sortBy(files, ['index'])
        break;
      case 'alphabetical':
        sortedFiles = sortBy(files, [file => file.realname.toLocaleLowerCase()])
        break;
      case 'created':
        sortedFiles = sortBy(files, ['created']).reverse()
        break;
      case 'modified':
        sortedFiles = sortBy(files, ['modified']).reverse()
        break;
    
      default:
        sortedFiles = sortBy(files, ['index'])
        break;
    }

    return sortedFiles
  }

  cleanMultiSelect = () => {
    this.setState({ multiSelectMode: false, multiSelectArray: [] })
  }

  emptyFileDetails = () => {
    this.setState({activeFileIndex:-1, activeFileContent: ''})
  }

  loadFileDetails = (fileIndex:number) => {
    let file = this.state.files[fileIndex]
    
    if (file && file.name.endsWith('.md')) {
      this.setState({activeFileIndex:fileIndex, activeFileContent: ''})
      clientSocket.emit(socketEvents.askForFileContent, 
        {filePath: file.path} as iSocketEventsParams.askForFileContent)  
    }
  }

  componentDidUpdate(prevProps:any, prevState:any) {
    if (prevState.files !== this.state.files) {
      if (this.state.activeFileIndex !== -1) {
        this.loadFileDetails(this.state.activeFileIndex)
      }
    }
  }

  componentWillUnmount(){
    this.listenerIds.forEach((id) => {
      socketEventsManager.off(id)
    })
  }

  render() { 
    return (
      <CssApp v={this.state.mobileView}>
        <Global styles={GlobalCssApp}  />

        <div className="main-wrapper">
            { 
              deviceType() !== 'desktop' &&
              <div className='mobile-view-toggler'>
                <button 
                  type="button" 
                  onClick={(e) => { this.toggleMobileView('navigator')}}>
                  Nav</button>
                <button 
                  type="button" 
                  onClick={(e) => { this.toggleMobileView('editor')}}>
                  Edi</button>
                <button 
                  type="button" 
                  onClick={(e) => { this.toggleMobileView('preview')}}>
                  Prev</button>
                
              </div>
            }


          <div className="left-wrapper">

            {
              /////////////////////////////
              // TREE
              /////////////////////////////
            }
            <div className="left-wrapper-1">
              <TreeView 
                selected={this.state.selectedFolder}
                folder={this.state.folderHierarchy}
                onFolderClicked={(folderpath) => {
                  // if multiselect not empty, prompt user, then move files into that
                  if (this.state.multiSelectMode && this.state.multiSelectArray.length > 0) {
                    this.promptAndBatchMoveFiles(folderpath)
                  } else {
                    // move from selected folder
                    this.setState({selectedFolder: folderpath, searchTerm:'', activeFileIndex: -1})
                    this.cleanAndAskForFolderFiles(folderpath)
                  }
                }}
                onFolderRightClicked = {(folderpath) => {
                  clientSocket.emit(socketEvents.askForExplorer, 
                    {folderpath: folderpath} as iSocketEventsParams.askForExplorer) 
                }}
              />

              <div className="connection-status">
                  {this.state.isSocketConnected && <div className="connected">connected</div>}
                  {!this.state.isSocketConnected && <div className="disconnected">disconnected</div>}
              </div>
            </div>

            {
              /////////////////////////////
              // SEARCH
              /////////////////////////////
            }
            <div className="left-wrapper-2">
              <SearchBar 
                onSearchSubmit={() => {
                    this.triggerSearch(this.state.searchTerm)
                }}
                onSearchTermUpdate={searchTerm => {this.setState({ searchTerm})}}
                searchTerm={this.state.searchTerm}
                isSearching={this.state.isSearching}
                isListEmpty={this.state.files.length === 0 ? true : false}
              />


            <div className='list-toolbar'>
            
              { this.state.searchTerm === '' &&
                <button onClick={(e) => {
                    clientSocket.emit(socketEvents.createNote, 
                      {folderPath: this.state.selectedFolder} as iSocketEventsParams.createNote) 
                }}><Icon name="faStickyNote" /></button>
              }

                {/* <input 
                  type="button" 
                  value={this.state.hoverMode ? 'Hover:On' : 'Hover:Off'} 
                  onClick={e => this.setState({hoverMode: !this.state.hoverMode})}
                /> */}

                <button 
                  type="button" 
                  title={this.state.multiSelectMode ? 'Select:On' : 'Select:Off'}
                  onClick={e => this.setState({
                    multiSelectMode: !this.state.multiSelectMode,
                    multiSelectArray: []
                  })}
                > <Icon name="faCheckDouble" /> </button>

                <button 
                  type="button" 
                  title='sort'
                  onClick={e => {
                    let newMode = this.state.sortMode + 1 >= SortModes.length ? 0 : this.state.sortMode + 1
                    let files = this.sortFiles(this.state.files, newMode)
                    this.setState({sortMode: newMode, files})
                  }}
                > <Icon name="faSort" /> { this.state.sortMode !== 0 && SortModesLabels[this.state.sortMode] } </button>

              { this.state.files.length > 0 &&
                  <span className='items-list-count'>{this.state.files.length} els</span>
              }

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
                  ctrlPressed={this.state.ctrlPressed}

                  sortMode={this.state.sortMode}

                  multiSelectArray={this.state.multiSelectArray}
                  multiSelectMode={this.state.multiSelectMode}
                  onMultiSelectChange={arr => this.setState({multiSelectArray:arr})}

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
                      console.log(`[APP] API -> ask for file save`,{filepath, content});
                      // this.askForFolderFiles(this.state.selectedFolder)
                      clientSocket.emit(socketEvents.saveFileContent, 
                        {filepath: filepath, newFileContent: content} as iSocketEventsParams.saveFileContent)  
                    }}
                    onFilePathEdited={(initPath, endPath) => {
                      console.log(`[APP] onFilePathEdited =>`,{initPath, endPath});
                      this.emptyFileDetails()
                      this.moveFile(initPath, endPath)
                    }}
                    onSavingHistoryFile={(filePath, content, historyFileType) => {
                      console.log(`[APP] onSavingHistoryFile ${historyFileType} => ${filePath}`);
                      clientSocket.emit(socketEvents.createHistoryFile, 
                        {filePath, content, historyFileType} as iSocketEventsParams.createHistoryFile)  
                    }}
                    onEditorDetached={(filepath) => {
                      clientSocket.emit(socketEvents.askForNotepad, 
                        {filepath} as iSocketEventsParams.askForNotepad) 

                        setTimeout(() => {
                          this.emptyFileDetails()
                        }, 500)
                    }}
                    onFileDelete={(filepath) => {
                      console.log(`[APP] onFileDelete => ${filepath}`);
                      
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

