import React, { useEffect, useRef, useState } from 'react';
import { sharedConfig } from '../../../../shared/shared.config';
import { configClient } from "../../config"
import { cssVars } from '../../managers/style/vars.style.manager';
import { getApi } from '../api/api.hook';
import { useInterval } from '../interval.hook';


const generateTitle = (): string => {
	let newTitle = ''
	// if (window.location.host.includes(configClient.global.frontendPort.toString())) newTitle =  `Tiro (PROD ${configClient.version})`
	// else newTitle = `/!\\ DEV /!\\`
	newTitle = `Tiro (${configClient.version})`
	return newTitle
}

export const useConnectionIndicator = () => {
	const listenerIds = useRef<number[]>([])
	const [isSocketConnected, setIsSocketConnected] = useState(false)
	const [backOnline, setBackOnline] = useState(false)


	// DURING WHOLE LIFECYCLE APP, UPDATE TITLE ACCORDING 
	// TO CONNECTION STATUS
	let warning1 = '(DISCONNECTED)'
	let warning2 = '(/!\\ DISCONNECTED /!\\)'
	const warning = useRef(warning1)
	useInterval(() => {
		warning.current = (warning.current === warning1) ? warning2 : warning1
		let title = isSocketConnected ?
			`${generateTitle()} (Connected)` :
			`${generateTitle()} ${warning.current}`
		if (deviceType() === "mobile") return
		document.title = title
	}, 1000)


	// LIFECYCLE EVENTS
	useEffect(() => {
		getApi(api => {
			api.watch.appStatus(status => {
				if (status.isConnected === false) {
					toggleSocketConnection(false);
				} else if (status.isConnected === true) {
					toggleSocketConnection(true);
					setBackOnline(true)
					setTimeout(() => { setBackOnline(false) }, 1000)	
				}
			})
		})
	}, [])

	const toggleSocketConnection = (state: boolean) => {
		const log = sharedConfig.client.log.verbose
		log && console.log(`[SOCKET CONNECTION TOGGLE] to ${state}`);
		setIsSocketConnected(state)
	}


	const connectionStatusComponent = () => {
		let res = ['connected', 'connected']
		if (backOnline) res = ['back-online', 'back online']
		if (!isSocketConnected) res = ['disconnected', 'disconnected']

		return (
			<div className="connection-status">
				<div className={res[0]}>{res[1]}
				</div>
			</div>
		)
	}

	return {
		isConnected: isSocketConnected,
		connectionStatusComponent,
		toggleSocketConnection
	}

}

export const connectionIndicatorCss = () => `
.connection-status {
  font-size: 9px;
  z-index: 11;
  a {
    margin-left: 10px;
    color: white;
  }
  .back-online, .disconnected {
    position: absolute;
    text-align:center;
    color:white;
    top: 0px;
    left: 0px;
    width: 100vw;
    padding: 1px;
  }
  .back-online{
    background: green;
  }
  .disconnected{
    background: ${cssVars.colors.main};
  }
  .connected {
    display:none;
    position: absolute;
    bottom: 5px;
    right: 5px;
    color: ${cssVars.colors.green};
  }
}
`
