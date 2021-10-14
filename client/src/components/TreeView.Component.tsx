import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled'
import { iFolder } from '../../../shared/types.shared';
import { iconFolder } from '../managers/icons.manager';
import { onFolderClickedFn } from '../hooks/app/treeFolder.hook';
import { random } from 'lodash';
import { useLocalStorage } from '../hooks/useLocalStorage.hook';
import { Icon } from './Icon.component';
import { cssVars } from '../managers/style/vars.style.manager';
import { strings } from '../managers/strings.manager';
import { getFolderParentPath } from '../managers/folder.manager';
import { isA, isIpad } from '../managers/device.manager';

export type onFolderDragStartFn = (folder:iFolder) => void
export type onFolderDropFn = (folder:iFolder) => void
export type onFolderMenuActionFn = (
  action: 'rename'|'create'|'moveToTrash'|'delete', 
  folder:iFolder,
  newName?:string 
) => void

export const TreeView = (p:{
  folder: iFolder,
  current:string,
  onFolderMenuAction: onFolderMenuActionFn
  onFolderClicked: onFolderClickedFn
  onFolderOpen: onFolderClickedFn
  onFolderClose: onFolderClickedFn

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
        onFolderMenuAction={p.onFolderMenuAction}
        onFolderOpen={p.onFolderOpen}
        onFolderClose={p.onFolderClose}

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
  
  onFolderMenuAction: onFolderMenuActionFn
  onFolderClicked: onFolderClickedFn
  onFolderOpen: onFolderClickedFn
  onFolderClose: onFolderClickedFn
  onFolderDragStart: onFolderDragStartFn
  onFolderDragEnd: () => void
  onFolderDrop: onFolderDropFn
}) => {
  const [isOpen, setIsOpen] = useLocalStorage(`treeview-${(p.folder.key === '/' || p.folder.key === '') ? 'root' : p.folder.key}`, false)
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
        <span className="icon" onClick={e=> {
          isOpen ? p.onFolderClose(p.folder.key) : p.onFolderOpen(p.folder.key)
          setIsOpen(!isOpen)
        }}>
          {
            p.folder.hasChildren &&
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
                <ul>

                  <li onClick={() => {
                      if (p.folder.path === '') return setIsMenuOpened(false)
                      const newFolderName = prompt(`${strings.renameFolderPrompt} `,p.folder.title);
                      if (newFolderName && newFolderName !== '' && newFolderName !== p.folder.title) {
                        p.onFolderMenuAction('rename', p.folder, newFolderName)
                      }
                      setIsMenuOpened(false)
                    }}>{strings.renameFolder}</li>

                  <li onClick={() => {
                    if (p.folder.path === '') return setIsMenuOpened(false)
                    const createdFolderName = prompt(`${strings.createFolderPrompt} ${p.folder.path}`,'');
                    if (createdFolderName && createdFolderName !== '') p.onFolderMenuAction('create', p.folder, createdFolderName)
                    setIsMenuOpened(false)
                  }}>{strings.createFolder}</li>

                  { p.folder.path.indexOf('.tiro/.trash') === -1 &&
                    <li onClick={() => {
                      if (p.folder.path === '') return setIsMenuOpened(false)
                      const confirmed = window.confirm(`${strings.moveToTrash}${p.folder.path}?`);
                      if (confirmed) { p.onFolderMenuAction('moveToTrash', p.folder) }
                      setIsMenuOpened(false)
                    }}>{strings.moveToTrash}</li>
                  }

                  { p.folder.path.indexOf('.tiro/.trash') !== -1 &&
                    <li onClick={() => {
                      if (p.folder.path === '') return setIsMenuOpened(false)
                      const confirmed = window.confirm(`${strings.deleteFolderPrompt}${p.folder.path}?`);
                      if (confirmed) { p.onFolderMenuAction('delete', p.folder)}
                      setIsMenuOpened(false)
                    }}>{strings.deleteFolder}</li>
                  }

                </ul>
              </div>
            }
        </span>
      </div>


      { isOpen &&
        <ul className="folder-children">
        {
          p.folder.children && p.folder.children.map( (child,key) => 
            <FolderView 
              key={key}
              folder={child}
              current={p.current}
              onFolderOpen={p.onFolderOpen}
              onFolderMenuAction={p.onFolderMenuAction}
              onFolderClose={p.onFolderClose}
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
  padding-right: 0px;
  margin: 0px 0px 100px 0px;
  width: calc(100% - ${cssVars.sizes.block * (isA('desktop') && !isIpad() ? 1 : 2)}px);

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
      right: 10px;
      top: 5px;
      display:none;
      .context-menu {
        position: absolute;
        right: 0px;
        top: 15px;
        background: white;
        box-shadow: 0px 0px 4px rgb(0 0 0 / 10%);
        color: black;
        padding: 0px 0px;
        width: 100px;
        z-index: 10;
        border-radius: 4px;
        font-size: 10px;
        ul {
          list-style: none;
          padding: 0px;
          margin: 0px;
          li {
            padding: 4px 11px;
            &:hover {
              background: rgba(${cssVars.colors.mainRGB}, 0.2)
            }
          }
        }
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