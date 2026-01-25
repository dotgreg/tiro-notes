import { getSmartTable, iGetSmartTable } from "./smartTable.manager"

export type iSharedFunctionsApi = {
	getSmartTable:iGetSmartTable
}

export const sharedFunctionsApi: iSharedFunctionsApi = {
	getSmartTable
}
