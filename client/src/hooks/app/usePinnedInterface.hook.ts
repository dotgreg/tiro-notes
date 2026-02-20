import { cloneDeep, isBoolean } from "lodash-es";
import { getApi } from "../api/api.hook";
import { useBackendState } from "../useBackendState.hook"
import React, { useEffect, useState } from 'react';

export interface iPinStatuses {
    topTab: boolean,  
    bottomBar: boolean,
}

export type pinStatusKey = keyof iPinStatuses

export const usePinStatus= () => {
    const [pinStatus, setPinStatus, refreshPinStatus] = useBackendState<iPinStatuses>("interface-pin-element-status",{
        topTab: true, 
        bottomBar:  true 
    })

     useEffect(() => {
         refreshPinStatus()
     },[])

    const updatePinStatus = (key: pinStatusKey) => (value: boolean) => {
        // console.log('updatePinStatus', key, value)
        setPinStatus({
            ...pinStatus,
            [key]: value
        })
    }

    const togglePinStatus = (key: pinStatusKey) => () => {
        setPinStatus({
            ...pinStatus,
            [key]: !pinStatus[key]
        })
    }

	let pinStatus2 = (!isBoolean(pinStatus.topTab) && !isBoolean(pinStatus.bottomBar)) ? { topTab: true, bottomBar: true } : cloneDeep(pinStatus)
    
     return {
        pinStatus:pinStatus2,

        updatePinStatus,
        togglePinStatus,

        refreshPinStatus,
    }
}