import { getSmartTableObj, updateSmartTableString } from "../managers/smartTable.manager"

export type iSharedFunctionsApi = {
	smartTable: {
		getObj: typeof getSmartTableObj
		updateString: typeof updateSmartTableString
	}
}

export const sharedFunctionsApi: iSharedFunctionsApi = {
	smartTable: {
		getObj: getSmartTableObj,
		updateString: updateSmartTableString
	}
}
