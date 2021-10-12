import { sharedConfig } from "../shared.config"
import { metaContent } from "../types.shared"

type iMetaAnswer = {name: string, value: string|number}|null
let isIndexInsideHeader = false

export const processStringToMeta = (rawString: string):iMetaAnswer => {
    // filter on content
    if (rawString.startsWith(sharedConfig.metas.headerStart)) {isIndexInsideHeader = true}
        
    // if we reach END HEADER, stop looping for that file
    if (rawString.startsWith(sharedConfig.metas.headerEnd)) {isIndexInsideHeader = false}
    if (rawString === '') return null
    if (!isIndexInsideHeader) return null
    
    // split metaName and metaContent
    let contentArr = rawString.split(': ')
    // filter on content style, should be metaname: metacontent
    if (contentArr.length !== 2) return null
    // El 1 = name // El2+ = content
    const metaName = contentArr.shift()
    let metaContent:string|number = contentArr.join(':').trim()

    
    // if metaName is created/updated, transform string in date
    if (metaName === 'created' || metaName === 'modified') {
        const isContentTimestamp = (content:string) => parseInt(content).toString() === content
        if (isContentTimestamp) metaContent = parseInt(metaContent) * 1000
        const contentAsDate = new Date(metaContent).getTime()
        if (!isNaN(contentAsDate)) metaContent = contentAsDate
    }
    return {name: metaName, value: metaContent}
}