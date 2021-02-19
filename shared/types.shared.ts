export type iFileNature = 'file' | 'folder'
export interface iFilePreview {
    path: string,
    picture?: string,
    content: string,
}
export interface iFile {
    nature: iFileNature
    name: string
    realname: string
    path: string
    extension?: string
    created?: number
    modified?: number
    index?:number
    folder:string
}
export interface iFolder {
    title: string
    key: string
    path: string
    children?: iFolder[]
}
