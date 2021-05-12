import styled from '@emotion/styled';
import { orderBy, sortBy } from 'lodash';
import React, { useEffect, useState } from 'react';
import { iFile } from '../../../shared/types.shared';
import { getLoginToken } from '../hooks/app/loginToken.hook';
import { formatDateList } from '../managers/date.manager';
import { detachNote } from '../managers/detachNote.manager';
import { clientSocket2 } from '../managers/sockets/socket.manager';
import { strings } from "../managers/strings.manager";
import { cssVars } from "../managers/style/vars.style.manager";
import { Popup } from './Popup.component';

export const FileHistoryPopup = (p:{
    file: iFile
    onClose: Function
}) => {

    const [files, setFiles] = useState<iFile[]>([])

    useEffect(() => {
        clientSocket2.emit('askFileHistory', {filepath: p.file.path, token:getLoginToken()})
        const listenerId = clientSocket2.on('getFileHistory', data => {
            const filesSorted = orderBy(data.files, ['created'], ['desc']);
            console.log(filesSorted);
            
            setFiles(filesSorted)
        })
        return () => {
            clientSocket2.off(listenerId)
        }
    }, [])
 
    return (
        <StyledDiv>
            <Popup
                title={`${strings.historyPopup.title}"${p.file.realname}"`}
                onClose={() => {p.onClose()}}
            >
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
                                    <tr onClick={() => {detachNote(file)}}>
                                        <td> {file.realname} </td>
                                        <td> {formatDateList(new Date(file.created || 0))} </td>
                                    </tr>
                                    )
                            }
                        </tbody>
                    </table>
                </div>
            </Popup>
        </StyledDiv>
    )
}

export const StyledDiv = styled.div`
    .popup-wrapper .popupContent {
        padding: 0px;
    }
    .table-wrapper {
        max-height: 50vh;
        overflow-y: auto;
        padding: 0px 20px 20px 20px;
        
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
                    &: hover {
                        background: rgba(${cssVars.colors.mainRGB}, 0.2);
                    }
                    td {
                        padding: 8px;
                    }
                }
            }
        }
    }
`