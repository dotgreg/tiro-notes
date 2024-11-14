
import React, { useEffect, useRef } from 'react';
import { getTsFromString, iADate, tsToIADate } from '../../managers/date.manager';
import { getApi } from './api.hook';
import { isNumber } from 'lodash-es'
import { AiAnswer, genAiButtonsConfig } from '../../managers/ai.manager';
import { notifLog } from '../../managers/devCli.manager';

//
// INTERFACES
//

export interface iAiApi {
    search: (
        searchText: string,
        modelName?: string
    ) => void
}





//
// EXPORT 
//
export const search: iAiApi['search'] = (searchText, modelName) => {
    // get all ai config
    let configAllAis = genAiButtonsConfig()
    console.log("search", {searchText, modelName, configAllAis})
    // if no modelName, tkae first one from config
    if (!modelName) modelName = configAllAis[0].title

    // look for the right model in the config
    let modelConfig = configAllAis.find(i => i.title === modelName)
    // if does not exists, notifLog
    if (!modelConfig) notifLog(`Model "${modelName}" not found in config`)
    else {
        // force to newWindow
        modelConfig.typeAnswer = "newWindow"
        AiAnswer({
            typeAnswer: modelConfig.typeAnswer,
            aiCommand: modelConfig.command,
            aiBtnConfig: modelConfig,
            selectionTxt: searchText,
        })
    }
}

//
// API EXPORT 
//
export const useAiApi = (p: {}) => {
	const api: iAiApi = {search}
	return api
}
