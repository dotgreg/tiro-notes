import { each } from "lodash"
import { iAnalyzedObj } from '../doc'
import { analyzeItem } from './analyzeItem.manager'
//
// EXT REFS
//
export const extReferences: { [name: string]: iAnalyzedObj } = {}
export const addToExtRefs = (obj: iAnalyzedObj | null) => {
	if (obj) extReferences[obj.name] = obj
}
export const cleanExtObjs = () => {
	each(extReferences, (p, n) => { if (extReferences[n]) delete extReferences[n] })
	each(extObjs, (p, n) => { if (extObjs[n]) delete extObjs[n] })
}

export const getReferenceByName = (refName: string): iAnalyzedObj | null => {
	let res = null
	const extobj = extObjs[refName]
	if (extobj) {
		const r1 = analyzeItem(extobj)
		if (r1.type) res = r1
	}
	return res
}

////////////////////////////////////////////////////////////////////////////////
// GETTING props from extObjs
//

const extObjs = {}
export const buildExtObjs = (data: any) => {
	each(data.children[0].children, item => {
		// if (item.name && item.name.startsWith('i')) {
		if (item.name) {
			// console.log(item.name);
			extObjs[item.name] = item
		}
	})

}
export const getPropsFromExtInterface = (interfaceName: string) => {
	const extobj = extObjs[interfaceName]
	let props1 = null
	let props2 = null

	if (extobj) {
		if (extobj.children) {
			props1 = extobj.children
		}
		if (extobj.type && extobj.type.declaration) {
			props2 = extobj.type.declaration.children
		}
	}

	let fProps = []
	// if structure analyzed is a obj of arr
	if (props1) fProps = props1
	if (props2) fProps = props2

	// if structure analyzed is sthg else (func etc.)
	if (
		fProps.length === 0 &&
		extobj && extobj.type &&
		extobj && extobj.type.declaration &&
		extobj.type.declaration.signatures) {
		const signatures = extobj.type.declaration.signatures
		each(signatures, s => {
			fProps.push(s)
		})
	}
	return fProps
}
