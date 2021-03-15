import React from 'react';
import styled from '@emotion/styled'
import { iFile, iFilePreview } from '../../../shared/types.shared';
import { cloneDeep, debounce, isEqual, isNumber, max } from 'lodash';
import { getAllNumbersBetween, removeFromNumberArray } from '../managers/math.manager';
import { formatDateList } from '../managers/date.manager';
import { FilesPreviewObject } from '../hooks/app/filesList.hook';
import { absoluteLinkPathRoot } from '../managers/textProcessor.manager';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

export type SortMode =  'alphabetical' | 'created' | 'modified'
export const SortModesLabels = ['Az','Crea','Modif']
export const SortModes = ['alphabetical','created','modified']

// export const SortModeArr = ['none','alphabetical','created','modified']
export type onFileDragStartFn = (files:iFile[])=>void

export class List extends React.Component<{
    files:iFile[]
    filesPreview:FilesPreviewObject

    activeFileIndex:number
    hoverMode:boolean
    sortMode:number
    modifierPressed:boolean

    onFileClicked: (fileIndex:number) => void
    onVisibleItemsChange: (visibleFilesPath:string[]) => void
    onFileDragStart: onFileDragStartFn
    onFileDragEnd: ()=>void
}, {
    hoverMode:boolean,
    selectionEdges: [number,number]
}> {

    constructor(props:any) {
        super(props)
        this.state = {
          hoverMode: false,
          selectionEdges: [-1,-1],
        }
    }
    

    oldFiles:iFile[] = []
    liRefs:any[] = []
    scrollerWrapperRef:any = React.createRef()
    shouldComponentUpdate(props:any, nextProps:any) {
        if (JSON.stringify(props.files) !== JSON.stringify(this.oldFiles)) {
            this.oldFiles = cloneDeep(props.files)
            console.log('[LIST] FILES BEEN UPDATED BRO');
            this.liRefs = []
            for (let i = 0; i < props.files.length; i++) {
                this.liRefs.push(React.createRef())
            }
            this.getVisibleItemsDebounced()

            this.setState({selectionEdges:[-1,-1]})
        }
        return true
    }

    getVisibleItemsDebounced = debounce(() => {
        let wrapper = this.scrollerWrapperRef.current
        if (!wrapper) return
        let wrapperHeight = wrapper.getBoundingClientRect().height

        let visibleFilesPath:string[] = []
        for (let i = 0; i < this.liRefs.length; i++) {
            let el = this.liRefs[i].current
            
            if (el) {
                let elTop = el.getBoundingClientRect().top
                // adding some margin, notably after for smoother view
                if (elTop > -50 && elTop < wrapperHeight + 100) {
                    this.props.files[i] && visibleFilesPath.push(this.props.files[i]?.path)
                }
            }
        }

        // console.log('[LIST]', visibleFilesPath);
        this.props.onVisibleItemsChange(visibleFilesPath)
    }, 500)
    onListScroll = () => {
        console.log('onListScroll');
        
        this.getVisibleItemsDebounced()
    }
    
    
    isMultiSelected = (i:number):boolean => {
        if (
            this.state.selectionEdges[0] <= i &&
            this.state.selectionEdges[1] >= i 
        ) return true
        return false
    }

    render() {
        let sort = SortModes[this.props.sortMode]
        

      return (
        <div 
            className='list-wrapper-scroller'
            onScroll={this.onListScroll}
            ref={this.scrollerWrapperRef}
        >

        <AutoSizer>{({height, width}) => ( 
            <FixedSizeList 
                itemData={this.props.files}
                className="List"
                height={height}
                itemCount={this.props.files.length}
                itemSize={60}
                width={width}
                onScroll={this.onListScroll}
            >
                {({ index, style }) => 
                {
                    let file = this.props.files[index]
                    return (
                        <div style={style}>
                            <li 
                                ref={this.liRefs[index]}
                                className={[
                                    'file-element-list', 
                                    `element-${index}`,
                                    `${this.isMultiSelected(index) ? 'multiselected' : ''}`,
                                    `${index === this.props.activeFileIndex ? 'active' : ''}`
                                ].join(' ')}
                                key={index}
                                draggable={true}
                                onDragStart={() => {
                                    let files:iFile[] = []
                                    let selec = this.state.selectionEdges
                                    if (selec[0] !== -1 || selec[1] !== -1) {
                                        files = this.props.files.slice(selec[0],selec[1]+1)
                                    } else {
                                        files = [file]
                                    }
                                    this.props.onFileDragStart(files)
                                }}
                                onDragEnd={() => {
                                    this.props.onFileDragEnd()
                                }}
                                onClick={(e) => { 
                                    if (this.props.modifierPressed) {
                                        let edges:[number,number] = [this.props.activeFileIndex, index]
                                        edges.sort()

                                        console.log(`[MULTIARR]`, edges);
                                        this.setState({selectionEdges:edges})
                                        
                                    } else {
                                        this.props.onFileClicked(index) 
                                        this.setState({selectionEdges:[-1,-1]})
                                    }
                                    
                                }}
                            > 
                                
                                <span 
                                    className='label'
                                    onMouseEnter={(e) => { 
                                        this.props.hoverMode && this.props.onFileClicked(index) 
                                    }}>
                                    {file.name} 
                                </span> 
                                <span className={`date ${sort}`} >
                                        {formatDateList(
                                            new Date( 
                                                (sort === 'modified' ? file.modified : file.created)  || 0
                                            )
                                        )}
                                </span> 
                                { 
                                    this.props.filesPreview[file.path] &&
                                    <div className={`preview ${this.props.filesPreview[file.path].picture ? 'with-image':''}`}>
                                        {
                                            this.props.filesPreview[file.path].content && 
                                            <div className="content">{this.props.filesPreview[file.path].content}</div>
                                        }
                                        {
                                            this.props.filesPreview[file.path].picture && 
                                            <div 
                                                className="picture"
                                                style={{
                                                    backgroundColor: 'white',
                                                    backgroundImage:`url('${absoluteLinkPathRoot(this.props.files[0].folder)}/${this.props.filesPreview[file.path].picture}')`
                                                }}
                                            >
                                            </div>
                                        }
                                    </div>
                                }
                            </li>  
                        </div>
                    )}
                }
            </FixedSizeList>)}
            </AutoSizer>


            {/* <ul className={``}>
                {
                    this.props.files.map( (file,key) => 
                        <>
                            <li 
                                ref={this.liRefs[key]}
                                className={[
                                    'file-element-list', 
                                    `element-${key}`,
                                    `${this.isMultiSelected(key) ? 'multiselected' : ''}`,
                                    `${key === this.props.activeFileIndex ? 'active' : ''}`
                                ].join(' ')}
                                key={key}
                                draggable={true}
                                onDragStart={() => {
                                    let files:iFile[] = []
                                    let selec = this.state.selectionEdges
                                    if (selec[0] !== -1 || selec[1] !== -1) {
                                        files = this.props.files.slice(selec[0],selec[1]+1)
                                    } else {
                                        files = [file]
                                    }
                                    this.props.onFileDragStart(files)
                                }}
                                onDragEnd={() => {
                                    this.props.onFileDragEnd()
                                }}
                                onClick={(e) => { 
                                    if (this.props.modifierPressed) {
                                        let edges:[number,number] = [this.props.activeFileIndex, key]
                                        edges.sort()

                                        console.log(`[MULTIARR]`, edges);
                                        this.setState({selectionEdges:edges})
                                        
                                    } else {
                                        this.props.onFileClicked(key) 
                                        this.setState({selectionEdges:[-1,-1]})
                                    }
                                    
                                }}
                            > 
                                
                                <span 
                                    className='label'
                                    onMouseEnter={(e) => { 
                                        this.props.hoverMode && this.props.onFileClicked(key) 
                                    }}>
                                    {file.name} 
                                </span> 
                                <span className={`date ${sort}`} >
                                        {formatDateList(
                                            new Date( 
                                                (sort === 'modified' ? file.modified : file.created)  || 0
                                            )
                                        )}
                                </span> 
                                { 
                                    this.props.filesPreview[file.path] &&
                                    <div className={`preview ${this.props.filesPreview[file.path].picture ? 'with-image':''}`}>
                                        {
                                            this.props.filesPreview[file.path].content && 
                                            <div className="content">{this.props.filesPreview[file.path].content}</div>
                                        }
                                        {
                                            this.props.filesPreview[file.path].picture && 
                                            <div 
                                                className="picture"
                                                style={{
                                                    backgroundColor: 'white',
                                                    backgroundImage:`url('${absoluteLinkPathRoot(this.props.files[0].folder)}/${this.props.filesPreview[file.path].picture}')`
                                                }}
                                            >
                                            </div>
                                        }
                                    </div>
                                }
                            </li>    
                        </>
                    )
                }
            </ul> */}
        </div>
      );
    }
  }
  
  const StyledWrapper  = styled.div`
    
    
  `