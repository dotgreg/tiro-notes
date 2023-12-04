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
        topTab: false,
        bottomBar:  false
    })

     useEffect(() => {
         refreshPinStatus()


        //  getApi(api => {
        //     if (api.userSettings.get("beta_floating_windows") === true) return
        //     updatePinStatus("bottomBar")(false)
        //  })
     },[])

    const updatePinStatus = (key: pinStatusKey) => (value: boolean) => {
        // console.log('updatePinStatus', key, value)
        setPinStatus({
            ...pinStatus,
            [key]: value
        })
    }

    const togglePinStatus = (key: pinStatusKey) => () => {
        console.log(222222)
        setPinStatus({
            ...pinStatus,
            [key]: !pinStatus[key]
        })
    }
    
     return {
        pinStatus,

        updatePinStatus,
        togglePinStatus,

        refreshPinStatus,
    }
}