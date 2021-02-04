import React, { ReactElement } from 'react';
import styled from '@emotion/styled'
import { TextModifAction } from '../../managers/textEditor.manager';
import { Icon } from '../Icon.component';
import { capitalize } from 'lodash';
import { Note } from './Note.component';
import { textToId } from '../../managers/string.manager';
import { title } from 'process';
 



//
// MAIN TOOLBAR
//

export const mainEditorToolbarConfig = (thatNote: Note) => [
  {
    title:'toggle editor', 
    icon:'faEdit', 
    action: () => {thatNote.setState({editorEnabled: !thatNote.state.editorEnabled})}
  },
  {
    title:'detach in new window', 
    icon:'faExternalLinkAlt', 
    action: () => {
      window.open(window.location.href,'popupDetached','width=600,height=600');
    }
  },
  {
    title:'insert unique id', 
    icon:'faFingerprint', 
    action: () => { 
      let newContent = thatNote.state.fileContent
      let id = textToId(thatNote.props.file.realname)
      let idtxt = `--id-${id}`
      let idSearch = `__id_${id}`
      let folder = `${thatNote.props.file.folder}`
      newContent = `${idtxt}\n[search|${idSearch} ${folder}]\n` + newContent
      thatNote.setState({fileContent: newContent})
    }
  },
  {
    title:'encrypt text', 
    icon:'faLock', 
    action: () => {
      if (!thatNote.state.password) thatNote.setState({askForPassword: 'toEncrypt'})
      else thatNote.encryptContent()
    }
  },
  {
    title:'decrypt text', 
    icon:'faUnlock', 
    action: () => {
      if (!thatNote.state.password) thatNote.setState({askForPassword: 'toDecrypt'})
      else thatNote.decryptContent()
    }
  },
  {
    title:'upload files', 
    class:'upload-button-wrapper',
    customHtml: <>
      <input className='input-file-hidden' id="file" name="file" type="file" ref={thatNote.uploadInput}  />
      <label 
        //@ts-ignore 
        for="file"><Icon name="faPaperclip" /></label>
    </>
  },
  {
    title:'delete note', 
    class:'delete',
    icon:'faTrash', 
    action: () => {
      thatNote.props.onFileDelete(thatNote.props.file.path) 
    }
  },
]




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
        { title: '<-', action: () => p.onButtonClicked('<-') },
        { title: '->', action: () => p.onButtonClicked('->') },
        { title: '[x]', action: () => p.onButtonClicked('[x]') },
        { title: '^', action: () => p.onButtonClicked('^') },
        { title: 'v', action: () => p.onButtonClicked('v') },
        { title: 'X', action: () => p.onButtonClicked('X') },
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
        p.buttons.map(button => 
          <li title={button.title}>
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

