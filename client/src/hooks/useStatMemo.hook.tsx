import React, {  useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { random } from "lodash";

export const useStatMemo = (el:any, memProps) => {
    let renderId = random(0,1000)
    // 
    return useMemo(() =>{
        let ti = new Date().getTime()
        var err = new Error();
        var stack = err.stack;
        let name = stack?.split('\n')[6].replace('at ', '').replace(/\(.*\)/gi,'').trim()
        let comp = <>
            <p style={{
                position: 'absolute',
                fontSize: '10px',
                color: 'rgba(255,0,0,0.8)'
            }}>{renderId}</p>
            {el}
        </>
        let te = new Date().getTime()
        let diff = te-ti
        // console.log(`useStatMemo => new render for ${name} in ${diff}ms ->  renderid ${renderId}`);
        console.log(`useStatMemo => new render for ${name} in ${diff}ms ->  renderid ${renderId}`);

        return comp
    }, memProps)
}