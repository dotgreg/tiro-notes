import React from 'react';
import styled from '@emotion/styled'
import { iFile } from '../../../shared/types.shared';
import { isNumber, max } from 'lodash';
import { getAllNumbersBetween, removeFromNumberArray } from '../managers/math.manager';
import { formatDateList } from '../managers/date.manager';

export type SortMode = 'none' | 'alphabetical' | 'created' | 'modified'
export const SortModesLabels = ['none','Az','Crea','Modif']
export const SortModes = ['none','alphabetical','created','modified']
// export const SortModeArr = ['none','alphabetical','created','modified']

export class List extends React.Component<{
    files:iFile[]
    activeFileIndex:number
    hoverMode:boolean
    sortMode:number
    ctrlPressed:boolean
    multiSelectMode:boolean
    multiSelectArray:number[]
    onFileClicked: (fileIndex:number) => void
    onMultiSelectChange: (selectionArr:number[]) => void
}, {
}> {

    constructor(props:any) {
        super(props)
        this.state = {
          hoverMode: false,
        }
    }
    
    
    
    render() {
        let sort = SortModes[this.props.sortMode]
      return (
        <StyledWrapper>
            
            <ul>
                {
                    this.props.files.map( (file,key) => 
                        <li 
                            className={key === this.props.activeFileIndex ? 'active' : ''}
                            key={key}
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
                        </li>    
                    )
                }
            </ul>
        </StyledWrapper>
      );
    }
  }
  
  const StyledWrapper  = styled.div`
    
    
  `