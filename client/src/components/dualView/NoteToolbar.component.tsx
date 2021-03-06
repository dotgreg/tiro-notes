import React, { ReactElement } from 'react';
import styled from '@emotion/styled'
import { TextModifAction } from '../../managers/textEditor.manager';
import { Icon, IconSizeProp } from '../Icon.component';
import { textToId } from '../../managers/string.manager';
import { cssVars } from '../../managers/style/vars.style.manager';
import { ButtonsToolbar } from '../ButtonsToolbar.component';



//
// MOBILE TOOLBAR
//

export const NoteMobileToolbar = (p:{
  onButtonClicked: (action:TextModifAction)=>void
}) => {
  return <div>
    <ButtonsToolbar
      class='mobile-text-manip-toolbar'
      colors={[cssVars.colors.editor.mobileToolbar.font, cssVars.colors.editor.mobileToolbar.font]}
      buttons={[
        { icon: 'faAngleLeft', action: () => p.onButtonClicked('<-') },
        { icon: 'faAngleRight', action: () => p.onButtonClicked('->') },
        { icon: 'faCheckSquare', action: () => p.onButtonClicked('[x]') },
        { icon: 'faAngleUp', action: () => p.onButtonClicked('^') },
        { icon: 'faAngleDown', action: () => p.onButtonClicked('v') },
        { icon: 'faEraser', action: () => p.onButtonClicked('X') },
      ]}
    />
  </div>
}



export const mobileNoteToolbarCss = () => `
  .mobile-text-manip-toolbar {
    position: fixed;
    bottom: ${cssVars.sizes.mobile.editorBar + 10}px;
    display: flex;
    list-style: none;
    width: 100%;
    padding: 0px;
    align-content: center;
    justify-content: center;
    align-items: center;
    height: ${cssVars.sizes.mobile.editorBar}px;
    background: ${cssVars.colors.editor.mobileToolbar.bg};
    li {
      flex: 1 1 auto;
      justify-content: center;
      display: flex;
    }
  }
`
