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
import { cssVars } from '../managers/style/vars.style.manager';
import { deviceType, isA } from '../managers/device.manager';

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
    scrollerListRef:any = React.createRef()
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
        this.getVisibleItemsDebounced()
    }
    
    
    isMultiSelected = (i:number):boolean => {
        if (
            this.state.selectionEdges[0] <= i &&
            this.state.selectionEdges[1] >= i 
        ) return true
        return false
    }

    itemToScroll:number = 0
    scrollToItem = (nb:number, isAbs=true) => {
        this.itemToScroll = isAbs ? nb : this.itemToScroll + nb
        if (this.itemToScroll < 0 ) this.itemToScroll = 0
        if (this.itemToScroll > this.props.files.length ) this.itemToScroll = this.props.files.length
        this.scrollerListRef.current.scrollToItem(this.itemToScroll)
    }

    render() {
        let sort = SortModes[this.props.sortMode]
        const itemSize = cssVars.sizes.l2.fileLi.height + (cssVars.sizes.l2.fileLi.padding * 2) + (cssVars.sizes.l2.fileLi.margin)
        const listHeight = window.innerHeight - (cssVars.sizes.search.h + cssVars.sizes.search.padding)
        const responsiveListHeight = isA('desktop') ? listHeight : listHeight - cssVars.sizes.mobile.bottomBarHeight
      return (
        <>
        { 
            deviceType() !== 'desktop' &&
            <div className="mobile-buttons-up-down">
                <div id="top" onClick={() => {  this.scrollToItem(0, false)  }}>=</div>
                <div id="up" onClick={() => {  this.scrollToItem(-5, false) }}>^</div>
                <div id="down" onClick={() => { this.scrollToItem(5, false) }}>v</div>
            </div>
        }
        
        <div 
            className='list-wrapper-scroller'
            style={{height:responsiveListHeight}}
            onScroll={this.onListScroll}
            ref={this.scrollerWrapperRef}
        >

        

        <AutoSizer>{({height, width}) => ( 
            <FixedSizeList 
                itemData={this.props.files}
                className="List"
                ref={this.scrollerListRef}
                height={responsiveListHeight}
                itemCount={this.props.files.length}
                itemSize={itemSize}
                width={width}
                onScroll={this.onListScroll}
            >
                {({ index, style }) => 
                {
                    let file = this.props.files[index]
                    let filePreview = this.props.filesPreview[file.path]
                    return (
                        <div style={style}>
                            <li 
                                ref={this.liRefs[index]}
                                style={{width: width - (sizes.l2.fileLi.padding*2) - (sizes.l2.fileLi.margin*2) - 35}}
                                className={[
                                    'file-element-list', 
                                    `element-${index}`,
                                    `${this.isMultiSelected(index) ? 'multiselected' : ''}`,
                                    `${index === this.props.activeFileIndex ? 'active' : ''}`,
                                    `${filePreview && filePreview.picture ? 'with-image':''}`
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
                                <div className="left">
                                    <h3 
                                        className='label'
                                        onMouseEnter={(e) => { 
                                            this.props.hoverMode && this.props.onFileClicked(index) 
                                        }}>
                                        {file.name} 
                                    </h3> 
                                    <div className="content">
                                    { 
                                        (filePreview && filePreview.content) &&
                                            <>{filePreview.content}</>
                                    }

                                    </div>
                                    <div className={`date ${sort}`} >
                                            {formatDateList(
                                                new Date( 
                                                    (sort === 'modified' ? file.modified : file.created)  || 0
                                                )
                                            )}
                                    </div> 
                                </div>
                                <div className="right">
                                    { 
                                        (filePreview && filePreview.picture) && 
                                        <div 
                                            className="picture"
                                            style={{
                                                backgroundColor: 'white',
                                                backgroundImage:`url('${ filePreview.picture.startsWith('http') ? filePreview.picture : absoluteLinkPathRoot(this.props.files[0].folder)}/${filePreview.picture}')`
                                            }}
                                        >
                                        </div>
                                    }
                                </div>
                                
                                
                            </li>  
                        </div>
                    )}
                }
            </FixedSizeList>)}
            </AutoSizer>
        </div>
        </>
      );
    }
  }
  
  const StyledWrapper  = styled.div`
    
    
  `

  const {els,colors,font,sizes, other } = {...cssVars}
  export const filesListCss = `
  .list-wrapper {
    .list-wrapper-scroller{
        height: 100%;
        width: calc(100% + 20px);
        overflow-y:scroll;
        overflow: hidden;
    }

    .mobile-buttons-up-down {
        position: fixed;
        right: 0px;
        z-index: 10;
        top: 50%;
        div {
            background: #d6d6d6;
            padding: 10px;
            color:white;
            cursor: pointer;
        }
    }

    div.List {
        list-style: none;
        margin-right:20px;
        padding: 0px 0px 0px 0px;
        &.multiselect-mode {
          li .label {
            margin-left: 4px;
          }
        }

        // NORMAL
        li {
            padding: ${sizes.l2.fileLi.padding}px ${sizes.block-sizes.l2.fileLi.margin}px;
            margin: ${sizes.l2.fileLi.margin}px ${sizes.l2.fileLi.margin + 5}px ${sizes.l2.fileLi.margin}px ${sizes.l2.fileLi.margin}px ;
            display: block;
            cursor: pointer;
            position: relative;
            height: ${sizes.l2.fileLi.height}px;
            overflow: hidden;
            border: 2px rgba(0,0,0,0) solid;
            
            // ACTIVE
            &:hover,
            &.multiselected,
            &.active  {
              background: rgba(${colors.mainRGB},0.1);
              border-radius: 5px;
              border: 2px rgba(${colors.mainRGB},0.3) solid;
            }

            display: flex;
            justify-content: center;
            
            .left {
              // width: calc(100% - ${sizes.l2.fileLi.img}px - 10px);
              width: 100%;
              padding-right: 10px;

              display:flex;
              flex-direction:column;

              .label {
                margin: 0px;
                max-height: 35px;
                margin-bottom: 2px;
                overflow: hidden;
                color: ${colors.l2.title};
                line-break: anywhere;
              }
              
              .content {
                color: grey;
                margin-bottom: 3px;
                font-size: 9px;
                overflow: hidden;
                line-break: anywhere;
                word-break: break-all;
                ${isA('desktop') ? '' : 'max-height: 25px;'}
              }

              .date {
                color: ${colors.l2.date};
                font-size: 10px;
                font-weight: 700;
              }
            }

            .right {
              .picture {
                width: ${sizes.l2.fileLi.img}px;
                height: ${sizes.l2.fileLi.img}px;
                background-size: cover;
                z-index: 1;
                margin-top: 3px;
                border-radius: 5px;
                border: 2px white solid;
              }
            }
        }
    }
  }
  `