import { each } from "lodash"
import { iAnalyzedObj } from "../doc"

export const flatToStructured = (arr: iAnalyzedObj[], levelToKeep: number = -1) => {
	const structObj = {}
	each(arr, it => {
		const pathArr = it.path.split(".")

		// console.log(it.name);
		let rel = structObj
		if (levelToKeep === -1) {
			each(pathArr, (p, i) => {
				if (!rel[p]) rel[p] = {}
				if (i !== pathArr.length - 1) {
					rel = rel[p]
				}
				else {
					rel[p] = it
				}
			})
		} else if (levelToKeep === 1) {
			const category = pathArr[0]
			if (!structObj[category]) structObj[category] = []
			structObj[category].push(it)
		}

	})
	return structObj
}
