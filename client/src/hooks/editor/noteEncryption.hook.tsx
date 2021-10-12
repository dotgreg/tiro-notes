import React, { useState } from "react"
import { PasswordPopup } from "../../components/PasswordPopup.component"
import { decryptText, encryptText } from "../../managers/encryption.manager"

export const useNoteEncryption = (p:{
    fileContent:string

    onTextEncrypted:(textEncrypted:string) => void
    onTextDecrypted:(textDecrypted:string) => void
}) => {

    const [askForPassword, setAskForPassword] = useState<string|null>(null)
    const [shouldEncryptOnLeave, setShouldEncryptOnLeave] = useState(false)
    const [noHistoryBackupWhenDecrypted, setNoHistoryBackupWhenDecrypted] = useState(false)
    const [password, setPassword] = useState<string|null>(null)

    const ifEncryptOnLeave = (cb:(encrypted:string)=>void) => {
      
      if (shouldEncryptOnLeave && password) {
          console.log('[EVENTS EDITOR] shouldEncryptOnLeave');
          let res = encryptText(p.fileContent, password)
          if (res.cipher) cb(res.cipher)
      }
      setPassword(null)
      setNoHistoryBackupWhenDecrypted(false)
    }

    const encryptContent = (pwd:string) => {
        let newContent = p.fileContent
        let res = encryptText(newContent, pwd)
        if (res.status === 'failure') setPassword(null)
        else {
            console.log('encryption done', res);
          setShouldEncryptOnLeave(false)
          let textEncrypted = res.cipher as string
          p.onTextEncrypted(textEncrypted)
        }
      }
  
      const decryptContent = (pwd:string) => {
        let newContent = p.fileContent
        let res = decryptText(newContent, pwd)
        if (res.status === 'failure') {setPassword(null); alert('wrong password')}
        else {
            setNoHistoryBackupWhenDecrypted(true)
            setShouldEncryptOnLeave(true)
            console.log('decryption done', res);
            
            let text = res.plaintext as string
            p.onTextDecrypted(text)
        }
      }

    const APasswordPopup = 
          <PasswordPopup
            onClose={() => {setAskForPassword(null)}}
            onSubmit={(pwd) => {
                let action = askForPassword
                setAskForPassword(null)
                setPassword(pwd)
                if (action === 'toEncrypt') encryptContent(pwd)
                if (action === 'toDecrypt') decryptContent(pwd)
            }}
          ></PasswordPopup>

        const encryptButtonConfig = {
            title:'encrypt text', 
            icon:'faLock', 
            action: () => {
              if (!password) setAskForPassword('toEncrypt')
              else encryptContent(password)
            }
          }
          
          const decryptButtonConfig =  {
            title:'decrypt text', 
            icon:'faUnlock', 
            action: () => {
              if (!password) setAskForPassword('toDecrypt')
              else decryptContent(password)
            }
          }
      
    return {
        APasswordPopup,
        askForPassword,
        
        decryptButtonConfig,
        encryptButtonConfig,

        ifEncryptOnLeave,
        noHistoryBackupWhenDecrypted,
    }
}