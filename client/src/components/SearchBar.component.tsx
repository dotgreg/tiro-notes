import React from 'react';
import styled from '@emotion/styled'

export class SearchBar extends React.Component<{
    onSearchSubmit: (term:string) => void
    isSearching: boolean
    isListEmpty: boolean
}, {
    search: string
}> {

    constructor(props:any) {
        super(props)
        this.state = {
            search:'',
        }
    }
    render() {
      return (
        <>
            <div className="search-input">
                <input 
                    type="text" 
                    value={this.state.search}
                    onChange={(e) => {this.setState({search: e.target.value})}}
                />
                <button onClick={(e) => {
                    if (this.state.search.length < 3) return
                    this.props.onSearchSubmit(this.state.search)
                }}>submit</button>
            </div>
            <div className="search-status">
                {this.props.isSearching && 'searching...'}
                {this.props.isListEmpty && 'no result'}
            </div>
        </>
      );
    }
  }
  
  const StyledWrapper  = styled.div`
    padding: 10px;
    
  `