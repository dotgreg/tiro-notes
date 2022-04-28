import { useContext, useEffect, useState } from "react";
import { sharedConfig } from "../../../shared/shared.config";
import { getClientApi } from "./app/clientApi.hook";

export function useBackendState<T>(key: string, initialValue: T): [T, (value: T) => void] {

	const [storedValue, setStoredValue] = useState(initialValue)

	// during hook load, fetch, if it exists the note content

	// => /.tiro/states/user-settings.md if using useBackendState('user-settings')
	const pathToNote = `/${sharedConfig.path.configFolder}/${sharedConfig.path.backendStateFolder}/${key}.md`

	const errorMsg = `[BACKEND STATE] "${key}" clientApi not loaded! Persistance system will not work correctly`

	// fetch content on initial loading
	useEffect(() => {
		getClientApi().then(api => {
			api.getFileContent(pathToNote, raw => {
				const obj = JSON.parse(raw)
				console.log(`[BACKEND STATE] ${key} => `, obj);
				setStoredValue(obj);
			})
		})
	}, [])

	// persistence logic 
	const setValue = value => {
		setStoredValue(value)
		getClientApi().then(api=> {
			api.saveFileContent(pathToNote, JSON.stringify(value))
		})
	}

	return [storedValue, setValue];
}

//	const [val, setVal] = useBackendState('user-settings', { size: 12, test: 'world' })

// 1 val prends les valeurs de base données par initVal
// lors de la create du hook, useEffect, lance un clientApi appel vers getNote
   // parse cette note vers tableau
   // modifier alors val
// quand on utilise setVal
		//	set val ET saveNote
