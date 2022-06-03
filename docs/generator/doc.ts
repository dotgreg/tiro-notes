import { each } from "lodash"
import { renderArr } from "./managers/renderItem.manager"
import { buildExtObjs, extReferences } from "./managers/extObjs.manager"
import { getAnalyzedStructure } from "./managers/analyzer.manager"
import { flatToStructured } from "./managers/flatToStructured.manager"
import { updateDocFile } from "./managers/writeDoc.manager"
const util = require('util')


export const d = (obj: any) => {
	return util.inspect(obj, { showHidden: false, depth: null, colors: true })
}

/////////////////////////////////
// TYPES
interface iObj { [name: string]: iAnalyzedObj }
export interface iAnalyzedObj {
	name: string
	parent?: string
	path?: string
	optional?: boolean
	comment?: string
	type: string
	// Function props
	fnParams?: iAnalyzedObj[],
	fnResult?: iAnalyzedObj,
	// obj props
	objprop?: iObj,
	// array props
	arrItem?: iAnalyzedObj,
	// union props 
	unionVals?: string[]
	// external ref
	externalRefName?: string
	raw?: any
}

export type iStringTemplateFn = (o2: iAnalyzedObj, utils: any) => string
export interface iStringTemplates {
	titlePre: string
	funcStart: iStringTemplateFn
	funcDisplay: "api.call" | "normal"
}

/////////////////////////////////
// MAIN EXPORT FUNCTION
//
const exportDocumentationFromJson = (
	p: {
		blacklist: string[],
		objectToAnalyze: string,
		jsonFile: any,
		renderExtRefs: boolean,
		stringTemplates: iStringTemplates,
		debug?: boolean
	}
): string => {

	const data = p.jsonFile

	console.log("=========== STARTING GENERATOR ============");

	console.log("==> ANALYSING EXTERNAL INTERFACES ");

	buildExtObjs(data)

	console.log("==> ANALYSING ROOT INTERFACE ");

	// MAIN ANALYZER
	const analyzedArr = getAnalyzedStructure(data, p.objectToAnalyze, p.blacklist)

	// FROM FLAT ARR TO LAYERED FOR TITLE N STUFFS
	const structArrs = flatToStructured(analyzedArr, 1)
	if (p.debug) console.log(191, d(structArrs));



	// RENDER LOGIC
	// include refs in struct Arr
	if (p.renderExtRefs && extReferences) {
		structArrs['_References'] = extReferences

	}

	let strRes = ``
	each(structArrs, (arr, category) => {
		strRes += renderArr(arr, {
			title: p.stringTemplates.titlePre + category,
			stringsTemplates: p.stringTemplates
		})
	})

	return strRes
}


////////////////////////////////////////////////////////////////////////
// MAIN LOGIC 


// 1 MAIN IFRAME API
const iframeApiData = require('./iframe-api.json')
const strIframeApi = exportDocumentationFromJson({
	jsonFile: iframeApiData,
	objectToAnalyze: "iframeMainCode",
	blacklist: ["iApiCall"],
	renderExtRefs: false,
	stringTemplates: {
		titlePre: 'Api.',
		funcStart: (o2, { j }) => `api.${o2.path}(`,
		funcDisplay: "normal"
	},
	debug: true
})
// console.log(strIframeApi);

// 2 CLIENT API 
const dataClientApi = require('./client-api.json')
const blacklist1 = [
	// "iFileApi",
	// "iFilesApi",
	"iFoldersApi",
	// "iNoteHistoryApi",
	// "iNoteApi", //
	// "iPopupApi", //
	// "iStatusApi",//
	// "iTabsApi",
	"iBrowserApi",
	// "iLightboxApi",
	// "iSearchUiApi",
	// "iWindowsApi",
	// "iUploadApi",
	// "iUserSettingsApi",
]
const strClientApi = exportDocumentationFromJson({
	jsonFile: dataClientApi,
	objectToAnalyze: "iClientApi",
	blacklist: blacklist1,
	renderExtRefs: true,
	stringTemplates: {
		titlePre: "Api.call : ",
		funcStart: (o2, { j }) => `api.call(${j(3)}"${o2.path}",${j(3)} [`,
		funcDisplay: "api.call"
	}
})
// updateDocFile(strClientApi)

let strRes = ``

strRes = `
# CLIENT API
${strIframeApi}
${strClientApi}
<style>
h4 .render-code-wrapper {
    font-size: 1.4rem;
    color: #f56e6e;
}
.render-code-wrapper {
    background: #f4f4f4;
    padding: 5px;
    color: #f56e6e;
    font-family: Roboto Mono,Monaco,courier,monospace;
    font-size: .8rem;
}
</style>
`



updateDocFile(strRes)
