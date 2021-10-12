import React, { useEffect, useRef, useState } from 'react';
import { sharedConfig } from '../../../../shared/shared.config';
import { Input } from '../../components/Input.component';
import { Popup } from '../../components/Popup.component';
import { getCookie, setCookie } from '../../managers/cookie.manager';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { strings } from '../../managers/strings.manager';


export const getLoginToken = ():string => {
    const cookie = getCookie('tiro-login-token')
    return cookie ? cookie : ''
}
export const setLoginToken = (token:string) => {
    setCookie('tiro-login-token', token, sharedConfig.tokenRefreshInHours)
}

export const useLoginToken = (p:{
    onLoginAsked: Function
    onLoginSuccess: Function
}) => {

    const [displayLoginPopup, setDisplayLoginPopup] = useState(false)

    const [user, setUser] = useState('')
    const [password, setPassword] = useState('')
    
    const [formMessage, setFormMessage] = useState<['error'|'success',string]>()

    // SOCKET INTERACTIONS
    const listenerId = useRef<number>(0)

    useEffect(() => {
        listenerId.current = clientSocket2.on('getLoginInfos', data => {   
           switch (data.code) {
               case 'SUCCESS':
                    // register token here
                    if (!data.token) return 
                    setLoginToken(data.token)
                    setDisplayLoginPopup(false)

                    // custom logic after login success event
                    p.onLoginSuccess()
                   break;
               case 'WRONG_TOKEN':
                   setDisplayLoginPopup(true)
                   setFormMessage(['error', strings.loginForm.wrongToken])

                   // custom logic after LoginAsked
                   p.onLoginAsked()
                    break;
               case 'WRONG_USER_PASSWORD':
                    setFormMessage(['error', strings.loginForm.wrongUserPassword])
                    setDisplayLoginPopup(true)
                   break;
           
               default:
                   break;
            }    
        })

        return () => {
            clientSocket2.off(listenerId.current)
        }
    }, [])

    const submitForm = () => {
        setFormMessage(undefined)
        clientSocket2.emit('sendLoginInfos', { user, password, token: getLoginToken()}) 
    }

    const [inputFocus, setInputFocus] = useState(1)

    const LoginPopupComponent = (p:{
        
    }) => <>
        {displayLoginPopup && 
            <div className="setup-popup-component">
                <Popup
                    title={strings.setupForm.title}
                    onClose={() => {}}
                >
                    <div>
                        <Input
                            shouldFocus={inputFocus === 1}
                            value={user}
                            onEnterPressed={() => { setInputFocus(2) }}
                            label={strings.setupForm.user}
                            onChange={e => {setUser(e)}}
                            />
                        <Input
                            shouldFocus={inputFocus === 2}
                            value={password}
                            label={strings.setupForm.password}
                            type={'password'}
                            onEnterPressed={() => {submitForm()}}
                            onChange={e => {setPassword(e)}}
                        />

                        <button value='submit' className="submit-button" onClick={e => {submitForm()}}> 
                            {strings.setupForm.submit} 
                        </button>

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
        displayLoginPopup,
        LoginPopupComponent
    }
}

export const loginTokenCss = `
    .login-popup-component {
    }
`