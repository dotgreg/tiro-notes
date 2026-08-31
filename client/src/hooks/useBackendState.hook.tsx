import { useEffect, useRef, useState } from "react";
import { sharedConfig } from "../../../shared/shared.config";
import { getApi } from "./api/api.hook";
import { cloneDeep, each } from "lodash-es";
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
		debouncedSave?: number
		debouncedSaveWithThrottle?: boolean
		editIfNotLoaded?: boolean

	}): [
		T, 
		(value: T) => void, 
		iFunctionRefresh
	] {

	// const [hasBackendLoaded, setHasBackendLoaded] = useState(false)
	const hasBackendLoadedRef = useRef<boolean>(false)
	// writes made before the initial backend read lands: key -> value, flushed on load
	const pendingWritesRef = useRef<Record<string, any>>({})
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
		const debounced = opts?.debouncedSave ? opts?.debouncedSave : false
		const withThrottle = opts?.debouncedSaveWithThrottle === true ? true : false
		if (hasBackendLoadedRef.current) {
			getApi(api => {
				api.file.saveContent(pathToNote, nvalStr, {debounced, withThrottle})
			})
			if (opts?.history === true) saveHistoryDebounced(nvalStr)
		} else if (!Array.isArray(nval)) {
			// initial read not done yet: writing the full object would clobber data not loaded yet.
			// remember the changed keys only, they are merged + saved when the read lands (see refreshValFromBackend)
			each(nval as any, (v, k) => {
				if ((storedValue as any)[k] !== v) pendingWritesRef.current[k] = v
			})
		}
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
				let obj:any = undefined

				if (raw === "NO_FILE") obj = initialValue
				else {
					try {
						obj = JSON.parse(raw)
					} catch (error) {
						// unreadable file: fall back to initial value so the store is writable again
						// (next save rewrites the file), instead of staying read-only for the whole session
						console.error(`[BACKEND STATE] Error parsing JSON for ${key}, falling back to initial value`, error);
						obj = initialValue
					}
				}
				
				if (obj !== undefined) {
					// merge + persist writes that happened before the read landed (they were not saved yet)
					if (Object.keys(pendingWritesRef.current).length && !Array.isArray(obj)) {
						obj = { ...obj, ...pendingWritesRef.current }
						pendingWritesRef.current = {}
						getApi(api => {
							api.file.saveContent(pathToNote, JSON.stringify(obj), {debounced: false, withThrottle: false})
						})
						if (opts?.history === true) saveHistoryDebounced(JSON.stringify(obj))
					}
					if(opts?.debug === true) console.log(`[BACKEND STATE] refreshValFromBackend: ${key} => `, obj);
					setStoredValue(obj);
					hasBackendLoadedRef.current = true
					cb && cb(obj)
				}

			})
		})
	}

	return [storedValue, setValue, refreshValFromBackend];
}
