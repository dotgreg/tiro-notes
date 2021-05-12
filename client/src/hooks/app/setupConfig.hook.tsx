import React, { useEffect, useRef, useState } from 'react';
import { iSetupForm } from '../../../../shared/types.shared';
import { Input } from '../../components/Input.component';
import { Popup } from '../../components/Popup.component';
import { clientSocket, clientSocket2 } from '../../managers/sockets/socket.manager';
import { strings } from '../../managers/strings.manager';
import { cssVars } from '../../managers/style/vars.style.manager';
import { useStatMemo } from "../useStatMemo.hook"
import { getLoginToken } from './loginToken.hook';

export const useSetupConfig = (p: {
    cleanAllApp: Function
}) => {

    const [displayWelcomePopup, setDisplayWelcomePopup] = useState(false)

    const [user, setUser] = useState('')
    const [password, setPassword] = useState('')
    const [dataFolder, setDataFolder] = useState('')
    
    const [formMessage, setFormMessage] = useState<['error'|'success',string]>()

    // SOCKET INTERACTIONS
    const listenerId = useRef<number>(0)
    useEffect(() => {
        console.log(`[SETUP CONFIG] init socket listener`);
        listenerId.current = clientSocket2.on('getSetupInfos',data => {   
                if (data.code === 'SUCCESS_CONFIG_CREATION') {
                    setFormMessage(['success',`${strings.setupForm.successReload}`])
                    setTimeout(() => {
                        window.location.reload()
                    }, 3000)
                } else {
                    if (data.code === 'ASK_SETUP') {
                        p.cleanAllApp()
                        setDisplayWelcomePopup(true)
                    }
                    else {
                        setFormMessage(['error',`${data.code}: ${data.message}`])
                    }
                }
          }
        )
        return () => {
            console.log(`[SETUP CONFIG] clean socket listener`);
            clientSocket2.off(listenerId.current)
        }
    }, [])

    const SetupPopupComponent = (p:{
        
    }) => <>
        {displayWelcomePopup && 
            <div className="setup-popup-component">
                <Popup
                    title="Welcome to Tiro"
                    onClose={() => {}}
                >
                    <p>{strings.setupForm.introText}</p> <br/>
                    <div>
                        <Input
                            value={user}
                            label={strings.setupForm.user}
                            explanation={strings.setupForm.userExplanation}
                            onChange={e => {setUser(e)}}
                        />
                        <Input
                            value={password}
                            label={strings.setupForm.password}
                            type={'password'}
                            explanation={strings.setupForm.passwordExplanation}
                            onChange={e => {setPassword(e)}}
                            />
                        <Input
                            value={dataFolder}
                            label={strings.setupForm.dataFolder}
                            explanation={strings.setupForm.folderExplanation}
                            onChange={e => {setDataFolder(e)}}
                        />
                        

                        <input type="button" value='submit' className="submit-button" onClick={e => {
                            // console.log({user,password,dataFolder})
                            setFormMessage(undefined)
                            clientSocket2.emit('sendSetupInfos', {form:{user,password,dataFolder}, token: getLoginToken()}) 
                        }}/>

                        {
                            formMessage && 
                            <div className={formMessage[0]}>
                                {formMessage[1]}
                            </div>
                        }

                    </div>
                </Popup>
            </div>}
        </>

    return {
        displayWelcomePopup,
        SetupPopupComponent
    }
}

export const setupConfigCss = `
    .setup-popup-component {
        .submit-button {
            margin-top: 10px;
            ${cssVars.els.redButton};
            padding: 10px 20px;
        }
        .error {
            color: ${cssVars.colors.main};
        }
        .success {
            color: ${cssVars.colors.green};
        }
    }
`