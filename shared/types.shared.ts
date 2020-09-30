export type iFileNature = 'file' | 'folder'
export interface iFileData {
    stars?: number,
    type?:number,
    tags?: string[]
}
export interface iFile {
    nature: iFileNature
    name: string
    link: string
    image?: string
    data?: iFileData
}

export enum filetype {
    book,
    serie,
    movie,
    bd,
    other,
    game,
    app
}