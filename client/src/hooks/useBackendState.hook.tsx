import { useContext, useEffect, useRef, useState } from "react";
import { sharedConfig } from "../../../shared/shared.config";
import { getApi, getClientApi2 } from "./api/api.hook";
import { cloneDeep } from "lodash";

export function useBackendState<T>(key: string, initialValue: T, debug: boolean=false): [T, (value: T) => void, Function] {

	const [storedValue, setStoredValue] = useState(initialValue)

	// during hook load, fetch, if it exists the note content

	// => /.tiro/states/user-settings.md if using useBackendState('user-settings')
	const pathToNote = `/${sharedConfig.path.configFolder}/${sharedConfig.path.backendStateFolder}/${key}.md`

	const errorMsg = `[BACKEND STATE] "${key}" clientApi not loaded! Persistance system will not work correctly`

	// let file:iFile
	// file.
	// fetch content on initial loading
	useEffect(() => {
		refreshValFromBackend();
	}, [])

	// persistence logic 
	const setValue = value => {
		const nval = cloneDeep(value)
		setStoredValue(cloneDeep(nval))
		if(debug) console.log(`[BACKEND STATE] setValue: ${key} => `, nval);
		getApi(api => {
			api.file.saveContent(pathToNote, JSON.stringify(nval))
		})

	}

	const refreshValFromBackend = (cb?: Function) => {
		getApi(api => {
			api.file.getContent(pathToNote, raw => {
				const obj = JSON.parse(raw)
				if(debug) console.log(`[BACKEND STATE] refreshValFromBackend: ${key} => `, obj);
				setStoredValue(obj);
				cb && cb(obj)
			})
		})
	}

	return [storedValue, setValue, refreshValFromBackend];
}
