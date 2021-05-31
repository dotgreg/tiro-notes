import styled from '@emotion/styled';
import React, { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage.hook';
import { strings } from '../../managers/strings.manager';
import { Popup } from '../Popup.component';
import { Input, InputType } from '../Input.component';

type ConfigPanel = {
    title:string, 
    fields: ConfigField[]
}
type ConfigField = {
    type: InputType,
    var: any, 
    title: string,
    expl?: string
    modifier: Function
}


type SettingParam = 'backend-port' | 'backend-protocol'
export const getSetting = (settingName:SettingParam) => {
   return localStorage.getItem(`settings-${settingName}`)?.replaceAll("\"","");
}

export const SettingsPopup = (p:{
    onClose: Function
}) => {
    
    const [backendPort, setBackendPort] = useLocalStorage<number>('settings-backend-port', -1)
    const [backendProtocol, setBackendProtocol] = useLocalStorage<'http'|'https'|'same'>('settings-backend-protocol', 'same')

    const s = strings.settingsPopup
    const conf:ConfigPanel[] = [
        {
            title: s.backend.title,
            fields: [
                { type: 'text', var: backendPort, title: s.backend.port, expl: s.backend.portExpl, modifier: setBackendPort },
                { type: 'text', var: backendProtocol, title: s.backend.protocol, expl: s.backend.protocolExpl, modifier: setBackendProtocol },
            ]
        }
    ]

    useEffect(() => {
    }, [])

    return (
        <StyledDiv>
            <Popup
                title={`${s.title}`}
                onClose={() => {
                    p.onClose()
                }}
            >


            {
                conf.map( panel => 
                    <div className="settings-panel">
                        <h3>{panel.title}</h3>
                        {
                            panel.fields.map( field => 
                                <div className="field-wrapper">
                                    <Input
                                        value={field.var}
                                        label={field.title}
                                        type={field.type}
                                        onChange={e => {
                                            console.log(`[SETTINGS] frontend setting ${field.title} changed for ${e}`);
                                            field.modifier(e)
                                        }}
                                    />
                                </div>    
                            ) 
                        }
                    </div>    
                )
            }
            </Popup>
        </StyledDiv>
    )
}

export const StyledDiv = styled.div`
    .popup-wrapper .popupContent {
        padding: 20px;
    }
    .buttons {
        display: flex;
        padding: 20px 0px 0px 0px;
        button {
            width: 30%;
            padding: 10px;
        }
    }
`