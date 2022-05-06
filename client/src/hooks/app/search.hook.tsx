export {}
// import React, { useEffect, useRef, useState } from 'react';
// import { iAppView, iFile } from '../../../../shared/types.shared';

// import { addCliCmd } from '../../managers/cliConsole.manager';
// import { clientSocket, clientSocket2 } from '../../managers/sockets/socket.manager';
// import { replaceAll } from '../../managers/string.manager';
// import { useStatMemo } from '../useStatMemo.hook';
// import { getLoginToken } from './loginToken.hook';


// export const useAppSearch = (
// 	shouldLoadNoteIndex: any,
// 	cleanListAndFileContent: Function,
// 	currentAppView: iAppView
// ) => {

// 	const [searchTerm, setSearchTerm] = useState('')
// 	const [isSearching, setIsSearching] = useState(false)

// 	addCliCmd('triggerSearch', {
// 		description: 'trigger a search programmatically',
// 		func: (term: string) => {
// 			console.log(`[SEARCH FROM LINK] for ${term}`);
// 			term = replaceAll(term, [['_', '-']])
// 			triggerSearch(term)
// 		}
// 	})

// 	const triggerSearch = (term: string) => {
// 		console.log(`[APP -> TRIGGER SEARCH] with type ${currentAppView} : ${term}`);

// 		setSearchTerm(term)
// 		setIsSearching(true)
// 		shouldLoadNoteIndex.current = 0
// 		clientSocket2.emit('searchFor', { term, token: getLoginToken(), type: currentAppView, idReq: '-' })
// 		cleanListAndFileContent()
// 	}

// 	const SearchBarComponent = (p: {
// 		selectedFolder: string,

// 	}) => useStatMemo(
// 		<SearchBar
// 			onSearchSubmit={() => {
// 				triggerSearch(searchTerm)
// 			}}
// 			onSearchTermUpdate={(newSearchTerm, input) => {
// 				// if in folder, automatically add /current/path in it
// 				if (searchTerm === '' && p.selectedFolder !== '') {
// 					newSearchTerm = newSearchTerm + ' ' + p.selectedFolder
// 					if (input) {
// 						setTimeout(() => {
// 							let newCursorPos = (input.selectionStart || 0) - p.selectedFolder.length - 1
// 							input.selectionStart = newCursorPos
// 							input.selectionEnd = newCursorPos
// 						}, 10)
// 					}
// 				}
// 				setSearchTerm(newSearchTerm)
// 			}}
// 			searchTerm={searchTerm}
// 			isSearching={isSearching}
// 		/>, [searchTerm, p.selectedFolder, isSearching, currentAppView])
// 	return {
// 		isSearching, setIsSearching,
// 		searchTerm, setSearchTerm,
// 		triggerSearch,
// 		SearchBarComponent
// 	}
// } 
