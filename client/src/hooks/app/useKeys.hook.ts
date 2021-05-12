import { useEffect, useRef, useState } from "react"
import { iFile } from "../../../../shared/types.shared"
import { onKey } from "../../managers/keys.manager"

export const useKeys = (p: {
    onKeyDown: (e:any) => void,
    onKeyUp: (e:any) => void
}) => {
    const [ctrlPressed, setCtrlPressed] = useState(false)
    const [shiftPressed, setShiftPressed] = useState(false)
    // const [altPressed, setAltPressed] = useState(false)
    const altPressed = useRef(false)

    useEffect(() => {
        window.onkeydown = (e:any) => {
            p.onKeyDown(e)
            onKey(e, 'ctrl', () => { setCtrlPressed(true) })
            onKey(e, 'shift', () => { setShiftPressed(true) })
            onKey(e, 'alt', () => { 
                altPressed.current = true
                console.log('alt1', altPressed.current);
            })
        }
        window.onkeyup = (e:any) => {
            p.onKeyUp(e)
            onKey(e, 'ctrl', () => { setCtrlPressed(false) })
            onKey(e, 'shift', () => { setShiftPressed(false) })
            onKey(e, 'alt', () => { 
                altPressed.current = false 
                console.log('alt2', altPressed.current);
            })
        }

        // if window loses focus, remove all modifiers
        // window.addEventListener("visibilitychange", e => {
        //     console.log('alt3 visibilitychange', e);
        // });
    }, [])

    return {
        ctrlPressed, setCtrlPressed,
        shiftPressed, setShiftPressed,
        altPressed
    }
}
