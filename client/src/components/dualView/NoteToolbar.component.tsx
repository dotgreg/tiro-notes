import React, { useState }  from 'react';
import { TextModifAction, seemsArithmetic, wordsCount } from '../../managers/textEditor.manager';
import { cssVars } from '../../managers/style/vars.style.manager';
import { ButtonsToolbar, iToolbarButton } from '../ButtonsToolbar.component';
import { iCursorInfos } from './CodeMirrorEditor.component';
import { deviceType } from '../../managers/device.manager';



//
// MOBILE TOOLBAR
//

export const NoteToolsPopup = (p: {
  cursorInfos: iCursorInfos,
  selection: string,
	onButtonClicked: (action: TextModifAction | "aiSearch" | "calc") => void
}) => {
  // if (!p.bottom) p.bottom = 140
  // let bottom = p.bottom || 140
  const [isOpen, setIsOpen] = useState(false)

  const btnsConfigOpen:iToolbarButton[] =  [
    { icon: 'faCircle', action: () => {setIsOpen(false)}, class: 'separator' },
    { icon: 'faAngleLeft', action: () => p.onButtonClicked('<-') },
    { icon: 'faAngleRight', action: () => p.onButtonClicked('->') },
    { icon: 'faCheckSquare', action: () => p.onButtonClicked('[x]') },
    { icon: 'faAngleUp', action: () => p.onButtonClicked('^') },
    { icon: 'faAngleDown', action: () => p.onButtonClicked('v') },
    { icon: 'faEraser', action: () => p.onButtonClicked('X') },
    { icon: 'faClone', action: () => p.onButtonClicked('C') },
  ]

   // if selection, push ai button at the second position
  const btnsConfigClosed:iToolbarButton[] = [
    { icon: 'faCircle', action: () => setIsOpen(true) },
  ]
  if (p.selection.length > 0) {
    let isMath = seemsArithmetic(p.selection)
    let mathBtn:iToolbarButton = { icon: 'chart-line', action: () => {}, customHtml:<div className='number-words-wrapper'><i className='fa fa-chart-line'></i><span className='number-words'>{wordsCount(p.selection)}</span></div>}
    if (isMath) mathBtn = { icon: 'calculator', action: () => {p.onButtonClicked('calc'); setIsOpen(false); }}
    const aiBtn:iToolbarButton = { icon: 'wand-magic-sparkles', action: () => {p.onButtonClicked('aiSearch'); setIsOpen(false); }}
    //------------
    btnsConfigClosed.push(aiBtn)
    btnsConfigClosed.push(mathBtn)
    //------------
    btnsConfigOpen.splice(1, 0, aiBtn)
    let mathBtn2 = {...mathBtn}
    mathBtn2.class = 'separator'
    btnsConfigOpen.splice(2, 0, mathBtn2)
  }

	return <div 
    className={`mobile-toolbar-wrapper device-${deviceType()}`}
  >
    { !isOpen &&
    // <div className='note-toolbar-closed-icon' onClick={() => setIsOpen(true)}>
    //   <i className='fa fa-circle' />
    // </div>
    <ButtonsToolbar
			class='mobile-text-manip-toolbar closed'
      size={deviceType() === "desktop" ? 0.8 : 1}
			colors={[cssVars.colors.editor.mobileToolbar.font, cssVars.colors.editor.mobileToolbar.font]}
			buttons={btnsConfigClosed}
		/>
    }

    { isOpen &&
		<ButtonsToolbar
			class='mobile-text-manip-toolbar'
      size={deviceType() === "desktop" ? 0.8 : 1}
			colors={[cssVars.colors.editor.mobileToolbar.font, cssVars.colors.editor.mobileToolbar.font]}
			buttons={btnsConfigOpen}
		/>
  }
  </div>
}



export const mobileNoteToolbarCss = () => `
.mobile-text-manip-toolbar-wrapper {
	position: absolute;
	transform: translate(0%, -50%);
  z-index: 100;
}
.mobile-text-manip-toolbar {
		.toolbar-button {
				padding: 13px 20px;
		}
}

.number-words-wrapper {
  display: flex;
  font-size: 10px;
  font-weight: 400;
  .number-words {
    margin-left: 5px;
  }
}

  .mobile-toolbar-wrapper {
    


    .mobile-text-manip-toolbar {
      position: absolute;
      left: 0px;
      transform: scale(0.9);
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
      &:hover {
        opacity: 1;
      }
      opacity: 0.2;
      left: 15px;
       
        transition: opacity 0.2s;
      
      .toolbar-button {
        padding: 3px 5px;     
      }
      .separator {
        margin-right: 8px;
      }

      li {
        flex: 1 1 auto;
        justify-content: center;
        display: flex;
      }

      &.closed {
        opacity: 0.2;
        &:hover {
          opacity: 1;
        }
      }

      
    }

    &.device-mobile {
      .mobile-text-manip-toolbar {
        opacity: 1;
        &.closed {
          opacity: 0.2;
          &:hover {
            opacity: 1;
          }
        } 
        transform: scale(1);
        .toolbar-button {
          padding: 12px;     
        }
      }
    }
    
  }
`
