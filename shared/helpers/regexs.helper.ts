import VerEx from 'verbal-expressions';
import { sharedConfig } from '../shared.config';

const v = {
	img: VerEx().find('.').then('jpg').or('jpeg').or('png').or('gif').or('webm').or('svg'),
	imgMdConfig: VerEx().anythingBut('[]|').maybe('|').beginCapture().anythingBut('[]|').endCapture().maybe('|').beginCapture().anythingBut('[]|').endCapture(),
	customTag: VerEx().find('[[').beginCapture().range('a', 'z').oneOrMore().endCapture().then(']]')
}


export const regexs = {
	// .anythingBut(`[${sharedConfig.metas.headerEnd}]`)
	// metas : VerEx().find(sharedConfig.metas.headerStart).beginCapture().then(new RegExp(/([\s\S])*/)).endCapture().then(sharedConfig.metas.headerEnd),
	metas: VerEx().find(sharedConfig.metas.headerStart).beginCapture().anythingBut(``).endCapture().then(sharedConfig.metas.headerEnd),
	// metas : VerEx().find(sharedConfig.metas.headerStart).beginCapture().anything().endCapture().then(sharedConfig.metas.headerEnd),
	// metas : VerEx().find(sharedConfig.metas.headerStart).beginCapture().anything().not(sharedConfig.metas.headerEnd).endCapture().then(sharedConfig.metas.headerEnd),
	// metas : VerEx().find(sharedConfig.metas.headerStart).beginCapture().not(sharedConfig.metas.headerEnd).endCapture().then(sharedConfig.metas.headerEnd),

	baliseHtml: VerEx().find('<').anythingBut('<>').then('>'),

	ressource: VerEx().find('![').beginCapture().anythingBut('[]').endCapture().then('](').beginCapture().anythingBut('()').endCapture().then(')'),
	ref: VerEx().find('[').anythingBut('[]').then('](').anythingBut('()').then(')'),

	extimage: VerEx().find('![').anythingBut('[]').then('](').beginCapture().then('http').anythingBut('()').then(v.img).anythingBut('()').endCapture().then(')'),
	image: VerEx().find('![').anythingBut('[]').then('](').beginCapture().anythingBut('()').then(v.img).anythingBut('()').endCapture().then(')'),
	imageAndTitleCapture: VerEx().find('![').beginCapture().anythingBut('[]').endCapture().then('](').beginCapture().anythingBut('()').then(v.img).anythingBut('()').endCapture().then(')'),
	imageAndConfig: VerEx().find('![').then(v.imgMdConfig).then('](').beginCapture().anythingBut('()').then(v.img).anythingBut('()').endCapture().then(')'),

	searchlink: VerEx().find('[search|').beginCapture().anythingBut('[]').endCapture().then(']'),

	linklink: VerEx().find('[link|').beginCapture().anythingBut('[]').endCapture().then(' ').beginCapture().then('/').anythingBut('[]').endCapture().then(']'),
	latexTag: VerEx().find('[[latex]]').beginCapture().anythingBut('').endCapture().then('[[latex]]'),
	scriptTag: VerEx().find('[[script]]').beginCapture().anythingBut('').endCapture().then('[[script]]'),

	userCustomTagFull: VerEx().find(v.customTag).beginCapture().anythingBut('').endCapture().then(v.customTag),
	userCustomTagFull2: VerEx().beginCapture().find(v.customTag).endCapture(),
	//userCustomTag3: VerEx().find('[[').beginCapture().range('a', 'z').oneOrMore().endCapture().then(']]'),
	userCustomTag3: VerEx().find('[[').beginCapture().then(/[a-zA-Z-_\/]/).oneOrMore().maybe("-").endCapture().then(']]'),

	url2transform: VerEx().find('!').beginCapture().find('http').maybe('s').then('://').beginCapture().anything().endCapture().endCapture(),

	searchFolder: VerEx().find(' /').anything().endOfLine(),
	searchFolderNoSpace: VerEx().find('/').anything().endOfLine(),
	firstPartImg: VerEx().find('![').anythingBut('[]').then('](')

}

export const getCustomMdTagRegex = (tag: string) => {
	return VerEx().find(tag).beginCapture().anythingBut('').endCapture().then(tag)
}

// console.log(regexs);
