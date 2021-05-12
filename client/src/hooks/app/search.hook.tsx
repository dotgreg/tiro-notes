import React, {  useEffect, useRef, useState } from 'react';
import { iFile } from '../../../../shared/types.shared';
import { SearchBar } from '../../components/SearchBar.component';
import { addCliCmd } from '../../managers/cliConsole.manager';
import { clientSocket, clientSocket2 } from '../../managers/sockets/socket.manager';
import { replaceAll } from '../../managers/string.manager';
import { useStatMemo } from '../useStatMemo.hook';
import { getLoginToken } from './loginToken.hook';


export const useAppSearch = (
    shouldLoadNoteIndex: any,
    cleanListAndFileContent:Function,
) => {
    
    const [searchTerm, setSearchTerm] = useState('')
    const [isSearching, setIsSearching] = useState(false)

    addCliCmd('triggerSearch', {
        description: 'trigger a search programmatically',
        func: (term:string) => {
            console.log(`[SEARCH FROM LINK] for ${term}`);
            term =  replaceAll(term, [['_','-']])
            triggerSearch(term)
        }
    })
    // useEffect(() => {
    //     //@ts-ignore
    //     window.ewTriggerSearch = (term:string) => {
    //       console.log(`[SEARCH FROM LINK] for ${term}`);
    //       term =  replaceAll(term, [['_','-']])
    //       triggerSearch(term)
    //     }
    // }, [])
    
    const triggerSearch = (term:string) => {
        console.log(`[APP -> TRIGGER SEARCH] ${term}`);

        setSearchTerm(term)
        setIsSearching(true)
        shouldLoadNoteIndex.current = 0
        clientSocket2.emit('searchFor', {term, token: getLoginToken()}) 
        cleanListAndFileContent()
    }

    const SearchBarComponent = (
        selectedFolder:string, 
        files:iFile[],
    ) => useStatMemo( 
        <SearchBar
            onSearchSubmit={() => {
                triggerSearch(searchTerm)
            }}
            onSearchTermUpdate={(newSearchTerm, input) => {
                // if in folder, automatically add /current/path in it
                if (searchTerm === '' && selectedFolder !=='') {
                    newSearchTerm = newSearchTerm + ' ' + selectedFolder
                    if (input) {
                        setTimeout(() => {
                            let newCursorPos = (input.selectionStart || 0) - selectedFolder.length - 1
                            input.selectionStart = newCursorPos
                            input.selectionEnd = newCursorPos
                        }, 100)
                    }
                }
                setSearchTerm(newSearchTerm)
            }}
            searchTerm={searchTerm}
            isSearching={isSearching}
            isListEmpty={files.length === 0 ? true : false}
        />, [searchTerm, selectedFolder, files, isSearching])
    return {
        isSearching, setIsSearching, 
        searchTerm, setSearchTerm,
        triggerSearch,
        SearchBarComponent
    }
} 