import { getSmartTableObj, updateSmartTable } from "../managers/smartTable.manager"

export type iSharedFunctionsApi = {
	smartTable: {
		getObj: typeof getSmartTableObj
		update: typeof updateSmartTable
	}
}

export const sharedFunctionsApi: iSharedFunctionsApi = {
	smartTable: {
		getObj: getSmartTableObj,
		update: updateSmartTable
	}
}
