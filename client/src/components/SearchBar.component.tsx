import React from 'react';
import styled from '@emotion/styled'

export class SearchBar extends React.Component<{
    isSearching: boolean
    isListEmpty: boolean
    searchTerm: string
    onSearchTermUpdate: (term:string) => void
    onSearchSubmit: () => void
}, {
    // search: string
}> {

    constructor(props:any) {
        super(props)
        this.state = {
            search:'',
        }
    }
    submitOnEnter = (event:any) => {
        if (event.key === 'Enter') {
            console.log('do validate')
            if (this.props.searchTerm.length < 3) return
            this.props.onSearchSubmit()
        }
    }
    render() {
      return (
        <>
            <div className="search-input">
                <input 
                    type="text" 
                    value={this.props.searchTerm}
                    onKeyDown={this.submitOnEnter}
                    onChange={(e) => {
                        this.props.onSearchTermUpdate(e.target.value)
                    }}
                />
                {/* <button onClick={(e) => {
                    if (this.state.search.length < 3) return
                    this.props.onSearchSubmit(this.state.search)
                }}>submit</button> */}
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
    
  `