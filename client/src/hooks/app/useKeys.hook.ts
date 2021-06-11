import { useEffect, useRef, useState } from "react"
import { iFile } from "../../../../shared/types.shared"
import { onKey } from "../../managers/keys.manager"

export const useKeys = (p: {
    activeFileIndex:number, 
    onKeyDown: (e:any) => void,
    onKeyUp: (e:any) => void
}) => {
    const [shiftPressed, setShiftPressed] = useState(false)
    // const [altPressed, setAltPressed] = useState(false)
    const altPressed = useRef(false)
    const ctrlPressed = useRef(false)

    useEffect(() => {
        window.onkeydown = (e:any) => {
            p.onKeyDown(e)
            onKey(e, 'ctrl', () => { ctrlPressed.current = true })
            onKey(e, 'shift', () => { setShiftPressed(true) })
            onKey(e, 'alt', () => {  altPressed.current = true })
        }
        window.onkeyup = (e:any) => {
            p.onKeyUp(e)
            onKey(e, 'ctrl', () => { ctrlPressed.current = false })
            onKey(e, 'shift', () => { setShiftPressed(false) })
            onKey(e, 'alt', () => {  altPressed.current = false })
        }
        return () => {

        }
    }, [p.activeFileIndex])

    return {
        ctrlPressed,
        shiftPressed, setShiftPressed,
        altPressed
    }
}
