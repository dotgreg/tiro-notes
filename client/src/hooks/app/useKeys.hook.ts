import { useEffect, useState } from "react"
import { iFile } from "../../../../shared/types.shared"
import { onKey } from "../../managers/keys.manager"

export const useKeys = (p: {
    onKeyDown: (e:any) => void,
    onKeyUp: (e:any) => void
}) => {
    const [ctrlPressed, setCtrlPressed] = useState(false)
    const [shiftPressed, setShiftPressed] = useState(false)

    useEffect(() => {
        window.onkeydown = (e:any) => {
            p.onKeyDown(e)
            onKey(e, 'ctrl', () => {
                setCtrlPressed(true)
            })
            onKey(e, 'shift', () => {
                setShiftPressed(true)
            })
        }
        window.onkeyup = (e:any) => {
            p.onKeyUp(e)
            onKey(e, 'ctrl', () => {
                setCtrlPressed(false)
            })
            onKey(e, 'shift', () => {
                setShiftPressed(false)
            })
        }
    })

    return {
        ctrlPressed, setCtrlPressed,
        shiftPressed, setShiftPressed,
    }
}
