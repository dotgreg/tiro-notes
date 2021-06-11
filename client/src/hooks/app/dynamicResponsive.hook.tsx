import { debounce } from "lodash";
import { useEffect, useRef, useState } from "react";

export const useDynamicResponsive = () => {
    const [forceResponsiveRender, setForceResponsiveRender] = useState(false)
    const frr = useRef(0)

    useEffect(() => {
        let debouncedResponsiveRender = debounce(() => {
            frr.current = frr.current+1
            setForceResponsiveRender(true)
            setTimeout(() => {
                setForceResponsiveRender(false)
            }, 200)
        }, 200)

        window.addEventListener('resize', () => {
            debouncedResponsiveRender()
        })

        return () => {

        }
    },[])
    return {forceResponsiveRender, frr}
}