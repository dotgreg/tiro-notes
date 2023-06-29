// IF CAN BE PREVIEWED
export const getFileType = (urlLink:string):string => {
    let filetype = 'none'
    let t1 = urlLink.split('.');
    filetype = t1[t1.length - 1].split("?")[0];
    if (filetype === '7z') filetype = 'd7z';
    if (filetype.length > 5) filetype = 'none'
    return filetype
}