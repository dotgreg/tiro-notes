import { each, isNull } from "lodash"
import { analyzeItem } from "./analyzeItem.manager"
import { iAnalyzedObj, d } from "../doc"
import { getPropsFromExtInterface } from "./extObjs.manager"


// MAIN LOGIC
export const getAnalyzedStructure = (data: any, objectToAnalyze: string, blacklist: string[]): iAnalyzedObj[] => {
	const analyzedArr: iAnalyzedObj[] = []

	//
	// SUPPORT FUNCTIONS : RECURSIVE STRUCTURE BUILUP
	//
	const getStructureRecursively = (data, parent) => {

		let children = []
		// for array obj
		if (data.children && data.children.length > 0) children = data.children
		// for function that output an obj/arr to analyze
		else if (
			data.signatures &&
			data.signatures[0] &&
			data.signatures[0].type &&
			data.signatures[0].type.declaration &&
			data.signatures[0].type.declaration.children
		) children = data.signatures[0].type.declaration.children

		each(children, item => {
			const parentPathRaw = parent + ' ' + item.name
			if (item.name && item.type) {

				//
				// SEARCHING FOR INTERFACES
				//
				if (item.type.name) {
					const interfaceToSearch = item.type.name
					const eprops = getPropsFromExtInterface(interfaceToSearch)
					if (!blacklist.includes(interfaceToSearch)) analyzeItemsRecursively(eprops, 0, parentPathRaw)
					// if (interfaceToSearch === 'iFileApi') analyzeItemsRecursively(eprops, 0, parentPathRaw)
				}


				//
				// GOING DOWN RECURSIVELY IF CHILDRENS
				//
				else if (item.type.declaration && item.type.declaration.children) {
					const nData = item.type.declaration
					getStructureRecursively(nData, parentPathRaw)
				}

				//
				// ANALYZING SIMPLE CHILDREN
				//
				else if (item.type.type) {
					// analyzeItemsRecursively(item, 0, parentPathRaw)
					let t = analyzeItem(item, parentPathRaw)
					analyzedArr.push(t)

				}


			}
		})
	}

	//
	// SUPPORT FUNCTIONS : PROPS ANALYZER
	//
	const analyzeItemsRecursively = (items: any[], level: number, parent: string) => {
		const l = (nb: number = 1) => 5 * (level + nb)

		each(items, p => {
			const nParent = `${parent} ${p.name}`

			//
			// INTERFACE
			// if PROP is itself an Interface like popup.confirm:iConfirmPopup , fetch it
			//
			if (p.type && p.type.type === "reference") {
				const interfaceToSearch2 = p.type.name
				const eprops = getPropsFromExtInterface(interfaceToSearch2)
				analyzeItemsRecursively(eprops, level, nParent)
			}

			// if has children, show them
			else if (p.type && p.type.declaration && p.type.declaration.children) {
				const nprops = p.type.declaration.children
				analyzeItemsRecursively(nprops, level, nParent)
			}

			// if it is a normal type, show sign
			else {
				const a = analyzeItem(p, nParent)
				if (
					!a.path.includes("ui.browser.files.active.get.") &&
					!a.path.includes("ui.browser.folders.get.")
				) {
					analyzedArr.push(a)
				}
			}
		})
	}


	//
	// MAIN LOGC
	//
	each(data.children, item => {
		if (item.name === objectToAnalyze) {
			getStructureRecursively(item, '')
		}
	})

	return analyzedArr
}

