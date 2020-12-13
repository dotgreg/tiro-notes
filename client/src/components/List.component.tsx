import React from 'react';
import styled from '@emotion/styled'
import { iFile } from '../../../shared/types.shared';

export class List extends React.Component<{
    files:iFile[]
    onFileClicked: (file:iFile) => void
}, {
    hoverMode:boolean
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
            <input 
                type="button" 
                value={this.state.hoverMode ? 'Hover : ON' : 'Hover : OFF'} 
                onClick={e => this.setState({hoverMode: !this.state.hoverMode})}
            />
            <ul>
                {
                    this.props.files.map( file => 
                        <li 
                            onClick={(e) => { this.props.onFileClicked(file) }}
                            
                        > 
                            <span onMouseEnter={(e) => { this.state.hoverMode && this.props.onFileClicked(file) }}>{file.name}</span> 
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