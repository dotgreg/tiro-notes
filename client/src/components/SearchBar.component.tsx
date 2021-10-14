import React, { Ref } from 'react';
import styled from '@emotion/styled'
import { strings } from '../managers/strings.manager';
import { cssVars } from '../managers/style/vars.style.manager';

export class SearchBar extends React.Component<{
    isSearching: boolean
    searchTerm: string
    onSearchTermUpdate: (term:string, inputEl:HTMLInputElement|null) => void
    onSearchSubmit: () => void
}, {
    // search: string
}> {

    inputRef:Ref<HTMLInputElement>
    constructor(props:any) {
        super(props)
        this.state = {
            search:'',
        }
        this.inputRef = React.createRef()
    }
    submitOnEnter = (event:any) => {
        if (event.key === 'Enter') {
            if (this.props.searchTerm.length < 3) return
            this.props.onSearchSubmit()
        }
    }
    render() {
      return (
        <>
            <div className="search-bar-component">
                <input 
                    type="text" 
                    placeholder={strings.searchPlaceholder}
                    ref={this.inputRef}
                    value={this.props.searchTerm}
                    onKeyDown={this.submitOnEnter}
                    onChange={(e) => {
                        this.props.onSearchTermUpdate(e.target.value, e.target)
                    }}
                />
            </div>
            <div className="search-status">
                {this.props.isSearching && strings.searchingLabel}
            </div>
        </>
      );
    }
  }
  
  export const searchBarCss  = `
    .search-bar-component {
        input {
        ${cssVars.other.radius}
        width: calc(100% - ${cssVars.sizes.block*2+20}px);
        border: none;
        background: white;
        padding:14px 10px;
        margin: 0px ${cssVars.sizes.block}px ${cssVars.sizes.block}px ${cssVars.sizes.block}px; 
        &::placeholder {
            color: #afadad;
        }
        }
    }
  `