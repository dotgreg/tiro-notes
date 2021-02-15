import React from 'react';

import { iSocketEventsParams, socketEvents } from '../../shared/sockets/sockets.events';
import { clientSocket, initSocketConnection } from './managers/sockets/socket.manager';
import { bindEventManagerToSocketEvents, socketEventsManager } from './managers/sockets/eventsListener.sockets';
import { iFile, iFolder } from '../../shared/types.shared';
import { List, SortModes, SortModesLabels } from './components/List.component';
import { SearchBar } from './components/SearchBar.component';
import { TreeView } from './components/TreeView.Component';
import { Global } from '@emotion/react'
import { CssApp, GlobalCssApp } from './managers/style.manager';
import { onKey } from './managers/keys.manager';
import { configClient } from './config';
import { debounce, filter, isNumber, sortBy } from 'lodash';
import { Icon } from './components/Icon.component';
import { getUrlParams, listenToUrlChanges, updateUrl, iUrlParams } from './managers/url.manager';
import { initClipboardListener } from './managers/clipboard.manager';
import { deviceType, MobileView } from './managers/device.manager';
import { DualViewer } from './components/dualView/DualViewer.component';
import { ButtonToolbar } from './components/dualView/NoteToolbar.component';
import { fixScrollToTop } from './managers/fixScroll.manager';


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















  ////////////////////////////////////////////////////////////////////////////////
  //  LIFECYCLE EVENTS
  //////////////////////////////////////////////////////////////////////////////// 
  componentDidMount() {


    fixScrollToTop()

    console.log(`[APP] MOUNTED on a ${deviceType()}`);
    this.toggleSocketConnection(false)
    this.updatePageTitle()

    // initClipboardListener()

    this.initKeyboardShortcuts()

    
    initSocketConnection().then(() => {
      this.toggleSocketConnection(true)

      this.initUrlParamsLogic()

      this.initSearchForContentLinks()

      bindEventManagerToSocketEvents()
      
      // reload file details 
      this.state.activeFileIndex !== -1 && this.loadFileDetails(this.state.activeFileIndex)
      this.askForFolderScan()
      this.setState({ctrlPressed: false})

      this.lastFolderIn = this.state.selectedFolder
      this.lastSearchIn = this.state.searchTerm
      this.listenerIds[0] = socketEventsManager.on(
        socketEvents.getFiles, 
        (data:iSocketEventsParams.getFiles) => {  
          this.onFolderFilesReceived(data)
      })

      this.listenerIds[1] = socketEventsManager.on(
        socketEvents.getFileContent, 
        (data:iSocketEventsParams.getFileContent) => {   
          let activeFile = this.state.files[this.state.activeFileIndex]
          if (data.filePath !== activeFile.path) return
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



  componentDidUpdate(prevProps:any, prevState:any) {
    if (prevState.files !== this.state.files) {
      if (this.state.activeFileIndex !== -1) {
        this.loadFileDetails(this.state.activeFileIndex)
      }
    }
    
    // URL : check if folder/fileIndex/searchTerm changes, if yes, change URL accordingly
    if (
      prevState.activeFileIndex !== this.state.activeFileIndex ||
      prevState.selectedFolder !== this.state.selectedFolder || 
      prevState.isSearching !== this.state.isSearching
    ) this.updateAppUrl()
  }

  componentWillUnmount(){
    this.listenerIds.forEach((id) => {
      socketEventsManager.off(id)
    })
  }














  ////////////////////////////////////////////////////////////////////////////////
  //  SUPPORT FUNCTIONS
  ////////////////////////////////////////////////////////////////////////////////
  intPageBlink:any
  updatePageTitle = () => {
    
    let generateTitle = ():string => {
      let newTitle = ''
      if (window.location.host.includes(configClient.global.frontendPort.toString())) newTitle =  `Extrawurst (PROD ${configClient.version})`
      else newTitle = `/!\\ DEV /!\\`
      return newTitle
    }
  
    let title
    clearInterval(this.intPageBlink)
    if (this.state.isSocketConnected) {
       title =  `${generateTitle()} (Connected)`
    } else {
      let warning1 = '(DISCONNECTED)'
      let warning2 = '(/!\\ DISCONNECTED /!\\)'
      let warning = warning1
      title = `${generateTitle()} ${warning}`
      this.intPageBlink = setInterval(() => {
        warning = (warning === warning1) ? warning2 : warning1
        title = `${generateTitle()} ${warning}`
        document.title = title
      }, 1000)
    }
    
    document.title = title
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
      this.setState({activeFileIndex:-1, activeFileContent: null})
    }
  
    loadFileDetails = (fileIndex:number) => {
      let file = this.state.files[fileIndex]
      
      if (file && file.name.endsWith('.md')) {
        this.setState({activeFileIndex:fileIndex, activeFileContent: null})
        clientSocket.emit(socketEvents.askForFileContent, 
          {filePath: file.path} as iSocketEventsParams.askForFileContent)  
      }
    } 





  //////////////////////////////////////////////
  //  KEYBOARD 
  //
  initKeyboardShortcuts = () => {
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
  }


  //////////////////////////////////////////////
  //  FOLDER LIST LOGIC
  //
  lastFolderIn:string = ''
  lastSearchIn:string = ''
  shouldLoadFirstNote: boolean = false
  onFolderFilesReceived = (data:iSocketEventsParams.getFiles) => {
    // only keep md files in file list
    let files = filter(data.files, {extension: 'md'})

    // sort them
    files = this.sortFiles(files, this.state.sortMode)

    this.setState({
      files,
      isSearching: data.temporaryResults ? true : false
    })

    // if activeFileIndex exists + is in length of files, load it
    if (this.state.activeFileIndex !== -1 && this.state.activeFileIndex < files.length) {
      this.loadFileDetails(this.state.activeFileIndex)
    }

    setTimeout(() => {
      if (this.shouldLoadFirstNote) {
        files.length >= 1 && this.loadFileDetails(0)
        this.shouldLoadFirstNote = false
      }
      // ON LIST ITEMS CHANGES
      if (this.state.selectedFolder !== this.lastFolderIn || this.state.searchTerm !== this.lastSearchIn) {
        
        // Load first item list 
        files.length >= 1 && this.loadFileDetails(0)
        this.lastFolderIn = this.state.selectedFolder
        this.lastSearchIn = this.state.searchTerm
        
        // clean multiselect
        this.cleanMultiSelect()
      }
    }, 100)
  }


  //////////////////////////////////////////////
  //  SEARCH LOGIC
  //
  initSearchForContentLinks = () => {
    //@ts-ignore
    window.ewTriggerSearch = (term:string) => {
      console.log(`[SEARCH FROM LINK] for ${term}`);
      term = term.replaceAll('_','-')
      this.triggerSearch(term)
    }
  }

  triggerSearch = (term:string) => {
    console.log(`[APP -> TRIGGER SEARCH] ${term}`);
    this.emptyFileDetails()
    this.cleanFilesList()
    this.cleanMultiSelect()
    this.setState({ searchTerm: term, isSearching: true, selectedFolder: '', activeFileIndex: -1 })
    clientSocket.emit(socketEvents.searchFor, {term} as iSocketEventsParams.searchFor) 
  }


  //////////////////////////////////////////////
  //  URL LOGIC
  //

  // ignore the first url change when page finishes loading
  ignoreNextUrlChange:boolean = false

  updateAppUrl = debounce(() => {
    if (this.ignoreNextUrlChange) return this.ignoreNextUrlChange = false
    console.log('[UPDATE APP URL]');
    updateUrl ({
      file: this.state.activeFileIndex, 
      folder: this.state.selectedFolder, 
      search: this.state.searchTerm
    })
  }, 200)

  initUrlParamsLogic = () => {

    // do a initial reading when finished loading
    let newUrlParams = getUrlParams()
    this.reactToUrlParams(newUrlParams)

    listenToUrlChanges({
      onUrlParamsChange: (newUrlParams) => {
        // ignore url change due to state change from reaction of initial url change :S
        this.ignoreNextUrlChange = true
        this.reactToUrlParams(newUrlParams)
      },
    })
  }

  reactToUrlParams = (newUrlParams:iUrlParams) => {
    if (newUrlParams.folder) {
      let activeFileIndex = -1
      if (isNumber(newUrlParams.file)) activeFileIndex = newUrlParams.file
      if (activeFileIndex === -1 && this.state.files.length > 0) activeFileIndex = 0
      
      this.setState({selectedFolder: newUrlParams.folder, activeFileIndex, searchTerm: ''})
      this.askForFolderFiles(newUrlParams.folder)
    }
    if (newUrlParams.search) {
      console.log('reactToUrlParams -> triggersearch');
       this.triggerSearch(newUrlParams.search)
    }
    if (newUrlParams.mobileview) {
      this.toggleMobileView(newUrlParams.mobileview)
    }
  }







  ////////////////////////////////////////////////////////////////////////////////
  //  RENDERING
  ////////////////////////////////////////////////////////////////////////////////
  render() { 
    return (
      <CssApp v={this.state.mobileView} >
        <Global styles={GlobalCssApp}  />
        
        <div className="main-wrapper">
              <div className="connection-status">
                  {this.state.isSocketConnected ? <div className="connected">connected</div> : <div className="disconnected">/!\ DISCONNECTED /!\</div>}
              </div>

            { 
              deviceType() !== 'desktop' &&
              <ButtonToolbar
                class='mobile-view-toggler'
                buttons={[
                    {icon: 'faList', action: () => {this.toggleMobileView('navigator')} },
                    {icon: 'faEdit', action: () => {this.toggleMobileView('editor')} },
                    {icon: 'faEye', action: () => {this.toggleMobileView('preview')} },
                ]}
              />
            }


          <div className="left-wrapper">

            {
              /////////////////////////////
              // TREE
              /////////////////////////////
            }
            <div className="left-wrapper-1">
              {/* <TreeView 
                selected={this.state.selectedFolder}
                folder={this.state.folderHierarchy}
                onFolderClicked={(folderpath) => {
                  // if multiselect not empty, prompt user, then move files into that
                  if (this.state.multiSelectMode && this.state.multiSelectArray.length > 0) {
                    this.promptAndBatchMoveFiles(folderpath)
                  } else {
                    // move from selected folder
                    this.shouldLoadFirstNote = true
                    this.setState({selectedFolder: folderpath, searchTerm:'', activeFileIndex: -1})
                    this.cleanAndAskForFolderFiles(folderpath)
                  }
                }}
                onFolderRightClicked = {(folderpath) => {
                  clientSocket.emit(socketEvents.askForExplorer, 
                    {folderpath: folderpath} as iSocketEventsParams.askForExplorer) 
                }}
              /> */}

              
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
                onSearchTermUpdate={(searchTerm, input) => {
                  // if in folder, automatically add /current/path in it
                  if (this.state.searchTerm === '') {
                    searchTerm = searchTerm + ' ' + this.state.selectedFolder
                    if (input) {
                      setTimeout(() => {
                        let newCursorPos = (input.selectionStart || 0) - this.state.selectedFolder.length - 1
                        input.selectionStart = newCursorPos
                        input.selectionEnd = newCursorPos
                      }, 100)
                    }
                  }
                  this.setState({ searchTerm})
                }}
                searchTerm={this.state.searchTerm}
                isSearching={this.state.isSearching}
                isListEmpty={this.state.files.length === 0 ? true : false}
              />


            <div className='list-toolbar'>
            
              { this.state.searchTerm === '' &&
                <button onClick={(e) => {
                    clientSocket.emit(socketEvents.createNote, 
                      {folderPath: this.state.selectedFolder} as iSocketEventsParams.createNote) 
                    this.setState({activeFileIndex: 0})
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
                (this.state.activeFileIndex !== -1 && this.state.files[this.state.activeFileIndex]) && 
                  // < Note 
                  <DualViewer
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
                      this.setState({activeFileIndex: 0})
                    }}
                    onSavingHistoryFile={(filePath, content, historyFileType) => {
                      console.log(`[APP] onSavingHistoryFile ${historyFileType} => ${filePath}`);
                      clientSocket.emit(socketEvents.createHistoryFile, 
                        {filePath, content, historyFileType} as iSocketEventsParams.createHistoryFile)  
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

