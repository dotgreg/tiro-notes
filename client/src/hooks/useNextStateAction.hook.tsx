import React, { useContext, useEffect, useRef, useState } from 'react';
import { ClientApiContext, iClientApi } from './api/api.hook';

interface iNextStateAction {
	name: string,
	data?: any
}
type iNextStateCb = (api: iClientApi, data?: any) => void


// export const useNextState = () => {
// 	const api = useContext(ClientApiContext);


// 	// INTERNAL
// 	const [nextStateAction, setNextStateAction] = useState<iNextStateAction>({ name: '', data: {} });
// 	const nextStateCb = useRef<iNextStateCb>(() => { })

// 	useEffect(() => {
// 		if (!api) return
// 		nextStateCb.current(api, nextStateAction)
// 	}, [nextStateAction])

// 	// EXPORTED
// 	const onNextStateTrigger = (p: iNextStateAction) => {
// 		console.log('0046 11');
// 		setNextStateAction(p)
// 	}
// 	const nextState = (cb: iNextStateCb) => { nextStateCb.current = cb }

// 	return {
// 		onNextStateTrigger,
// 		nextState
// 	}
// }



export const useNextState = () => {
	const api = useContext(ClientApiContext);

	// INTERNAL
	const [nextStateAction, setNextStateAction] = useState<iNextStateAction>({ name: '', data: {} });
	const nextStateCbs = useRef<{ [name: string]: iNextStateCb }>({})

	useEffect(() => {
		// console.log('0046 USEEFFECT! => ', nextStateAction.name);
		if (!api) return
		const cb = nextStateCbs.current[nextStateAction.name]
		if (cb) cb(api, nextStateAction.data)
	}, [nextStateAction])

	// EXPORTED
	const onNextStateTrigger = (p: iNextStateAction) => {
		// console.log('0046 DECLARE EVENT ', nextStateAction, p, p.name);
		setNextStateAction(p)
	}
	const addNextStateAction = (name: string, cb: iNextStateCb) => {
		nextStateCbs.current[name] = cb
	}

	return {
		onNextStateTrigger,
		addNextStateAction
	}
}
