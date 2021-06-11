import VerEx from 'verbal-expressions';

const v = {
    img: VerEx().find('.').then('jpg').or('jpeg').or('png').or('gif').or('webm').or('svg'),
    imgMdConfig: VerEx().anythingBut('[]|').maybe('|').beginCapture().anythingBut('[]|').endCapture().maybe('|').beginCapture().anythingBut('[]|').endCapture()
}
// 'img' .anythingBut('[]').
// 'img|' .anythingBut('[]|').
// 'img|(350)'
// 'img|(350)|(90)' 

export const regexs  = {
    baliseHtml : VerEx().find('<').anythingBut('<>').then('>'),
    
    ressource : VerEx().find('![').beginCapture().anythingBut('[]').endCapture().then('](').beginCapture().anythingBut('()').endCapture().then(')'),
    ref : VerEx().find('[').anythingBut('[]').then('](').anythingBut('()').then(')'),
    
    extimage: VerEx().find('![').anythingBut('[]').then('](').beginCapture().then('http').anythingBut('()').then(v.img).anythingBut('()').endCapture().then(')'),
    image: VerEx().find('![').anythingBut('[]').then('](').beginCapture().anythingBut('()').then(v.img).anythingBut('()').endCapture().then(')'),
    imageAndConfig: VerEx().find('![').then(v.imgMdConfig).then('](').beginCapture().anythingBut('()').then(v.img).anythingBut('()').endCapture().then(')'),

    searchlink: VerEx().find('[search|').beginCapture().anythingBut('[]').endCapture().then(']'),

    linklink: VerEx().find('[link|').beginCapture().anythingBut('[]').endCapture().then(' ').beginCapture().then('/').anythingBut('[]').endCapture().then(']'),
    url2transform: VerEx().find('!').beginCapture().find('http').maybe('s').then('://').beginCapture().anything().endCapture().endCapture(),

    searchFolder: VerEx().find(' /').anything().endOfLine(),
    firstPartImg: VerEx().find('![').anythingBut('[]').then('](')

}

// console.log(regexs);
