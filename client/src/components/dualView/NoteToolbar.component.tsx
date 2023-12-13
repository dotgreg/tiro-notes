import React, { useEffect, useState }  from 'react';
import { TextModifAction, calcSelected, seemsArithmetic, wordsCount } from '../../managers/textEditor.manager';
import { cssVars } from '../../managers/style/vars.style.manager';
import { ButtonsToolbar, iToolbarButton } from '../ButtonsToolbar.component';
import { iCursorInfos } from './CodeMirrorEditor.component';
import { deviceType } from '../../managers/device.manager';



//
// MOBILE TOOLBAR
//
export type iActionsNoteToolbar = TextModifAction | "aiSearch" | "calc" | "undo" | "redo" | "->" | "<-" | "copyLineLink" | "proofread"

export const NoteToolsPopup = (p: {
  cursorInfos: iCursorInfos,
  selection: string,
	onButtonClicked: (action: iActionsNoteToolbar) => void
}) => {
  // if (!p.bottom) p.bottom = 140
  // let bottom = p.bottom || 140
  const [isOpen, setIsOpen] = useState(false)

  const [popupTransparent, setPopupTransparent] = useState(false)
	useEffect(() => {
		if (isOpen) setPopupTransparent(true)
	}, [p.cursorInfos.y])

  const onButtonClicked = (action: iActionsNoteToolbar) => {
    setPopupTransparent(false)
    p.onButtonClicked(action)
  }

  const btnsConfigOpen:iToolbarButton[] =  [
    { icon: 'faCircle', action: () => {setIsOpen(false); setPopupTransparent(false)}, class: 'separator' },
    { icon: 'faUndo', action: () => onButtonClicked('undo') },
    { icon: 'faRedo', action: () => onButtonClicked('redo') },
    // { icon: 'copyLineLink', action: () => onButtonClicked('copyLineLink') },
    { icon: 'faAngleLeft', action: () => onButtonClicked('<-') },
    { icon: 'faAngleRight', action: () => onButtonClicked('->') },
    { icon: 'faCheckSquare', action: () => onButtonClicked('[x]') },
    { icon: 'faAngleUp', action: () => onButtonClicked('^') },
    { icon: 'faAngleDown', action: () => onButtonClicked('v') },
    { icon: 'faEraser', action: () => onButtonClicked('X') },
    { icon: 'faClone', action: () => onButtonClicked('C') },
  ]

   // if selection, push ai button at the second position
  const btnsConfigClosed:iToolbarButton[] = []
  btnsConfigClosed.push({ icon: 'faCircle', action: () => setIsOpen(true) })
  if (p.selection.length > 0) {
    let isMath = seemsArithmetic(p.selection)
    let mathBtn:iToolbarButton = { icon: 'chart-line', action: () => {}, customHtml:<div className='numbers-preview-wrapper'><i className='fa fa-chart-line'></i><span className='numbers-preview'>{wordsCount(p.selection)}</span></div>}
    if (isMath) mathBtn = { 
      icon: 'calculator', 
      customHtml: <div className='numbers-preview-wrapper'><i className='fa fa-calculator'></i><span className='numbers-preview'>{calcSelected(p.selection)}</span></div>, 
      action: () => {p.onButtonClicked('calc'); setIsOpen(false); }
    }
    const aiBtn:iToolbarButton = { icon: 'wand-magic-sparkles', action: () => {p.onButtonClicked('aiSearch'); setIsOpen(false); }}
    const copyLinkLine:iToolbarButton = { icon: 'copy', action: () => {p.onButtonClicked('copyLineLink'); setIsOpen(false); }}
    const proofreadBtn:iToolbarButton = { icon: 'spell-check', action: () => {p.onButtonClicked('proofread'); setIsOpen(false); }}
    //------------
    btnsConfigClosed.push(aiBtn)
    btnsConfigClosed.push(copyLinkLine)
    btnsConfigClosed.push(proofreadBtn)
    btnsConfigClosed.push(mathBtn)
    //------------
    // btnsConfigOpen.splice(1, 0, aiBtn)
    let mathBtn2 = {...mathBtn}
    mathBtn2.class = 'separator-right'
    // btnsConfigOpen.splice(2, 0, mathBtn2)
    btnsConfigOpen.push(mathBtn2)
    btnsConfigOpen.push(copyLinkLine)
    btnsConfigOpen.push(proofreadBtn)
    btnsConfigOpen.push(aiBtn)

  }
  

	return <div 
    className={`mobile-toolbar-wrapper device-${deviceType()} ${isOpen ? 'open' : 'closed'} ${popupTransparent ? 'popup-transparent' : ''}`}
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
  z-index:1;
  
  
  pointer-events: none;
  position: absolute;
  width: 100%;
  // z-index: 100;
  display: flex;
  justify-content: flex-end;
}
.mobile-text-manip-toolbar {
   
 
		.toolbar-button {
				padding: 13px 20px;
		}
}

.numbers-preview-wrapper {
  display: flex;
  font-size: 10px;
  font-weight: 400;
  i {
    margin-top: 2px;
  }
  .numbers-preview {
    margin-left: 5px;
  }
}

  .mobile-toolbar-wrapper {
    &.popup-transparent {
      opacity: 0.4;
    }


    .mobile-text-manip-toolbar {
      width: 10px;
      flex-direction: column;
      pointer-events: all;
      margin-right:20px;
      
      background: #fff;
      border-radius: 10px;
      display: flex;
      list-style: none;
      padding: 0px 10px;
      box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.2);
      align-content: center;
      justify-content: center;
      align-items: center;
      // height: ${cssVars.sizes.mobile.editorBar}px;
      &:hover {
        opacity: 1;
      }
      opacity: 0.4;
      left: 15px;
       
        transition: opacity 0.2s;
      
      .toolbar-button {
        padding: 3px 5px;     
      }
      .separator {
        // margin-left: 8px;
      }
      .separator-right {
        // margin-right: 8px;
      }

      li {
        flex: 1 1 auto;
        justify-content: center;
        display: flex;
      }

      &.closed {
        opacity: 0.2;
        background: none;
        box-shadow: none;
        &:hover {
          background: #fff;
          box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.2);
          opacity: 1;
        }
      }

      
    }

    &.device-mobile {
      .mobile-text-manip-toolbar {
        transform: scale(0.9);r
        opacity: 1;
        &.closed {
          opacity: 0.2;
          &:hover {
            opacity: 1;
          }
        } 
        transform: scale(1);
        .toolbar-button {
          // padding: 12px;     
        }
      }
    }
    
  }
`
