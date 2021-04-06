import React, {  useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { random } from "lodash";
import { useLocalStorage } from './useLocalStorage.hook';
import { addCliCmd } from '../managers/cliConsole.manager';

export const useStatMemo = (el:any, memProps) => {
    const [showRenderId, setShowRenderId] = useLocalStorage('showRenderId', false)

    addCliCmd('toggleRenderId', {
        description: 'toggle display of renderId for each block',
        func: () => {
            console.log('[toggleRenderId]');
            setShowRenderId(!showRenderId)
            setTimeout(() => {window.location.reload()}, 1000)
        }  
    })

    let renderId = random(0,1000)
    // 
    return useMemo(() =>{
        let ti = new Date().getTime()
        var err = new Error();
        var stack = err.stack;
        let name = stack?.split('\n')[6].replace('at ', '').replace(/\(.*\)/gi,'').trim()
        let comp = <>
            { showRenderId &&
                <p style={{
                    position: 'absolute',
                    fontSize: '10px',
                    color: 'rgba(255,0,0,0.8)'
                }}>{renderId}</p>
            }
            {el}
        </>
        let te = new Date().getTime()
        let diff = te-ti
        // console.log(`useStatMemo => new render for ${name} in ${diff}ms ->  renderid ${renderId}`);
        console.log(`useStatMemo => new render for ${name} in ${diff}ms ->  renderid ${renderId}`);

        return comp
    }, memProps)
}