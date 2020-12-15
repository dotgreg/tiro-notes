import React from 'react';
import styled from '@emotion/styled'
import { iFile } from '../../../shared/types.shared';

export class List extends React.Component<{
    files:iFile[]
    activeFileIndex:number
    hoverMode:boolean
    onFileClicked: (fileIndex:number) => void
}, {
}> {

    constructor(props:any) {
        super(props)
        this.state = {
          hoverMode: false,
        }
    }
    render() {
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
                            <span onMouseEnter={(e) => { 
                                this.props.hoverMode && this.props.onFileClicked(key) 
                            }}>{file.name}</span> 
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