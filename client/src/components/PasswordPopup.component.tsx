import React from 'react';
import styled from '@emotion/styled'
import { Popup } from './Popup.component';
import { strings } from '../managers/strings.manager';
import { cssVars } from '../managers/style/vars.style.manager';
import { Input } from './Input.component';

export class PasswordPopup extends React.Component<{
    onSubmit: (password:string) => void
    onClose:Function
}, {
    password: string
    inputFocus: boolean,
}> {

    passwordInput:any
    constructor(props:any) {
        super(props)
        this.passwordInput = React.createRef()
        this.state = {
          password: '',
          inputFocus: false,
        }
    }

    submitForm = () => {
        this.props.onSubmit(this.state.password)
    }

    
    render() {
      return (
        <StyledWrapper>
            <Popup
                title={strings.passwordForm.explanation}
                inputFocus={this.state.inputFocus}
                onClose={() => {this.props.onClose()}}
            >
                <div>
                    <Input
                        value={this.state.password}
                        label={strings.setupForm.password}
                        type={'password'}
                        shouldFocus={true}
                        onChange={e => {this.setState({password: e})}}
                        onEnterPressed={() => {this.submitForm()}}
                        onFocus={e => {this.setState({inputFocus: true}) }}
                    />


                    <button className="submit-button" onClick={e => {this.submitForm()}}> 
                        {strings.passwordForm.submit} 
                    </button>
                </div>
            </Popup>
        </StyledWrapper>
      );
    }
  }
  
  const StyledWrapper  = styled.div`
    .submit-button {
        margin-top: 10px;
        ${cssVars.els.redButton};
        padding: 10px 20px;
    }
  `