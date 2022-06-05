import { each, isArray, isString } from "lodash"
import { d, iAnalyzedObj } from '../doc'
import { addToExtRefs, getReferenceByName } from './extObjs.manager'


//
// ANALYZE ITEM
//
export const analyzeItem = (item: any, path?: string, options?: { raw?: boolean }): iAnalyzedObj => {

	const p = item
	// console.log(444, p.name, d(p));
	let res: iAnalyzedObj = {
		name: p.name,
		type: null,
	}
	if (options && options.raw === true) res.raw = p
	//res.raw = p
	if (p.flags && p.flags.isOptional === true) res.optional = true

	// SHORTCUTS
	let decl = null
	let declSign = null
	let sign = null
	if (p.signatures) sign = p.signatures[0]
	if (p.type && p.type.declaration) decl = p.type.declaration
	if (decl && decl.signatures) decl = p.type.declaration

	// PATH PREPROCESSING
	if (path) {
		res.parent = path.trim().split(" ")[0]
		res.path = path.trim().split(" ").join(".")
	}

	let signs = []
	if (p.signatures) signs = p.signatures
	// comments
	if (signs[0] && signs[0].comment) {
		res.comment = signs[0].comment.shortText
	}
	// if (p.type && p.type.declaration && p.type.declaration.signatures) {
	// 	res.comment = signs[0].comment.shortText
	// }

	//
	// FUNCS
	//
	// if it is a normal type but called from another interface like iMoveApi['file']
	if (p.type && p.type.declaration && p.type.declaration.signatures) signs = p.type.declaration.signatures

	if (signs[0]) {
		let type = signs[0].kindString
		res.type = type

		// FUNCTION
		if (type === "Call signature") {
			res.type = "Function"
			//
			// PARAMS 
			//
			const params = signs[0].parameters
			res.fnParams = []
			each(params, param => {

				// IF PARAM IS A REFERENCE TO EXTERNAL INTERFACE LIKE iFILE
				if (param.type && param.type.type === "reference") {
					// let r2 = { name: param.name, type: param.type.name }
					let r2 = { name: param.name, type: "reference", externalRefName: param.type.name }
					addToExtRefs(getReferenceByName(param.type.name))
					// const r1 = getReferenceByName(param.type.name)
					// if (r1) r2 = r1
					// the object taken name is a generic interface, so give it back its right onw
					res.fnParams.push(r2)

					// IF PARAMS ARE SIMPLE
				} else if (param.type.name) {
					res.fnParams.push({ name: param.name, type: param.type.name })
					// if PARAM IS AN OBJ
				} else {
					const pObj = analyzeItem(param, '', { raw: false })
					res.fnParams.push(pObj)
				}
			})


			//
			// RESULTS
			//
			const result = signs[0].type
			// ARRAY
			// console.log(456, result);
			if (
				result.type === "array" ||
				result.type === "reflection"
			) {
				res.fnResult = analyzeItem({ type: result }, '')
				// NORMAL RESULT
			} else {
				res.fnResult = { name: "", type: result.name }

			}
		}


		//
		// OBJ
		//
	} else if (
		p.type && p.type.type === "reflection" ||
		p.kindString === "Interface"
	) {

		const getObjProps = (res: iAnalyzedObj, children: any[]) => {
			if (!res.objprop) res.objprop = {}
			const required = {}
			const optional = {}
			each(children, p2 => {
				const o2 = analyzeItem(p2, '', { raw: false })
				if (o2 && o2.name) {
					if (o2.optional) optional[o2.name] = o2
					else required[o2.name] = o2
				}
			})
			// required first optional after
			res.objprop = { ...required, ...optional }
		}

		res.type = "object"

		if (p.type && p.type.declaration && p.type.declaration.children) {
			getObjProps(res, p.type.declaration.children)
		}

		if (p.kindString === "Interface" && p.children) {
			getObjProps(res, p.children)
		}

	} else if (p.type && p.type.type) {

		//
		// ARR
		//
		if (p.type.type === "array") {
			res.type = p.type.type
			// if array type is simple
			const etype = p.type.elementType
			if (etype && etype.type === 'intrinsic') res.arrItem = etype.name
			// if it is external ref (ifile etc.)
			else if (etype.type === "reference") {
				addToExtRefs(getReferenceByName(etype.name))
				// const r1 = getReferenceByName(etype.name)
				// if (r1) res.arrItem = r1.objprop
				// let r2 = { name: param.name, type: "reference", externalRefName: param.type.name }
				res.arrItem = { name: '', type: "reference", externalRefName: etype.name }
			}
		}

		//
		// ARRAY & PRIMITIVES
		//
		else if (p.type.type === 'intrinsic') {
			res.type = p.type.name
		}

		//
		// SIMPLE FUNCTION/FILE/OTHER OBJECT TYPE
		//
		else if (p.type.type === 'reference' && p.type.qualifiedName) {
			res.type = p.type.qualifiedName
		}
		//
		// REFERENCES TO EXT INTERVAL
		//
		else if (p.type.type === 'reference') {
			addToExtRefs(getReferenceByName(p.type.name))
			// const r1 = getReferenceByName(p.type.name)
			// if (r1) res = r1
			// res.name = p.name
			res = { name: '', type: "reference", externalRefName: p.type.name }
		}
		//
		// UNION
		//
		else if (p.type.type === 'union') {
			res.type = p.type.type
			res.name = p.name
			res.unionVals = []
			each(p.type.types, t => {
				res.unionVals.push(t.value)
			})
			// console.log(777, res, p);
		}

	}


	return res
}
