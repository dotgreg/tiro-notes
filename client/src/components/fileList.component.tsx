export const vide = () => {}

// import React, {  useEffect, useLayoutEffect, useRef, useState } from 'react';
// import { iFile } from "../../../shared/types.shared"
// import { FilesPreviewObject } from "../hooks/app/filesList.hook"
// import { useStatMemo } from "../hooks/useStatMemo.hook"
// import { onFileDragStartFn } from "./List.component"

// export const FilesList = (p:{
//     searchTerm: string
//     selectedFolder: string
//     filesPreviewObj: FilesPreviewObject
//     files: iFile[]
//     askFilesPreview

//     onFileClicked: (fileIndex:number)=>void
//     onFileDragStart: onFileDragStartFn
//     onFileDragEnd: ()=>void
// }) => useStatMemo(
//     <div className="files-list-component">
//         <div className='list-toolbar'>
//             <button 
//                 type="button" 
//                 title='sort'
//                 onClick={e => {
//                     let newMode = sortMode + 1 >= SortModes.length ? 0 : sortMode + 1
//                     setSortMode(newMode)
//                     setFiles(sortFiles(files, newMode))
//                 }}
//             > 
//                 <span> { files.length > 0 && <span className='list-count'>({files.length})</span>} { SortModesLabels[sortMode] } </span> 
//                 <Icon name="faSort" color={cssVars.colors.l2.text} /> 
//             </button>

//             {/* { files.length > 0 &&
//                 <span className='items-list-count'>{files.length} els</span>
//             } */}
            

//         </div>



//         {
//         /////////////////////////////
//         // LIST
//         /////////////////////////////
//         }
//         <div 
//             className="list-wrapper"
//             // onScroll={(e) => {
//             //     console.log('scrollOnList', );
                
//             // }}
//         >
//             <List
//                 files={files} 
//                 filesPreview={filesPreviewObj}

//                 hoverMode={false}
//                 activeFileIndex={activeFileIndex}
//                 modifierPressed={modifierPressed}

//                 sortMode={sortMode}

//                 onFileClicked={(fileIndex) => {
//                     setActiveFileIndex(fileIndex)
//                     p.onFileClicked(fileIndex)
//                 }}

//                 onFileDragStart={p.onFileDragStart}
//                 onFileDragEnd={p.onFileDragEnd}

//                 onVisibleItemsChange={visibleFilesPath => {
//                     askFilesPreview(visibleFilesPath)
//                 }}
//                 />
//             </div>
//         </div>
// , [files, activeFileIndex, sortMode, forceListUpdate, modifierPressed, filesPreviewObj])
