import { useEffect } from "react";
import { useInterval } from "./interval.hook";

export const useFixScrollTop = () => {
    // useEffect(() => {
    //     const handleWindowScrollToTop = () => {
    //         console.log('window scroll');
    //         // @ts-ignore
    //         window.scroll(0,0)
    //     }
    //     window.removeEventListener('scroll', handleWindowScrollToTop)
    //     window.addEventListener('scroll', handleWindowScrollToTop)
    // }, [])
    // useInterval(() => {
        // console.log('I GET TRIGGERED ALL DS TIME')
        // window.scroll(0,0)

    // }, 1000)
}