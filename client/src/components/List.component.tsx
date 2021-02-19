import React from 'react';
import styled from '@emotion/styled'
import { iFile, iFilePreview } from '../../../shared/types.shared';
import { cloneDeep, debounce, isNumber, max } from 'lodash';
import { getAllNumbersBetween, removeFromNumberArray } from '../managers/math.manager';
import { formatDateList } from '../managers/date.manager';
import { FilesPreviewObject } from '../hooks/app/filesList.hook';
import { absoluteLinkPathRoot } from '../managers/textProcessor.manager';

export type SortMode = 'none' | 'alphabetical' | 'created' | 'modified'
export const SortModesLabels = ['none','Az','Crea','Modif']
export const SortModes = ['none','alphabetical','created','modified']
// export const SortModeArr = ['none','alphabetical','created','modified']

export class List extends React.Component<{
    files:iFile[]
    filesPreview:FilesPreviewObject

    activeFileIndex:number
    hoverMode:boolean
    sortMode:number
    ctrlPressed:boolean
    multiSelectMode:boolean
    multiSelectArray:number[]

    onFileClicked: (fileIndex:number) => void
    onMultiSelectChange: (selectionArr:number[]) => void
    onVisibleItemsChange: (visibleFilesPath:string[]) => void
}, {
}> {

    constructor(props:any) {
        super(props)
        this.state = {
          hoverMode: false,
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
                if (i === 0) console.log(334, this.props.files[i], el.getBoundingClientRect().top, el.innerHTML);
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
    
    
    render() {
        let sort = SortModes[this.props.sortMode]
        console.log('[MU list rerender', this.props.multiSelectArray);
        

      return (
        <div 
            className='list-wrapper-scroller'
            onScroll={this.onListScroll}
            ref={this.scrollerWrapperRef}
        >
            
            <ul className={`${this.props.multiSelectMode ? 'multiselect-mode' : ''}`}>
                {
                    this.props.files.map( (file,key) => 
                        <li 
                            ref={this.liRefs[key]}
                            className={`file-element-list element-${key} ${key === this.props.activeFileIndex ? 'active' : ''}`}
                            key={key}
                            draggable={true}
                            onClick={(e) => { this.props.onFileClicked(key) }}
                        > 
                            <span className='checkbox'>
                                {
                                    this.props.multiSelectMode &&
                                    <input 
                                        type="checkbox" 
                                        checked={this.props.multiSelectArray.includes(key)} 
                                        onChange={e => {
                                            let arr = this.props.multiSelectArray
                                            
                                            if (!this.props.multiSelectArray.includes(key)) {
                                                let maxVal = max(arr) || 0
                                                console.log(1,  key, maxVal);
                                                if (this.props.ctrlPressed) {
                                                    if (isNumber(maxVal) && maxVal < key) { 
                                                        arr.push(...getAllNumbersBetween(maxVal, key))
                                                        // console.log(2, getAllNumbersBetween(key, maxVal), key, maxVal);
                                                    }
                                                } 
                                                arr.push(key)
                                            } else {
                                                arr = removeFromNumberArray(arr, key)
                                            }
                                            console.log(`[MULTI] `,arr);
                                            
                                            this.props.onMultiSelectChange(arr)
                                        }} 
                                    />
                                }
                            </span>
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
                    )
                }
            </ul>
        </div>
      );
    }
  }
  
  const StyledWrapper  = styled.div`
    
    
  `