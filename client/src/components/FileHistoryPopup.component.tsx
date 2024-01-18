import styled from '@emotion/styled';
import { each, orderBy, sortBy } from 'lodash-es';
import React, { useContext, useEffect, useState } from 'react';
import { getDateObj } from '../../../shared/helpers/date.helper';
import { iFile } from '../../../shared/types.shared';
import { ClientApiContext, getApi } from '../hooks/api/api.hook';
import { getLoginToken } from '../hooks/app/loginToken.hook';
import { generateEmptyiFile } from '../hooks/app/useLightbox.hook';
import { formatDateList } from '../managers/date.manager';
import { detachNote } from '../managers/detachNote.manager';
import { getLocalNoteHistory } from '../managers/localNoteHistory.manager';
import { clientSocket2 } from '../managers/sockets/socket.manager';
import { strings } from "../managers/strings.manager";
import { cssVars } from "../managers/style/vars.style.manager";
import { Icon } from './Icon.component';
import { Popup } from './Popup.component';
import { getFontSize } from '../managers/font.manager';


interface iHistoryFile extends iFile {
    isLocal?:boolean,
	localContent?: string
}

export const FileHistoryPopup = (p: {
	file: iFile
	onClose: Function
}) => {

	const [files, setFiles] = useState<iHistoryFile[]>([])
	const [isLoading, setIsLoading] = useState(false)


	const refreshHistoryFiles = () => {
		// 1 get files from local
		let localFiles = getLSHistoryList()
		setFiles([...localFiles])

		// 2 get files from scan
		setIsLoading(true)
		clientSocket2.emit('askFileHistory', { filepath: p.file.path, token: getLoginToken() })
		const listenerId = clientSocket2.on('getFileHistory', data => {
			// for each file, date is in title, after ___
			let nfiles:iFile[] = []
			each(data.files, f => {
				
				let realDateStr = f.filenameWithoutExt?.split("___")[1]
				if (realDateStr) {
					f.created = getDateObj(realDateStr).num.timestamp
				}
				if (f.created && f.created < Date.now()) nfiles.push(f)
			})
			const filesSorted = orderBy(nfiles, ['created'], ['desc']);
			setFiles([...localFiles,...filesSorted])
			setIsLoading(false)
			clientSocket2.off(listenerId)
		})
	}

	const getLSHistoryList = ():iHistoryFile[] => {
		let res:iHistoryFile[] = []		
		let list = getLocalNoteHistory(p.file.path)
		each(list, (l,i) => {
			let j = i + 1
			let nIt = generateEmptyiFile() as iHistoryFile
			nIt.created = l.timestamp
			nIt.path = l.path + j
			let name = `Temporary local save ${j} from ${formatDateList(new Date(nIt.created || 0))}`
			nIt.name = name
			nIt.realname = name
			nIt.localContent = l.content
			nIt.isLocal = true
			res.push(nIt)
		})
		console.log("getLSHistoryList", list, p.file.path)
		return res
	}

	useEffect(() => {
		refreshHistoryFiles()
	}, [])

	const api = useContext(ClientApiContext);
	const [fileHistoryContent, setFileHistoryContent] = useState("")
	const [activeFile, setActiveFile] = useState<iFile | null>(null)
	const openHistoryFile = (file: iHistoryFile) => {
		// 1. Open in new tab
		// api && api.tabs.openInNewTab(file)

		if (file.isLocal && file.localContent){
			setFileHistoryContent(file.localContent)
			setActiveFile(file)
		} else {
			// 2. Open in popup
			api && api.file.getContent(file.path, content => {
				setFileHistoryContent(content)
				setActiveFile(file)
			})
		}
	}


	const trashFile = (file: iHistoryFile) => {
		const titlePopup = "Trashing File"
		getApi(api => {
			api.file.delete(file, (a) => { 
				refreshHistoryFiles()
				setActiveFile(null)
				setFileHistoryContent("")
			})
		})
	}

	return (
			<div className="history-popup-wrapper">
				<Popup
					title={`${strings.historyPopup.title}"${p.file.realname}"`}
					onClose={() => { p.onClose() }}
				>
					<div className="count">{files.length} backups found :</div>
					{isLoading && <div className="count">  (Loading backend history files...)</div>}
					<div className="table-wrapper">
						<table>
							<thead>
								<tr>
									<th>{strings.historyPopup.thead.name}</th>
									<th>{strings.historyPopup.thead.date}</th>
								</tr>
							</thead>
							<tbody>
								{
									files.map(file =>
										<tr
											className={`${activeFile?.path === file.path ? 'active' : ''}`}
											onClick={() => { openHistoryFile(file) }}
										>
											<td> {file.realname} </td>
											<td> {formatDateList(new Date(file.created || 0))} </td>
											 <td> {!file.isLocal && <div className="trash" onClick={() => { trashFile(file) }}>	<Icon name="faTrash" color='grey' /> </div>}</td>
										</tr>
									)
								}
							</tbody>
						</table>
					</div>
					{fileHistoryContent &&
						<>
						<div className="note-preview">
							<textarea
								className='note-preview-textarea'
								// readOnly={true}
								value={fileHistoryContent}
							/>
							<div className="button-wrapper">
								<button
									className="button"
									onClick={() => {
										getApi(api => {
											// const path = activeFile?.path
											// if (!path) return
											api.file.saveContent(p.file.path, fileHistoryContent)
										})
									}}
								>
									Restore version
								</button>
							</div>
							<div className="advice"> To disable history backup for a note, add "--disable-history--"in it</div>
						</div>
						
						
						</>
						
					}
					
				</Popup>
			</div>
	)
}


export const fileHistoryCss = () => `
.history-popup-wrapper .popup-wrapper-component .popup-wrapper {
	height: 70%;
}
.history-popup-wrapper  .popup-wrapper .count {
	position: relative;
    top: -9px;
    font-weight: 600;
}
.filemain-wrapper .history-popup-wrapper .popup-wrapper-component .popup-wrapper {
	width: 90%;
}
.history-popup-wrapper {
	.popup-wrapper .popupContent {
		// max-height: 70vh;
		padding: 0px;
	}
	.table-wrapper {
		// max-height: 30vh;
		height: 50%;
		overflow-y: auto;
		padding: 0px 0px 20px 0px;
		
		table {
			border-spacing: 0px;
			thead {
				tr {
					th {
						padding: 8px;
					}
				}
			}
			tbody {
				text-align: left;
				tr {
					cursor: pointer;
					background: #f1f0f0;
					&:nth-child(2n) {
						background: none;
					}
									&.active {
											font-weight: bold;
									}
					&: hover {
						background: r${cssVars.colors.main};
					}
					td {
						padding: 8px;
					}
				}
			}
		}
	}
	.note-preview {
		height: 50%;
		.note-preview-textarea {
			padding: 6px;
			margin: 10px 0px 0px 0px;
			width: calc(100% - 10px);
			// height: calc(100% - 90px);
			height: calc(100% - 89px);
			border: none;
			background: gainsboro;
		}
	}
	.advice {
		color: #a4a4a4;
	font-size: ${getFontSize()}px;
	padding: 3px 3px;
	}
	.trash {
	margin-right: 15px;
	}
}
`
