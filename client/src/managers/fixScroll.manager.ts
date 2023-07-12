export const fixScrollToTop = () => {
    const handleWindowScrollToTop = () => {
        // @ts-ignore 
        window.scroll(0,0)
    }
    window.removeEventListener('scroll', handleWindowScrollToTop)
    window.addEventListener('scroll', handleWindowScrollToTop)
}