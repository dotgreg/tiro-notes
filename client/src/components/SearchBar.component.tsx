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

		}
	}


	const onChange = (nVal: string, input: any) => {
		if (!api) return
		const selectedFolder = api.ui.browser.folders.current.get
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
				</div>
			</div>
		</>
	)//jsx
}


					//p.isSearching && strings.searchingLabel}


export const searchBarCss = `
    .search-bar-component {
        input {
            ${cssVars.other.radius}
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
        }
    }
`


// export class SearchBar extends React.Component<{
// 	isSearching: boolean
// 	searchTerm: string
// 	onSearchTermUpdate: (term: string, inputEl: HTMLInputElement | null) => void
// 	onSearchSubmit: () => void
// }, {
// 	// search: string
// }> {
// 	inputRef: Ref<HTMLInputElement>
// 	constructor(props: any) {
// 		super(props)
// 		this.state = {
// 			search: '',
// 		}
// 		this.inputRef = React.createRef()
// 	}
// 	submitOnEnter = (event: any) => {
// 		if (event.key === 'Enter') {
// 			if (this.props.searchTerm.length < 3) return
// 			this.props.onSearchSubmit()
// 		}
// 	}
// 	render() {
// 		return (
// 			<>
// 				<div className="search-bar-component">
// 					<input
// 						type="text"
// 						placeholder={strings.searchPlaceholder}
// 						ref={this.inputRef}
// 						value={this.props.searchTerm}
// 						onKeyDown={this.submitOnEnter}
// 						onChange={(e) => {
// 							this.props.onSearchTermUpdate(e.target.value, e.target)
// 						}}
// 					/>
// 					<div className="search-status">
// 						{this.props.isSearching && strings.searchingLabel}
// 					</div>
// 				</div>
// 			</>
// 		);
// 	}
// }
