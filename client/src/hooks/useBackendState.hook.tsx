import { useContext, useEffect, useRef, useState } from "react";
import { sharedConfig } from "../../../shared/shared.config";
import { getApi, getClientApi2 } from "./api/api.hook";
import { cloneDeep } from "lodash";
import { useDebounce } from "./lodash.hooks";

const h = `[BACKEND STATE]`
type iFunctionRefresh = (cb?: (initVal:any) => void) => void
export function useBackendState<T>(
	key: string, 
	initialValue: T, 
	opts?:{
		debug?: boolean, 
		history?: boolean
		onInitialRefresh?: (initVal:any) => void,
		debouncedSave?: boolean
	}): [
		T, 
		(value: T) => void, 
		iFunctionRefresh
	] {

	const [storedValue, setStoredValue] = useState(initialValue)

	// during hook load, fetch, if it exists the note content

	// => /.tiro/states/user-settings.md if using useBackendState('user-settings')
	const pathToNote = `/${sharedConfig.path.configFolder}/${sharedConfig.path.backendStateFolder}/${key}.md`

	const errorMsg = `[BACKEND STATE] "${key}" clientApi not loaded! Persistance system will not work correctly`

	

	

	// let file:iFile
	// file.
	// fetch content on initial loading
	useEffect(() => {
		const cb = opts?.onInitialRefresh ? opts.onInitialRefresh : undefined
		refreshValFromBackend(cb);
	}, [])

	// persistence logic 
	const setValue = value => {
		const nval = cloneDeep(value)
		setStoredValue(cloneDeep(nval))
		if(opts?.debug === true) console.log(`[BACKEND STATE] setValue: ${key} => `, nval);
		let nvalStr =  JSON.stringify(nval)
		const debounced = opts?.debouncedSave === true ? true : false
		getApi(api => {
			api.file.saveContent(pathToNote, nvalStr, {debounced})
		})
		if (opts?.history === true) saveHistoryDebounced(nvalStr)
	}


	const saveHistoryDebounced = useDebounce((nval) => {
		// console.log(`${h} saving history for ${key} with content length ${nval.length}`)
		getApi(api => {
			api.history.save(pathToNote, nval, 'int')
		})
	}, 60*1000)

	const refreshValFromBackend:iFunctionRefresh = (cb) => {
		getApi(api => {
			api.file.getContent(pathToNote, raw => {
				const obj = JSON.parse(raw)
				if(opts?.debug === true) console.log(`[BACKEND STATE] refreshValFromBackend: ${key} => `, obj);
				setStoredValue(obj);
				cb && cb(obj)
			})
		})
	}

	return [storedValue, setValue, refreshValFromBackend];
}
