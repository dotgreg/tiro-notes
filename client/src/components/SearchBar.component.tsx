import React, { Ref, useContext } from 'react';
import { ClientApiContext } from '../hooks/api/api.hook';
import { strings } from '../managers/strings.manager';
import { cssVars } from '../managers/style/vars.style.manager';


export const SearchBar2 = (p: {
	term: string
}) => {



	const api = useContext(ClientApiContext)

	const submitOnEnter = (event: any) => {
		if (event.key === 'Enter') {
			if (p.term.length < 3) return
			api && api.ui.search.search(p.term)
		}
	}

	const onChange = (nVal: string, input: any) => {
		if (!api) return
		const selectedFolder = api.ui.browser.folders.current.get()
		// if in folder, automatically add /current/path in it
		if (p.term === '' && selectedFolder !== '') {
			nVal = nVal + ' ' + selectedFolder
			if (input) {
				setTimeout(() => {
					let newCursorPos = (input.selectionStart || 0) - selectedFolder.length - 1
					input.selectionStart = newCursorPos
					input.selectionEnd = newCursorPos
				}, 10)
			}
		}
		api.ui.search.term.set(nVal)
	}

	const isSearching = api ? api.status.searching.get : false


	return (//jsx
		<>
			<div className="search-bar-component">
				<input
					type="text"
					placeholder={strings.searchPlaceholder}
					value={p.term}
					onKeyDown={submitOnEnter}
					onChange={(e) => {
						onChange(e.target.value, e.target)
					}}
				/>
				<div className="search-status">
					{isSearching && strings.searchingLabel}
				</div>
			</div>
		</>
	)//jsx
}




export const searchBarCss = () => `
.search-bar-component {
    input {
				border-radius: 5px;
        width: calc(100% - ${cssVars.sizes.block * 2 + 20}px);
        border: none;
        background: white;
				padding: 18px 9px;
				margin: 0px 15px 15px 15px;
				box-shadow: 0px 0px 6px rgb(0 0 0 / 5%);
				font-size: 11px;
        margin: 0px ${cssVars.sizes.block}px ${cssVars.sizes.block}px ${cssVars.sizes.block}px; 
        &::placeholder {
            color: #afadad;
        }
    }
    .search-status {
        text-align: center;
        font-size: 8px;
				position: relative;
				bottom:9px;
				color: grey;
    }
}
`
