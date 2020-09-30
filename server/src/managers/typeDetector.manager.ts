import { filetype } from "../../../shared/types.shared";

let patterns = {
    [filetype.movie] : ['.avi', '.mkv', '.mp4', 'vostfr', 'h.264', '1080', '720', 'bluray', 'hdtv', 'x264', 'bdrip', 'dvdrip', 'xvid'],
    [filetype.serie] : ['s0', 'season','saison','series', '.mp4', 'complete'],
    [filetype.book] : ['livre', 'roman','epub','ebook', 'volume', 'tome', 'edition', 'pdf'],
    [filetype.game] : ['gog'],
}

let patterns2:{type:filetype,patterns:string[]}[] = [
    {type:filetype.movie, patterns:['.avi', '.mkv', '.mp4', 'vostfr', 'h.264', '1080', '720', 'bluray', 'hdtv', 'x264', 'bdrip', 'dvdrip', 'xvid']},
    {type:filetype.serie, patterns:['s0', 'season','saison','series', '.mp4', 'complete']},
    {type:filetype.book, patterns:['livre', 'roman','epub','ebook', 'volume', 'tome', 'edition', 'pdf']},
    {type:filetype.app, patterns:['-gog','.gog','.exe']}

]

export const detectMediaType = (fileName:string):filetype => {
    let res = filetype.other

    for (let i = 0; i < patterns2.length; i++) {
        const ft = patterns2[i];
        for (let y = 0; y < ft.patterns.length; y++) {
            const pattern = ft.patterns[y];
            if (fileName.indexOf(pattern) !== -1) res = ft.type
        }
    }

    return res
}