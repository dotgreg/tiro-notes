import { generateUUID } from "../../../shared/helpers/id.helper"

const createCache = (elCache:HTMLElement):string => {
    let cacheId = generateUUID()
    elCache.id = `cache-node-id-` + cacheId
    return cacheId
}
const addNode = (cacheId:string, nodeId:string, nodeEl:HTMLElement):{placeholderHtml:string} => {
    // c'est fait au niveau CM > plugin(p.file, p.addCacheNodeFn)
    // ou plus simple, je fais passer la cacheNodeId, c mieux
    // generate uuid 

    // addNode est called des quil y a une modif
    // donc si 3 pdfs ctag avec le meme nom = mm id SAUF si on arrive a chopper la ligne

    // let n = generateUUID()
    // insert el inside the cacheEl
    let placeholderHtml = `<div id="${nodeId}">${nodeId}</div>`
    return {placeholderHtml}
}
const updatePosNodes = (cacheId:string) => {
    // on scroll or onchange events
    // get for each node cached
    // get its uuid and the pos of placeholder UUID
    // 
}
const updateNodes = (cacheId:string) => {
    // on events like debounce edit
    // scan for each node cached
    // if its twin uuid-placeholder doesnt exists anymore
    // delete it
}

const deleteCache = (cacheId:string) => {
    // on events like filepath change 
    // delete everything
    let elCache = document.getElementById(cacheId)
    if(elCache) elCache.innerHTML = ""
}

export const cacheNode = {
    createCache,
    deleteCache,

    addNode,

    updateNodes,
    updatePosNodes,
}