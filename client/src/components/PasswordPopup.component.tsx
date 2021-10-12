import React, { useState } from 'react';
import styled from '@emotion/styled'
import { Popup } from './Popup.component';
import { strings } from '../managers/strings.manager';
import { cssVars } from '../managers/style/vars.style.manager';
import { Input } from './Input.component';



export const PasswordPopup = (p:{
    onSubmit: (password:string) => void
    onClose:Function
}) => {

    const [password, setPassword] = useState('')
    const submitForm = () => {
        p.onSubmit(password)
    }

    
    return (
        <StyledWrapper2>
            <Popup
                title={strings.passwordForm.explanation}
                onClose={() => {p.onClose()}}
            >
                <div>
                    <Input
                        value={password}
                        label={strings.setupForm.password}
                        type='password'
                        shouldFocus={true}
                        onChange={e => {setPassword(e)}}
                        onEnterPressed={() => {submitForm()}}
                    />


                    <button className="submit-button" onClick={e => {submitForm()}}> 
                        {strings.passwordForm.submit} 
                    </button>
                </div>
            </Popup>
        </StyledWrapper2>
      );
  }
  
  const StyledWrapper2  = styled.div`
    .submit-button {
        margin-top: 10px;
        ${cssVars.els.redButton};
        padding: 10px 20px;
    }
  `
