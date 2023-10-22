import React, { useState }  from 'react';
import { TextModifAction } from '../../managers/textEditor.manager';
import { cssVars } from '../../managers/style/vars.style.manager';
import { ButtonsToolbar } from '../ButtonsToolbar.component';
import { iCursorInfos } from './CodeMirrorEditor.component';



//
// MOBILE TOOLBAR
//

export const NoteToolsPopup = (p: {
  cursorInfos: iCursorInfos,
	onButtonClicked: (action: TextModifAction | "aiSearch") => void
}) => {
  // if (!p.bottom) p.bottom = 140
  // let bottom = p.bottom || 140
  const [isOpen, setIsOpen] = useState(false)
  let isSelection = p.cursorInfos.from !== p.cursorInfos.to

  const btnsConfig =  [
    { icon: 'faCircle', action: () => {setIsOpen(false)}, class: 'close-button' },
    { icon: 'faAngleLeft', action: () => p.onButtonClicked('<-') },
    { icon: 'faAngleRight', action: () => p.onButtonClicked('->') },
    { icon: 'faCheckSquare', action: () => p.onButtonClicked('[x]') },
    { icon: 'faAngleUp', action: () => p.onButtonClicked('^') },
    { icon: 'faAngleDown', action: () => p.onButtonClicked('v') },
    { icon: 'faEraser', action: () => p.onButtonClicked('X') },
    { icon: 'faClone', action: () => p.onButtonClicked('C') },
  ]

   // if selection, push ai button at the second position
  if (p.cursorInfos.from !== p.cursorInfos.to) {
    btnsConfig.splice(1, 0, { icon: 'wand-magic-sparkles', action: () => {p.onButtonClicked('aiSearch'); setIsOpen(false); }})
  }

	return <div 
    className='mobile-toolbar-wrapper'
  >
    { !isOpen &&
    <div className='note-toolbar-closed-icon' onClick={() => setIsOpen(true)}>
      <i className='fa fa-circle' />
    </div>
    }

    { isOpen &&
		<ButtonsToolbar
			class='mobile-text-manip-toolbar'
      size={0.8}
			colors={[cssVars.colors.editor.mobileToolbar.font, cssVars.colors.editor.mobileToolbar.font]}
			buttons={btnsConfig}
		/>
  }
  </div>
}



export const mobileNoteToolbarCss = () => `
  .mobile-toolbar-wrapper {

    .note-toolbar-closed-icon {
      opacity: 0.2;
      background: white;
      border-radius: 50%;
      padding: 5px 8px;
      box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.75);
      &:hover {
        opacity: 1;
      }
      transition: opacity 0.2s;
      transform: scale(0.6);
    }
    // position: fixed;
    // position: absolute;
    // width: 100%;

    .buttons-toolbar-component.mobile-text-manip-toolbar {
      background: #fff;
      border-radius: 10px;
      display: flex;
      list-style: none;
      padding: 0px 10px;
      box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.2);
      align-content: center;
      justify-content: center;
      align-items: center;
      height: ${cssVars.sizes.mobile.editorBar}px;
      .toolbar-button {
        padding: 3px 5px;     
      }
      .close-button {
        margin-right: 10px;
      }
      li {
        flex: 1 1 auto;
        justify-content: center;
        display: flex;
      }
    }
    
  }
`
