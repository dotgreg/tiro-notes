import { getSmartTableObj } from "../managers/smartTable.manager"

export type iSharedFunctionsApi = {
	smartTable: {
		getObj: typeof getSmartTableObj
	}
}

export const sharedFunctionsApi: iSharedFunctionsApi = {
	smartTable: {
		getObj: getSmartTableObj

	}
}
