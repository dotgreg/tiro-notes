import { each, isBoolean, isArray, isObject, isString } from "lodash"
import { d, iAnalyzedObj, iStringTemplates } from '../doc'


// HELPER STRING FUNCTIONS
const space = (nb: number) => {
	let res = ``
	for (let i = 0; i < nb; i++) {
		res += "&nbsp;"
	}
	return res
};
const jump = (nbSpace?: number) => {
	let res = "\n"
	if (nbSpace) res += `${space(nbSpace)}`
	return res
}
const j = jump

const sep = (index: number): string => {
	// return tot - 1 === index ? "" : ", "
	return index === 0 ? "" : ", "
}

const toCode = (str: string, multiline: boolean = false): string => {
	const m = multiline ? `\n` : ''
	// return `\`\`\`${m}${str}${m}\`\`\``
	// return `<${m}${str}${m}\`\`\``
	const tag = multiline ? "div" : "span"
	str = str.split("\n").join("<br/>")
	return `<${tag} class="render-code-wrapper">${str}</${tag}>`
}

const renderName = (o: iAnalyzedObj, noName: boolean = false): string => {
	const opt = o.optional ? "?" : ""
	let name = !noName ? `${o.name}${opt}: ` : ``
	return name
}


// @1
const renderObj = (obj: any, noName: boolean = false): string => {
	let res = `{`
	let c = 0
	each(obj, p => {
		const name = renderName(p)
		res += `${sep(c)}${j(3)}${name}${renderType(p, { name: false })}`
		c++
	})
	res += `\n}`
	return res
}
const renderUnion = (o: iAnalyzedObj): string => {
	let res = ``
	each(o.unionVals, (uv, i) => {
		let sep = (i !== 0) ? " | " : ""
		res += `${sep}"${uv}"`
	})
	return res
}
const renderRefLinkHtml = (o: iAnalyzedObj): string => {
	let resCode = `<a href="#client-api?id=${o.externalRefName.toLocaleLowerCase()}">${o.externalRefName}</a>`
	return resCode
}


///////////////////////////////////////////////////////////////////////
// RENDER SINGLE TYPE 
//
const renderType = (o: iAnalyzedObj, options?: { name?: boolean, html?: boolean }): string => {
	if (!options) options = {}
	if (!isBoolean(options.html)) options.html = true
	if (!isBoolean(options.name)) options.name = false

	const op = options
	const name = renderName(o, !op.name)
	// LITERAL
	let resName = `${name}`
	let resCode = ``
	if (
		o.type === 'number' ||
		o.type === 'boolean' ||
		o.type === 'any' ||
		o.type === 'void' ||
		o.type === 'null' ||
		o.type === 'undefined' ||
		o.type === 'string'
	) {
		resCode = `${o.type}`
	}

	// UNION
	if (o.type === 'union') {
		resCode = `${renderUnion(o)}`

	}

	// EXT REFERENCE
	if (o.type === 'reference') {
		// resCode = `${o.externalRefName}`
		resCode = op.html === true ? `${renderRefLinkHtml(o)}` : o.externalRefName
	}

	// ARR
	if (o.type === 'array') {
		resCode = ``
		if (isString(o.arrItem)) resCode += `${o.arrItem}`
		else {
			resCode += `${renderType(o.arrItem, op)}`
		}
		resCode += `[]`
	}
	// OBJ
	if (o.type === 'object') {
		resCode = `${renderObj(o.objprop)}`
	}

	// FUNCTION
	if (o.type === "Function") {
		if (o.fnParams && o.fnResult) {
			resCode = `(`
			each(o.fnParams, (p, i) => {
				resCode += `${sep(i)}${p.name}: ${renderType(p, op)}`
			})
			resCode += `) => ${renderType(o.fnResult, op)}`
		} else {
			resCode += `${name}${o.type}`
		}
	}

	let res = toCode(`${resName}${resCode}`)

	return res
}


///////////////////////////////////////////////////////////////////////
// RENDER ARR 
//

export const renderArr = (Arr: iAnalyzedObj[], options: {
	title: string,
	stringsTemplates: iStringTemplates
}) => {

	let strRes = ``
	const s = (str: string, space?: number) => {
		if (!space) space = 0
		let spaceStr = ``
		for (let i = 0; i < space; i++) { spaceStr = spaceStr + ` ` }
		strRes = `${strRes} ${spaceStr}${str}\n`
	}

	const st = options.stringsTemplates
	// if (!isObject(obj)) return
	s(`\n\n`, 0)
	s(`## ${options.title}`, 0)

	each(Arr, (o2: iAnalyzedObj, n2) => {
		// If o2 is an array, it means it is a submenu, so recurs it
		// console.log(isArray(o2), o2.name, o2);
		// if (o2.name === "02913u09ejjddm910") renderStructRecurs(o2)

		const name = o2.path ? o2.path : o2.name
		s(`\n\n#### ${toCode(name)}`, 0)
		if (o2.comment) s(`- Description: \n${o2.comment}\n`, 0)

		let ex = st.funcStart(o2, { j })
		if (o2 && o2.name && o2.type) {
			s(`- Type: ${toCode(o2.type)} `, 0)

			//
			// FUNCTION
			// 
			if (o2.fnParams) {
				let cb = null
				if (o2.fnParams.length > 0) s(`- Parameters: `, 3)
				each(o2.fnParams, (p, j) => {
					if (st.funcDisplay === "api.call" && p.name === "cb") {
						cb = renderType(p, { name: false })
					} else {
						ex += `${sep(j)}${renderType(p, { name: false })}`
						s(`1. ${p.name}: ${renderType(p, { name: false })}`, 6)
					}
				})

				const normalResultRender = `- Result: ${(renderType(o2.fnResult, { name: false }) + ' ')}\n`
				if (st.funcDisplay === 'api.call') {
					if (cb) {
						ex += `], ${j(3)}${cb}\n)`
						s(`- Result: ${cb}\n`, 3)
					} else if (o2.fnResult && o2.fnResult.type !== 'void') {
						ex += ` ], \n(res:${renderType(o2.fnResult, { name: false })}) => {}\n)`
						s(normalResultRender, 3)
					} else {
						ex += ` ]\n)`
					}
				} else if (st.funcDisplay === 'normal') {
					s(normalResultRender, 3)
					ex += ` )`
				}

				s(`- Example: \n ${toCode(ex, true)}`, 0)
			}

			//
			// LITERAL (number, strings ,bools.)
			// 
			if (
				o2.type === "number" ||
				o2.type === "string" ||
				o2.type === "any" ||
				o2.type === "boolean"
			) {
				const ex = `api.call("${o2.path}", [], (res:${o2.type}) => {})`
				s(`- Example: \n ${toCode(ex, true)}`, 0)
			}


			else if (
				o2.type === "object" ||
				o2.type === "union"
			) {

				s(`- Details: \n ${toCode(renderType(o2, { name: false }), true)}`, 0)
			}


		} else {
			each(o2, (o3: any, n3) => {
				s(`### ${n3}`, 0)
			})
		}
	})
	return strRes
}
