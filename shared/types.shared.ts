export type iFileNature = 'file' | 'folder'
export interface iFile {
    nature: iFileNature
    name: string
    path: string
}
export interface iFolder {
    title: string
    key: string
    path: string
    children?: iFolder[]
}
