import React, { useContext, useEffect, useState } from 'react';
import { iFolder } from '../../../shared/types.shared';
import { Icon } from './Icon.component';
import { cssVars } from '../managers/style/vars.style.manager';
import { strings } from '../managers/strings.manager';
import { isA, isIpad } from '../managers/device.manager';
import { getApi, getClientApi2 } from '../hooks/api/api.hook';
import { areSamePaths } from '../../../shared/helpers/filename.helper';

export type onFolderClickedFn = (folderPath: string) => void
export type onFolderDragStartFn = (folder: iFolder) => void
export type onFolderDropFn = (folder: iFolder) => void
export type onFolderMenuActionFn = (
	action: 'rename' | 'create' | 'moveToTrash' | 'delete',
	folder: iFolder,
	newName?: string
) => void

export const FoldersTreeView = (p: {
	// const FoldersTreeViewInt = (p: {
	openFolders: string[],
	folder: iFolder,
	current: string,

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
				openFolders={p.openFolders}
				folder={p.folder}
				current={p.current}
				onFolderClicked={p.onFolderClicked}
				onFolderMenuAction={p.onFolderMenuAction}
				onFolderOpen={folderPath => {
					getApi(api => {
						api.ui.browser.folders.open.add(folderPath)
						p.onFolderOpen(folderPath)
					})
				}}
				onFolderClose={folderPath => {
					getApi(api => {
						console.log("ONFOLDERCLOSE", folderPath)
						api.ui.browser.folders.open.remove([folderPath])
						p.onFolderClose(folderPath)
					})
				}}

				onFolderDragStart={p.onFolderDragStart}
				onFolderDragEnd={p.onFolderDragEnd}
				onFolderDrop={p.onFolderDrop}
			/>
		</div>
	)
}








