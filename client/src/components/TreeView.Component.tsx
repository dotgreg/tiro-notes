import React, { useState } from 'react';
import styled from '@emotion/styled'
import { iFolder } from '../../../shared/types.shared';
import { iconFolder } from '../managers/icons.manager';
import { onFolderClickedFn } from '../hooks/app/treeFolder.hook';
import { random } from 'lodash';
import { useLocalStorage } from '../hooks/useLocalStorage.hook';
import { Icon } from './Icon.component';
import { cssVars } from '../managers/style/vars.style.manager';
import { strings } from '../managers/strings.manager';

export type onFolderDragStartFn = (folder:iFolder) => void
export type onFolderDropFn = (folder:iFolder) => void

export const TreeView = (p:{
  folder: iFolder,
  current:string,
  onFolderClicked: onFolderClickedFn

  onFolderDragStart: onFolderDragStartFn
  onFolderDragEnd: () => void
  onFolderDrop: onFolderDropFn
}) => {
  return (
    <div className="folder-tree-view-component">
      <h3 className='subtitle'>{strings.folders}</h3>
      <FolderView 
        folder={p.folder}
        current={p.current}
        onFolderClicked={p.onFolderClicked}

        onFolderDragStart={p.onFolderDragStart}
        onFolderDragEnd={p.onFolderDragEnd}
        onFolderDrop={p.onFolderDrop}
      />
    </div>
  )
}

export const FolderView = (p:{
  folder: iFolder,
  current:string,
  onFolderClicked: onFolderClickedFn
  onFolderDragStart: onFolderDragStartFn
  onFolderDragEnd: () => void
  onFolderDrop: onFolderDropFn
}) => {
  const [isOpen, setIsOpen] = useLocalStorage(`treeview-${p.folder.key}`, false)
  const [isMenuOpened, setIsMenuOpened] = useState(false)

  const isCurrentFolder = p.current === p.folder.key
  return (
    <li 
      className={`folder-wrapper ${isCurrentFolder ? 'current':''}`}
      draggable={true}
      onDrop={(e) => {
        if (!p.folder.key) return
        p.onFolderDrop(p.folder)
        e.stopPropagation()
      }}
      onDragStart={(e) => {
        if (!p.folder.key) return
        p.onFolderDragStart(p.folder)
        e.stopPropagation()
      }}
      onDragEnd={() => {
        if (!p.folder.key) return
        p.onFolderDragEnd()
      }}
      onMouseLeave={() => {
        isMenuOpened && setIsMenuOpened(false)
      }}
    >
      <div className="folder-title">
        <span className="icon" onClick={e=> {setIsOpen(!isOpen)}}>
          {
            p.folder.children &&
            <Icon
              name={isOpen ? 'faCaretDown' : 'faCaretRight'} 
              color={cssVars.colors.main}
            />
          }
        </span>
        <span  className="title" onClick={e=> {p.onFolderClicked(p.folder.key)}}>
          {p.folder.title}
        </span>
        <span 
          onClick={() => {
            // alert(p.folder.title)
            setIsMenuOpened(!isMenuOpened)
          }}
          className="context-menu-wrapper">
          <Icon name="faEllipsisH" color={cssVars.colors.l1.font} />
          { isMenuOpened &&
            <div className="context-menu">
              <div onClick={() => {
                alert(`rename ${p.folder.title}`);
                setIsMenuOpened(false)
              }} >move</div>
            </div>
          }
        </span>
      </div>


      { isOpen &&
        <ul className="folder-children">
        {
          p.folder.children && p.folder.children.map( child => 
            <FolderView 
              folder={child}
              current={p.current}
              onFolderClicked={p.onFolderClicked}
              onFolderDragStart={p.onFolderDragStart}
              onFolderDragEnd={p.onFolderDragEnd}
              onFolderDrop={p.onFolderDrop}
            />
          )
        }
      </ul>
      }
    </li>
  )
}

export const l1Subtitle = `
  .title {
    padding-left: 4px;
    cursor: pointer;
    padding: 0px 20px 0px 0px;
  }
`

export const folderTreeCss = `
.folder-tree-view-component {
  padding: ${cssVars.sizes.block}px;
  margin: 0px 0px 100px 0px;

  ul.folder-children {
    margin: 0px 0px 0px 0px;
    padding: 0px 0px 0px 10px;
  }

  li.folder-wrapper {

    position: relative;
    list-style: none;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;

    .context-menu-wrapper {
      position: absolute;
      right: 5px;
      top: 5px;
      display:none;
      .context-menu {
        position: absolute;
        right: -15px;
        top: 17px;
        background: white;
        color: black;
        padding: 5px 10px;
        width: 70px;
        z-index: 10;
        border-radius: 4px;
      }
    }
    .folder-title:hover > .context-menu-wrapper {
      cursor:pointer;
      display:block;
    }
    &.current > .folder-title {
        color: ${cssVars.colors.main};
        text-decoration: underline;
    }
    .folder-title {
      padding: 1px;
      position:relative;
      padding-left: 20px;
      .icon {
        position: absolute;
        left: 2px;
        cursor: pointer;
        padding: 1px;
        top: 0px;
      }
      
    }
  }
  
}
`