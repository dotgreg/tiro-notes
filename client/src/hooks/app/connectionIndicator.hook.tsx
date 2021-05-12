import React, { useEffect, useRef, useState }  from 'react';
import { configClient } from "../../config"
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { strings } from '../../managers/strings.manager';
import { cssVars } from '../../managers/style/vars.style.manager';
import { useInterval } from '../interval.hook';

const generateTitle = ():string => {
  let newTitle = ''
  if (window.location.host.includes(configClient.global.frontendPort.toString())) newTitle =  `Tiro (PROD ${configClient.version})`
  else newTitle = `/!\\ DEV /!\\`
  return newTitle
}

export const useConnectionIndicator = (setCanEdit:Function) => {
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
    document.title = title
  }, 1000)


  // LIFECYCLE EVENTS
  useEffect(() => {
    // LISTENING TO SOCKET LIFECYCLE EVENTS
    listenerIds.current[0] = clientSocket2.on('disconnect', 
      () => { toggleSocketConnection(false); setCanEdit(false); }
    )
    listenerIds.current[1] = clientSocket2.on('reconnect', 
      () => {
        toggleSocketConnection(true); 
        setBackOnline(true)
        setTimeout(() => {setBackOnline(false)}, 1000)
        setCanEdit(true);
      }
    )
    listenerIds.current[2] = clientSocket2.on('connect', 
      () => {
        toggleSocketConnection(true); 
        setBackOnline(true)
        setTimeout(() => {setBackOnline(false)}, 1000)
        setCanEdit(true); 
      }
    )

    return () => {
      listenerIds.current.forEach((id) => {
        clientSocket2.off(id)
      })
    }
  }, [])
      
  const toggleSocketConnection = (state: boolean) => {
    console.log(`[SOCKET CONNECTION TOGGLE] to ${state}`);
    setIsSocketConnected(state)
  }
  

  const connectionStatusComponent = () => {
    let res = ['connected', 'connected']
    if (backOnline) res = ['back-online', 'back online']
    if (!isSocketConnected) res = ['disconnected', 'disconnected']

    return (
      <div className="connection-status">
          <div className={res[0]}>{res[1]} 
            {!isSocketConnected && 
              <a href={`${configClient.global.protocol}://${configClient.global.socketUrl}:${configClient.global.socketPort}`} target="_blank">
                {strings.clickHereDisconnected}
              </a>
            }
          </div>
      </div>
    )}
  
  return {
    connectionStatusComponent,
    toggleSocketConnection
  }

}

export const connectionIndicatorCss = `
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