export const FolderView = (p: {
	openFolders: string[],
	folder: iFolder,
	current: string,

	onFolderMenuAction: onFolderMenuActionFn
	onFolderClicked: onFolderClickedFn
	onFolderOpen: onFolderClickedFn
	onFolderClose: onFolderClickedFn
	onFolderDragStart: onFolderDragStartFn
	onFolderDragEnd: () => void
	onFolderDrop: onFolderDropFn
}) => {

	const isOpen = p.openFolders.includes(p.folder.path) && p.folder.hasFolderChildren

	const [isMenuOpened, setIsMenuOpened] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [dragClass, setDragClass] = useState("")

	useEffect(() => {
		if (isOpen && !p.folder.children) setIsLoading(true)
		else if (isOpen && p.folder.children && p.folder.children.length === 0) setIsLoading(true)
		else setIsLoading(false)
	}, [p.folder.children, isOpen])

	const isCurrentFolder = areSamePaths(p.current, p.folder.key)
	return (
		<li
			className={`folder-wrapper ${isCurrentFolder ? 'current' : ''} `}
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
			<div
				className={`folder-title ${dragClass}`}
				onDragEnter={(e) => {
					setDragClass("drag")
				}}
				onDrop={(e) => {
					setDragClass("")
				}}
				onDragLeave={(e) => {
					setDragClass("")
				}}
			>

				<span className="icon" onClick={e => {
					isOpen ? p.onFolderClose(p.folder.key) : p.onFolderOpen(p.folder.key)
					// setIsOpen(!isOpen)
				}}>
					{
						p.folder.hasFolderChildren &&
						<Icon
							name={isOpen ? 'faCaretDown' : 'faCaretRight'}
							color={cssVars.colors.main}
						/>
					}
				</span>
				<span className="title" onClick={e => { p.onFolderClicked(p.folder.key) }}>


					<div className="title-drag-bg"></div>
					<div className="title-label"> {p.folder.title}</div>
				</span>
				<span
					onClick={() => {
						// alert(p.folder.title)
						setIsMenuOpened(!isMenuOpened)
					}}
					className="context-menu-wrapper">
					<Icon name="faEllipsisH" color={cssVars.colors.l1.font} />
					{isMenuOpened &&
						<div className="context-menu context-menu-folders">
							<ul>

								<li onClick={() => {
									if (p.folder.path === '') return setIsMenuOpened(false)
									const newFolderName = prompt(`${strings.renameFolderPrompt} `, p.folder.title);
									if (newFolderName && newFolderName !== '' && newFolderName !== p.folder.title) {
										p.onFolderMenuAction('rename', p.folder, newFolderName)
									}
									setIsMenuOpened(false)
								}}>{strings.renameFolder}</li>


								<li onClick={() => {
									if (p.folder.path === '') return setIsMenuOpened(false)
									getClientApi2().then(api => {
										api.popup.prompt({
											text: `${strings.createFolderPrompt} "${p.folder.path}"?`,
											userInput: true,
											onAccept: (createdFolderName) => {
												if (!createdFolderName || createdFolderName === '') return
												p.onFolderMenuAction('create', p.folder, createdFolderName)
											},
											onRefuse: () => { }
										});
									})
									setIsMenuOpened(false)
								}}>{strings.createFolder}</li>

								{p.folder.path.indexOf('.tiro/.trash') === -1 &&
									<li onClick={() => {
										if (p.folder.path === '') return setIsMenuOpened(false)
										setIsMenuOpened(false)
										p.onFolderMenuAction('moveToTrash', p.folder)
									}}>{strings.moveToTrash}</li>
								}

								{p.folder.path.indexOf('.tiro/.trash') !== -1 &&
									<li onClick={() => {
										if (p.folder.path === '') return setIsMenuOpened(false)
										setIsMenuOpened(false)
										getClientApi2().then(api => {
											api.popup.confirm(
												`${strings.deleteFolderPrompt} "${p.folder.path}"?`, () => {
													p.onFolderMenuAction('delete', p.folder)
												});
										});
									}}>{strings.deleteFolder}</li>
								}

							</ul>
						</div>
					}
				</span>
			</div>
			
			{
				isLoading && <div className="loading">...</div>
			}

			{
				isOpen && 
				<ul className="folder-children">
					{
						p.folder.children && p.folder.children.map((child, key) =>
							<FolderView
								openFolders={p.openFolders}
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
		</li >
	)
}


// // refresh all time
// export const FoldersTreeView = React.memo(FoldersTreeViewInt,
// 	(np, pp) => {
// 		let res = true
// 		if (
// 			np.openFolders !== pp.openFolders ||
// 			np.folder !== pp.folder ||
// 			np.current !== pp.current
// 			// np.onFolderClicked !== pp.onFolderClicked
// 		) {
// 			res = false
// 		}
// 		return res
// 	}
// )


export const l1Subtitle = `
.title {
    padding-left: 4px;
    cursor: pointer;
    padding: 0px 20px 0px 0px;
}
`

export const folderTreeCss = () => `
&.device-view-mobile {
		.folder-tree-view-component {
				li.folder-wrapper {
						.context-menu-wrapper {
								right: -10px;
								.context-menu {
										right: 5px;
								}
						}
				}
		}
}

.folder-tree-view-component {
		padding: ${cssVars.sizes.block}px;
		padding-right: 0px;
		margin: 0px 0px 100px 0px;
		width: calc(100% - ${cssVars.sizes.block * (isA('desktop') && !isIpad() ? 1 : 2)}px);

		ul.folder-children {
				margin: 0px 0px 0px 0px;
				padding: 0px 0px 0px 10px;
		}

		.loading {
			margin-left: 30px;
			font-size: 12px;
			font-weight: 400;
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
						top: -10px;
						padding: 10px;
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
								z-index: 100;
								border-radius: 4px;
								font-size: 10px;
								ul {
										list-style: none;
										padding: 0px;
										margin: 0px;
										li {
												padding: 4px 11px;
												&:hover {
														background: ${cssVars.colors.main};
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
						position: relative;

						.title-label {
								position: relative;
								z-index: 0;

						}

						.title-drag-bg {
								border-radius: 5px;
								padding: 5px;
								position: absolute;
								width: calc(100% - 8px);
								height: 100%;
								top: -4px;
								z-index: -1;
								left: -5px;
								transition: 50ms;
								background: rgba(255,255,255,0);
								z-index:0;
								pointer-events: none;
						}
						&.drag .title-drag-bg {
								background: rgba(255,255,255,0.6);
								pointer-events: all;
						}

						padding: 1px;
						position:relative;
						padding-left: 20px;
						.icon {
								position: absolute;
								left: 2px;
								cursor: pointer;
								padding: 1px;
								top: 0px;
								svg {
										color: ${cssVars.colors.main};
								}
						}
						
				}
		}
		
}
`
