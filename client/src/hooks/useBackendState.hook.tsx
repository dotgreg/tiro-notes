import { useContext, useEffect, useRef, useState } from "react";
import { sharedConfig } from "../../../shared/shared.config";
import { iFile } from "../../../shared/types.shared";
import { getClientApi2 } from "./api/api.hook";

export function useBackendState<T>(key: string, initialValue: T): [T, (value: T) => void, Function] {

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
		setStoredValue(value)

		getClientApi2().then(api => {
			api.file.saveContent(pathToNote, JSON.stringify(value))
		})

	}

	const refreshValFromBackend = () => {
		getClientApi2().then(api => {
			api.file.getContent(pathToNote, raw => {
				const obj = JSON.parse(raw)
				//console.log(`[BACKEND STATE] ${key} => `, obj);
				setStoredValue(obj);
			})
		})
	}

	return [storedValue, setValue, refreshValFromBackend];
}
