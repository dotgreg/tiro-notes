
import React, { useEffect, useRef } from 'react';
import { getTsFromString, iADate, tsToIADate } from '../../managers/date.manager';
import { getApi } from './api.hook';
import { each, isNumber } from 'lodash-es'
import { AiAnswer, cleanAiInput, genAiButtonsConfig } from '../../managers/ai.manager';
import { notifLog } from '../../managers/devCli.manager';
import { generateUUID } from '../../../../shared/helpers/id.helper';

//
// INTERFACES
//

export interface iAiApi {
    search: (
        searchText: string,
        modelName?: string
    ) => void,
    exec: (
        searchText: string,
        modelName?: string,
        cb?: (res: any) => void,
        execType?: "stream" | "single"
    ) => void,
    setStatus: (status:"new"|"stop", uuid?:string) => string,
    getStatus: (uuid:string) => boolean
}



const getModelConfig = (modelName?: string) => {
    // get all ai config
    let configAllAis = genAiButtonsConfig()
    // if no modelName, tkae first one from config
    if (!modelName) modelName = configAllAis[0].title

    // look for the right model in the config
    return configAllAis.find(i => i.title === modelName)
}


//
// EXPORT 
//


export const exec: iAiApi['exec'] = (searchText, modelName, cb, execType:"stream"| "single"="single") => {
    let modelConfig = getModelConfig(modelName)
    if (!modelConfig) {
        notifLog(`Model "${modelName}" not found in config`)
        return
    }
    let cmd = modelConfig.command
    searchText = cleanAiInput(searchText)
    cmd = cmd.replace("{{input}}", searchText)
    // replace {{}}
    getApi(api => {
        if (execType === "stream") {
            api.command.stream(cmd, (res) => {
                if (cb) cb(res)
            })
        } else {
            api.command.exec(cmd, (res) => {
                if (cb) cb(res)
            })
        }
    })
}
export const search: iAiApi['search'] = (searchText, modelName) => {
    let modelConfig = getModelConfig(modelName)
    // if does not exists, notifLog
    if (!modelConfig) notifLog(`Model "${modelName}" not found in config`)
    else {
        // force to newWindow

        let uuid = setStatus("new")
        modelConfig.typeAnswer = "newWindow"
        AiAnswer({
            uuid: uuid,
            typeAnswer: modelConfig.typeAnswer,
            aiCommand: modelConfig.command,
            aiBtnConfig: modelConfig,
            selectionTxt: searchText,
        })
    }
}

export const aiStatusManagerDic:{[key:string]:boolean} = {}
export const getStatus:iAiApi["getStatus"] = (uuid) => {
    return aiStatusManagerDic[uuid] || false
}
export const setStatus:iAiApi["setStatus"] = (status, uuid) => {
    if (status === "new") {
        // generate a new UUID
        uuid = generateUUID()
        aiStatusManagerDic[uuid] =  true
    }
    if (status === "stop" ) {
        if (uuid) aiStatusManagerDic[uuid] =  false
        else {
            each(aiStatusManagerDic, (value, key) => {
                aiStatusManagerDic[key] = false
            })
        }
        getApi(api => {
            api.ui.notification.emit({
                content: `[AI] AI generation stop requested`,
                options: {hideAfter: 3 },
                id: "ai-status"
            })
        })
    }
    console.log("setStatus", {status, uuid, aiStatusManagerDic})
    if (!uuid) uuid = ""
    return uuid
}

//
// API EXPORT 
//
export const useAiApi = (p: {}) => {
	const api: iAiApi = {search, setStatus, getStatus, exec}
	return api
}
