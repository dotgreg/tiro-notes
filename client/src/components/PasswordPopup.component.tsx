import React from 'react';
import styled from '@emotion/styled'
import { Popup } from './Popup.component';

export class PasswordPopup extends React.Component<{
    onSubmit: (password:string) => void
    onClose:Function
}, {
    password: string
}> {

    constructor(props:any) {
        super(props)
        this.state = {
          password: '',
        }
    }
    
    render() {
      return (
        <StyledWrapper>
            <Popup
                title="please enter your password"
                onClose={() => {this.props.onClose()}}
            >
                <div>
                    <input 
                        type="password" 
                        value={this.state.password} 
                        onChange={(e) => {
                            this.setState({password: e.target.value})
                        } } />
                    <input type="button" value='submit' onClick={e => {
                        this.props.onSubmit(this.state.password)
                    }}/>
                </div>
            </Popup>
        </StyledWrapper>
      );
    }
  }
  
  const StyledWrapper  = styled.div`
    
    
  `