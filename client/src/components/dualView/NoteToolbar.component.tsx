import React, { ReactElement } from 'react';
import styled from '@emotion/styled'
import { TextModifAction } from '../../managers/textEditor.manager';
import { Icon, IconSizeProp } from '../Icon.component';
import { textToId } from '../../managers/string.manager';
import { cssVars } from '../../managers/style/vars.style.manager';



//
// MOBILE TOOLBAR
//

export const NoteMobileToolbar = (p:{
  onButtonClicked: (action:TextModifAction)=>void
}) => {
  return <StyledToolbarMobile>
    <ButtonToolbar
      class='mobile-text-manip-toolbar'
      buttons={[
        { icon: 'faAngleLeft', action: () => p.onButtonClicked('<-') },
        { icon: 'faAngleRight', action: () => p.onButtonClicked('->') },
        { icon: 'faCheckSquare', action: () => p.onButtonClicked('[x]') },
        { icon: 'faAngleUp', action: () => p.onButtonClicked('^') },
        { icon: 'faAngleDown', action: () => p.onButtonClicked('v') },
        { icon: 'faEraser', action: () => p.onButtonClicked('X') },
      ]}
    />
  </StyledToolbarMobile>
}

const StyledToolbarMobile  = styled.div`
  
`



//
// LOW LEVEL GENERIC
//


export interface ToolbarButton {
  icon?:string
  title?:string
  class?:string
  customHtml?: ReactElement
  action?:Function
}

export const ButtonToolbar = (p:{
  class?:string
  buttons: ToolbarButton[]
}) => {

  return <StyledToolbar>
    <ul className={`toolbar ${p.class}`}>
      {
        p.buttons.map((button,key) => 
            button.action && 
            <li title={button.title} key={key}>
              <Button {...button}/>
            </li> 
        )
      }
    </ul>
  </StyledToolbar>
}
const StyledToolbar  = styled.div`
    
`


export const Button = (p:ToolbarButton) => {
  let insideHtml = <></>
  if (p.title) insideHtml =  <>{p.title}</>
  if (p.icon) insideHtml =  <Icon name={p.icon} />
  if (p.customHtml) insideHtml =  p.customHtml

  return <button 
    className={p.class}
    onClick={e => {p.action && p.action(e)}}> 
    { insideHtml }
  </button>
}


export const mobileNoteToolbarCss = `
  .mobile-text-manip-toolbar {
    position: fixed;
    bottom: ${cssVars.sizes.mobile.editorBar}px;
    display: flex;
    list-style: none;
    width: 100%;
    padding: 0px;
    height: ${cssVars.sizes.mobile.editorBar}px;
    background: ${cssVars.colors.editor.mobileToolbar.bg};
    li {
      flex: 1 1 auto;
      button {
        svg {
          color: ${cssVars.colors.editor.mobileToolbar.font};
        }
        ${cssVars.els.button};
        width: 100%;
        padding: 10px;
      }
    }
  }
`