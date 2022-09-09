import { useEffect, useRef, useState } from 'react';
import { iFile } from '../../../../shared/types.shared';

let oldPath: string = ''

export const useNoteEditorEvents = (p: {
	file: iFile
	fileContent: string
	canEdit: boolean

	onEditorDidMount?: Function
	onEditorWillUnmount?: Function

	onNoteContentDidLoad?: () => void
	onNoteEdition?: (newContent: string, isFirstEdition: boolean) => void
	onNoteLeaving?: (isEdited: boolean, oldPath: string) => void
}) => {

	const [hasBeenEdited, setHasBeenEdited] = useState(false)
	// console.log(3333, p.canEdit);
	const canEditRef = useRef(false)
	useEffect(() => { canEditRef.current = p.canEdit }, [p.canEdit])

	useEffect(() => {
		setHasBeenEdited(false);

		if (p.onEditorDidMount) {
			// console.log('[EVENTS EDITOR] EDITOR DID MOUNT');
			p.onEditorDidMount()
		}

		return () => {
			if (p.onEditorWillUnmount) {

				triggerNoteLeaveLogic()

				// console.log('[EVENTS EDITOR] WILL UNMOUNT');
				p.onEditorWillUnmount()
			}
		}
	}, [p.file.path])

	useEffect(() => {
		triggerNoteLeaveLogic()
	}, [p.file.path])

	useEffect(() => {
		if (p.onNoteContentDidLoad) {
			// console.log(`[EVENTS EDITOR] => on note content did load ${p.file.path}`);
			p.onNoteContentDidLoad()
		}
	}, [p.fileContent, p.file.path])




	const triggerNoteLeaveLogic = () => {
		if (oldPath !== '' && p.onNoteLeaving) {
			// console.log(`[EVENTS EDITOR] => leaving edited ${oldPath} to ${p.file.path}`);
			p.onNoteLeaving(hasBeenEdited, oldPath)
		}
		oldPath = p.file.path
	}


	// EVENT => EDITING
	const triggerNoteEdition = (newContent: string) => {
		if (!canEditRef.current) return console.warn(`[EVENTS EDITOR] => onEdition  CANNOT EDIT AS OFFLINE`);
		if (!hasBeenEdited) {
			if (p.onNoteEdition) {
				// console.log(`[EVENTS EDITOR] => onEdition (FIRST ONE) (${p.file.path})`);
				p.onNoteEdition(newContent, true)
			}
		} else {
			if (p.onNoteEdition) {
				// console.log(`[EVENTS EDITOR] => onEdition (${p.file.path})`);
				p.onNoteEdition(newContent, false)
			}
		}
		setHasBeenEdited(true)
	}

	return { triggerNoteEdition }
}
