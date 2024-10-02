import VerEx from 'verbal-expressions';
import { sharedConfig } from '../shared.config';


const v = {
	img: VerEx().find('.').then('jpg').or('jpeg').or('png').or('gif').or('webm').or('svg').or('webp'),
	imgMdConfig: VerEx().anythingBut('[]|').maybe('|').beginCapture().anythingBut('[]|').endCapture().maybe('|').beginCapture().anythingBut('[]|').endCapture(),
	// customTag: VerEx().find('[[').beginCapture().range('a', 'z').oneOrMore().endCapture().then(']]'),
	//userCustomTagManual: /\[\[[a-zA-Z0-9-\ _\/]*\]\]/,
	customTag: /\[\[[a-zA-Z0-9-\ _\/]*\]\]/,
	// insideHashtag: /[A-zÀ-ú1-9_\-]+/,
	// insideHashtag: /[A-zÀ-ú1-9_\-]+/,
	// titleHtml: /(\<title\/\>)[^<](/,
	
}
const vStr = {
	charWithAccents: "[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]{1}",
	tableLine: "([a-zÀ-úA-Z0-9@:%,\-*._\+~#= ]+\|)"
}


// const getRegexHtmlTag = (tagName:string) => /$/

export const regexs = {
	strings: vStr,
	// markdown checkbox, either "[ ]" or [x] or [X] 
	checkbox: /\[ \]|\[x\]|\[X\]/gi,
	// date like 31/12/2020
	dateFrFormat: /([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})/gi,
	// either **TEXT** or ~~TEXT~~ or ***TEXT*** or __TEXT__ or *TEXT*, no space between the content and delimiter, so *TEXT* is ok but * TEXT * is not
	boldOrStrike: /\*\*[^*]+\*\*|\~\~[^~]+\~\~|\*\*\*[^*]+\*\*\*|\_\_[^_]+\_\_|\*[^\ \*]+\*/gi,
	metas: VerEx().find(sharedConfig.metas.headerStart).beginCapture().anythingBut(``).endCapture().then(sharedConfig.metas.headerEnd),
	metasAndSpace: VerEx().find(sharedConfig.metas.headerStart).beginCapture().anythingBut(``).endCapture().then(sharedConfig.metas.headerEnd).then('\n'),
	titleHtml: /<(title)[^>]*>([^<]*)<\/\1>/gi,
	metasHtml: /<meta[^>]*(name|property)="([^"]*)"[^>]*content="([^"]*)"[^>]*>/gi,
	externalLink3: /https?:\/\/((www\.)?[a-zÀ-úA-Z0-9@:%._\+~#=]{1,256})\b(\/[-a-zA-ZÀ-ú0-9()\*\;\!@:%_\-\+.,~#?&\/=]*\/)?([-a-zA-ZÀ-ú0-9()\*\;\!@:%_\-\+.,~#?&\/=]*)\/(\n| |$)/gmi,
	externalLink3Int: /https?:\/\/((www\.)?[a-zÀ-úA-Z0-9@:%._\+~#=]{1,256})\b(\/[-a-zA-ZÀ-ú0-9()\*\;\!@:%_\-\+.,~#?&\/=]*\/)?([-a-zA-ZÀ-ú0-9()\*\;\!@:%_\-\+.,~#?&\/=]*)\//gmi,
	// mdTableLine: /(([a-zÀ-úA-Z0-9@:%,\-*._\+~#=  /!]+\|)+([a-zÀ-úA-Z0-9@:%,\-*._\+~#=  /!]+))/gmi,
	mdTableLine: /\|?(([^\|]+\|)+([^\|]+))\|?/gmi,
	mdTitle: /^([#]{1,9})\ (.+)/gi,
	// mdTableCell: /([a-zÀ-úA-Z0-9@:%,\-*._\+~#=  ])+\|/gmi,
	// mdTableCell: /(([^|])+\|/gmi,
	mdTableCell: /(((([^|\n])+\|)|(([^|\n])+)))/gmi,
	// mdTableCell if does not starts by "-" and the line has several | 
	// mdTableCell2: /(([^|\n])+\|)+/gmi,
	// mdTableCell2: : VerEx().find('<').anythingBut('<>').then('>'),
	// should not start by "-" and have several |
	doesNotStartByDash: /^(?!\-)/,
	hashtag: /#([A-zÀ-ú0-9_\-]+)/gi,
	// mdTableCell: /([a-zÀ-úA-Z0-9@:%,\-*._\+~#=  ]+\|)+([a-zÀ-úA-Z0-9@:%,\-*._\+~#=  ]+)/gmi,

	matchingHtmlTags: /<([^>]*)>([^<]*)<\/\1>/,
	baliseHtml: VerEx().find('<').anythingBut('<>').then('>'),

	ressource: VerEx().find('![').beginCapture().anythingBut('[]').endCapture().then('](').beginCapture().anythingBut('()').endCapture().then(')'),
	ref: VerEx().find('[').anythingBut('[]').then('](').anythingBut('()').then(')'),

	extimage: VerEx().find('![').anythingBut('[]').then('](').beginCapture().then('http').anythingBut('()').then(v.img).anythingBut('()').endCapture().then(')'),
	image: VerEx().find('![').anythingBut('[]').then('](').beginCapture().anythingBut('()').then(v.img).anythingBut('()').endCapture().then(')'),
	image2: /!\[(.*?)\]\((.*?\.(jpg|png|gif|bmp|jpeg|webm|svg|webp"))\)(\{(.*)\})?/gmi,
	fullImageMd: VerEx().beginCapture().find('![').anythingBut('[]').then('](').anythingBut('()').then(v.img).anythingBut('()').endCapture().then(')'),
	imageMdSrc: VerEx().find('![').anythingBut('[]').then('](').beginCapture().anythingBut('()').then(v.img).anythingBut('()').endCapture().then(')'),
	imageAndTitleCapture: VerEx().find('![').beginCapture().anythingBut('[]').endCapture().then('](').beginCapture().anythingBut('()').then(v.img).anythingBut('()').endCapture().then(')'),
	imageAndTitleCapture2: /\!\[([^\[\]]+)\]\(([^\(\)]+\.(jpg|jpeg|png|gif|webm|svg|webp))\)/gi,
	imageAndConfig: VerEx().find('![').then(v.imgMdConfig).then('](').beginCapture().anythingBut('()').then(v.img).anythingBut('()').endCapture().then(')'),

	searchlink: VerEx().find('[search|').beginCapture().anythingBut('[]').endCapture().then(']'),

	linklink: VerEx().find('[link|').beginCapture().anythingBut('[]').endCapture().then(' ').beginCapture().then('/').anythingBut('[]').endCapture().then(']'),
	latexTag: VerEx().find('[[latex]]').beginCapture().anythingBut('').endCapture().then('[[latex]]'),
	scriptTag: VerEx().find('[[script]]').beginCapture().anythingBut('').endCapture().then('[[script]]'),

	userCustomTagFull: VerEx().find(v.customTag).beginCapture().anythingBut('').endCapture().then(v.customTag),
	userCustomTagFull2: VerEx().beginCapture().beginCapture().find(v.customTag).endCapture().anythingBut('').beginCapture().then(v.customTag).endCapture().endCapture(),
	userCustomTagFull3: VerEx().beginCapture().find(v.customTag).endCapture(),
	// userCustomTagFull2: VerEx().beginCapture().find(v.customTag).endCapture(),
	//userCustomTag3: VerEx().find('[[').beginCapture().range('a', 'z').oneOrMore().endCapture().then(']]'),
	userCustomTag3: VerEx().beginCapture().then(v.customTag).endCapture(),
	userCustomTagManual: v.customTag,

	// externalLink: VerEx().beginCapture().find('http').maybe('s').then('://').beginCapture().anything().endCapture().endCapture(),
	externalLink: VerEx()
		// .find(VerEx().find(" ").or("\n"))
		.find('http').maybe('s').then('://')
		.beginCapture().anythingBut("/ ").endCapture()
		.beginCapture()
		.anythingBut(" ")
		.then("/")
		.beginCapture().anythingBut("? ").endCapture()
		.anythingBut(" \n")
		// .then("/")
		// .then("/").or("\n")
		.then("\\n")
		.endCapture(),

	url2transform: VerEx().find('!').beginCapture().find('http').maybe('s').then('://').beginCapture().anything().endCapture().endCapture(),

	searchFolder: VerEx().find(' /').anything().endOfLine(),
	searchFolderNoSpace: VerEx().find('/').anything().endOfLine(),
	firstPartImg: VerEx().find('![').anythingBut('[]').then(']('),

	// hashtag: VerEx().find('#').beginCapture().anythingBut(' ').endCapture(),
	// hashtag2: VerEx().find(" ").or("\n").then('#').beginCapture().find(v.insideHashtag).endCapture(),
	hashtag3: VerEx().find(/[-| |\n]{1}\#([A-zÀ-ú1-9_\-]+)/gi),
	titleMd: VerEx().startOfLine().find('#').oneOrMore().then(' ').beginCapture().anythingBut("").endCapture(),

	scriptHtml: VerEx().find('<script>').beginCapture().anythingBut('').endCapture().then('</script>'),

}

export const getCustomMdTagRegex = (
	tag: string,
	options?: {
		withWrapper: boolean
	}
) => {
	let regex = VerEx().find(tag).beginCapture().anythingBut('[]').endCapture().then(tag)
	if (options && options.withWrapper) VerEx().beginCapture().find(tag).anythingBut('[]').then(tag).endCapture()
	return regex
}


//@ts-ignore
// window.mdregex = getCustomMdTagRegex
// console.log(regexs);
