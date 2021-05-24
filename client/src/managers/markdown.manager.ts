const marked = require('marked');

export const md2html = (raw:string):string => {
    return marked(raw)
}