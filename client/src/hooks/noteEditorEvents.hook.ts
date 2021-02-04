import { debounce } from 'lodash';
import {  useEffect, useRef, useState } from 'react';
import { iFile } from '../../../shared/types.shared';

let oldPath:string = ''

export const useNoteEditorEvents = (p:{
    file:iFile 
    fileContent: string

    onEditorDidMount?: Function
    onEditorWillUnmount?: Function

    onNoteContentDidLoad?: () => void
    onNoteEdition?: (newContent:string, isFirstEdition:boolean) => void
    onNoteLeaving?: (isEdited:boolean, oldPath:string) => void
}) => {

    const [shouldSaveOnLeave, setShouldSaveOnLeave] = useState(false)

    useEffect(() => {
        if (p.onEditorDidMount){
            console.log('[EDITOR] EDITOR DID MOUNT');
            p.onEditorDidMount()
        }
        
        return () => {
            if (p.onEditorWillUnmount){
                console.log('[EDITOR] WILL UNMOUNT');
                p.onEditorWillUnmount()
            }
        }
    },[])
    
    useEffect(() => {
        if (shouldSaveOnLeave) {
            if (p.onNoteLeaving){
                console.log('[EDITOR] => leaving an edited note');
                p.onNoteLeaving(true, oldPath)
            }
        } else {
            if (p.onNoteLeaving){
                console.log('[EDITOR] => leaving an unedited note');
                p.onNoteLeaving(false, oldPath)
            }
        }
        oldPath = p.file.path
    }, [p.file.path])

    useEffect(() => {
        if (p.onNoteContentDidLoad){
            console.log('[EDITOR] => on note content did load');
            p.onNoteContentDidLoad()
        }
    }, [p.fileContent])
    
    // EVENT => EDITING
    const triggerNoteEdition = (newContent:string) => {
        if (!shouldSaveOnLeave) {
            if (p.onNoteEdition){ 
                console.log('[EDITOR] => onEdition (first)');
                p.onNoteEdition(newContent, true)
            }
        } else {
            if (p.onNoteEdition){ 
                console.log('[EDITOR] => onEdition');
                p.onNoteEdition(newContent, false)
            }
        }
        setShouldSaveOnLeave(true)      
    }

    return {triggerNoteEdition}
}