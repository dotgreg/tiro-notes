import React, { useState } from 'react';
import styled from '@emotion/styled'
import { iFolder } from '../../../shared/types.shared';
import { iconFolder } from '../managers/icons.manager';
import { onFolderClickedFn } from '../hooks/app/treeFolder.hook';
import { random } from 'lodash';
import { useLocalStorage } from '../hooks/useLocalStorage.hook';
import { Icon } from './Icon.component';

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
              name={isOpen ? 'faFolderOpen' : 'faFolder'} 
              color='#d8d869'
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
          <Icon name="faEllipsisH" color="white" />
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

