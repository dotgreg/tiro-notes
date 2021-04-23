import React, { useEffect, useRef, useState } from 'react';
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
    setCookie('tiro-login-token', token, 1)
}

export const useLoginToken = (p:{cleanListAndFileContent:Function}) => {

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
                   break;
               case 'WRONG_TOKEN':
                    p.cleanListAndFileContent()
                    setDisplayLoginPopup(true)
                    setFormMessage(['error', strings.loginForm.wrongToken])
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

    const LoginPopupComponent = (p:{
        
    }) => <>
        {displayLoginPopup && 
            <div className="setup-popup-component">
                <Popup
                    title="Login to Tiro"
                    onClose={() => {}}
                >
                    <div>
                        <Input
                            value={user}
                            label={strings.setupForm.user}
                            onChange={e => {setUser(e)}}
                        />
                        <Input
                            value={password}
                            label={strings.setupForm.password}
                            type={'password'}
                            onChange={e => {setPassword(e)}}
                        />

                        <input type="button" value='submit' className="submit-button" onClick={e => {
                            setFormMessage(undefined)
                            clientSocket2.emit('sendLoginInfos', { user, password, token: getLoginToken()}) 
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
        displayLoginPopup,
        LoginPopupComponent
    }
}

export const loginTokenCss = `
    .login-popup-component {
    }
`