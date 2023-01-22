import styled from '@emotion/styled';
import { orderBy, sortBy } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { iFile } from '../../../shared/types.shared';
import { ClientApiContext, getApi } from '../hooks/api/api.hook';
import { getLoginToken } from '../hooks/app/loginToken.hook';
import { formatDateList } from '../managers/date.manager';
import { detachNote } from '../managers/detachNote.manager';
import { clientSocket2 } from '../managers/sockets/socket.manager';
import { strings } from "../managers/strings.manager";
import { cssVars } from "../managers/style/vars.style.manager";
import { Icon } from './Icon.component';
import { Popup } from './Popup.component';

export const FileHistoryPopup = (p: {
	file: iFile
	onClose: Function
}) => {

	const [files, setFiles] = useState<iFile[]>([])


	const refreshHistoryFiles = () => {
		clientSocket2.emit('askFileHistory', { filepath: p.file.path, token: getLoginToken() })
		const listenerId = clientSocket2.on('getFileHistory', data => {
			const filesSorted = orderBy(data.files, ['created'], ['desc']);
			setFiles(filesSorted)
			clientSocket2.off(listenerId)
		})
	}

	useEffect(() => {
		refreshHistoryFiles()
	}, [])

	const api = useContext(ClientApiContext);
	const [fileHistoryContent, setFileHistoryContent] = useState("")
	const [activeFile, setActiveFile] = useState<iFile | null>(null)
	const openHistoryFile = (file: iFile) => {
		// 1. Open in new tab
		// api && api.tabs.openInNewTab(file)

		// 2. Open in popup
		api && api.file.getContent(file.path, content => {
			setFileHistoryContent(content)

			setActiveFile(file)
		})
	}


	const trashFile = (file: iFile) => {
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
		<StyledDiv>
			<div className="history-popup-wrapper">
				<Popup
					title={`${strings.historyPopup.title}"${p.file.realname}"`}
					onClose={() => { p.onClose() }}
				>
					<div className="count">{files.length} backups found :</div>
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
											<td> <div className="trash" onClick={() => { trashFile(file) }}>	<Icon name="faTrash" color='grey' /> </div></td>
										</tr>
									)
								}
							</tbody>
						</table>
					</div>
					{fileHistoryContent &&
						<div className="note-preview">
							<textarea
								className='note-preview-textarea'
								// readOnly={true}
								value={fileHistoryContent}
							/>
						</div>
					}
					<div className="advice"> To disable history backup for a note, add "--disable-history--"in it</div>
				</Popup>
			</div>
		</StyledDiv>
	)
}


export const StyledDiv = styled.div`
.filemain-wrapper .history-popup-wrapper .popup-wrapper-component .popup-wrapper {
	width: 90%;
}
.popup-wrapper .popupContent {
		max-height: 70vh;
    padding: 0px;
}
.table-wrapper {
    max-height: 30vh;
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
		.note-preview-textarea {
			padding: 6px;
			margin: 10px 0px 0px 0px;
			width: calc(100% - 10px);
			height: 34vh;
			border: none;
			background: gainsboro;
		}
}
.advice {
	color: #a4a4a4;
font-size: 10px;
padding: 3px 3px;
}
.trash {
margin-right: 15px;
}

`
