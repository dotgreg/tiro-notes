import React, { useState } from "react"
import { PasswordPopup } from "../../components/PasswordPopup.component"
import { decryptText, encryptText } from "../../managers/encryption.manager"
import { filterMetaFromFileContent, addBackMetaToContent } from "../../managers/headerMetas.manager"

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
          const { content, metas } = filterMetaFromFileContent(p.fileContent)
          let res = encryptText(content, password)
          if (res.cipher) cb(addBackMetaToContent(res.cipher, metas))
      }
      setPassword(null)
      setNoHistoryBackupWhenDecrypted(false)
    }

    const encryptContent = (pwd:string) => {
        // strip header so only the body is encrypted
        const { content, metas } = filterMetaFromFileContent(p.fileContent)
        let res = encryptText(content, pwd)
        if (res.status === 'failure') setPassword(null)
        else {
            console.log('encryption done', res);
          setShouldEncryptOnLeave(false)
          let textEncrypted = res.cipher as string
          // re-add header so the saved file has header + cipher
          p.onTextEncrypted(addBackMetaToContent(textEncrypted, metas))
        }
      }
  
      const decryptContent = (pwd:string) => {
        // strip header so only the cipher body is decrypted
        const { content, metas } = filterMetaFromFileContent(p.fileContent)
        let res = decryptText(content, pwd)
        if (res.status === 'failure') {setPassword(null); alert('wrong password')}
        else {
            setNoHistoryBackupWhenDecrypted(true)
            setShouldEncryptOnLeave(true)
            console.log('decryption done', res);
            
            let text = res.plaintext as string
            // re-add header so the saved file has header + body
            p.onTextDecrypted(addBackMetaToContent(text, metas))
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