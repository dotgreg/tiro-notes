import React  from 'react';
import { TextModifAction } from '../../managers/textEditor.manager';
import { cssVars } from '../../managers/style/vars.style.manager';
import { ButtonsToolbar } from '../ButtonsToolbar.component';



//
// MOBILE TOOLBAR
//

export const NoteMobileToolbar = (p: {
  bottom?: number
	onButtonClicked: (action: TextModifAction) => void
}) => {
  // if (!p.bottom) p.bottom = 140
  // let bottom = p.bottom || 140
  let bottom = p.bottom || 50
	return <div 
    className='mobile-toolbar-wrapper'
    style={{bottom: `${bottom}px`}}
  >
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
				{ icon: 'faClone', action: () => p.onButtonClicked('C') },
			]}
		/>
	</div>
}



export const mobileNoteToolbarCss = () => `
  .mobile-toolbar-wrapper {
    // position: fixed;
    // position: absolute;
    // width: 100%;

    .mobile-text-manip-toolbar {
      display: flex;
      list-style: none;
      padding: 0px;
      align-content: center;
      justify-content: center;
      align-items: center;
      height: ${cssVars.sizes.mobile.editorBar}px;
      background: ${cssVars.colors.editor.mobileToolbar.bg};
      .toolbar-button {
        padding: 3px 5px;
      }
      li {
        flex: 1 1 auto;
        justify-content: center;
        display: flex;
      }
    }
    
  }
`
