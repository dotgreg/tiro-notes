export interface iEventBusMessage {
	subId: string
	data: any
}

export const createEventBus = <T>(p: {
	headerLog?: string
}) => {
	const h = p.headerLog

	const subscribers: { [sid: string]: Function } = {}

	const notify = (message: iEventBusMessage) => {
		for (let sId in subscribers) {
			const sCb = subscribers[sId];
			let once = false
			if (sId.endsWith('-once')) {
				sId = sId.replace('-once', '')
				once = true
			}

			if (sId === message.subId) {
				try {
					sCb(message.data);
					if (once) unsubscribe(`${sId}-once`)
				}
				catch (e) { h && console.log(`${h} error with function`, e); }
			}
		}
	}

	const subscribe = (subId: string, cb: (data: T) => void) => {
		subscribers[subId] = cb
	}

	const subscribeOnce = (subId: string, cb: (data: T) => void) => {
		let nSubId = `${subId}-once`
		subscribers[nSubId] = cb
	}

	const unsubscribe = (subId: string) => {
		if (subscribers[subId]) delete subscribers[subId]
	}


	return {
		notify,
		subscribe,
		subscribeOnce,
		unsubscribe
	}

}

