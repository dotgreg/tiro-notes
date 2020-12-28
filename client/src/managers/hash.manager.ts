export const listenToHashChanges = (onHashChanged:(newHash:string)=>void) => {
    window.onhashchange = () => { 
        let hash = window.location.hash.substr(1)
        hash = decodeURI(hash)
        if (hash.length > 0) {
            console.log(`[HASH CHANGE]`, hash)
            if (hash.startsWith('search[')) {
            hash = hash.replaceAll('search[','').replaceAll(']','').replaceAll('_','-')
            onHashChanged(hash)
          }
        }
        window.location.hash = ''
    }
}