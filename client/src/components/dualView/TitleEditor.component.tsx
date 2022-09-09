import React, { useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/lodash.hooks';
import { deviceType } from '../../managers/device.manager';
import { cssVars } from '../../managers/style/vars.style.manager';
import { secureTitleString } from '../../managers/title.manager';
import { Icon } from '../Icon.component';

export type PathModifFn = (initPath: string, endPath: string) => void

// export const NoteTitleInput = React.memo((p: {
export const NoteTitleInput = React.memo((p: {
	title: string,
	onEdited: PathModifFn
}) => {
	const [title, setTitle] = useState('')
	const [hasBeenEdited, setHasBeenEdited] = useState(false)

	useEffect(() => {
		setTitle(p.title)
	}, [p.title])


	// problem, enter key does not seem to work fine on mobile and jump,
	// so debounce and save name for it after 2s
	const onDebounceMobileTriggerSave = useDebounce((ntitle: string) => {
		// only if title exists
		if (ntitle.length === 0) return
		if (deviceType() === 'mobile') {
			setHasBeenEdited(false)
			p.onEdited(p.title, title)
		}
	}, 1000)

	return (
		<div className='title-input-wrapper'>
			<input
				className="big-title"
				type="text"
				value={title}
				onChange={(e) => {
					let newTitle = secureTitleString(e.target.value)
					setTitle(newTitle)
					setHasBeenEdited(true)

					onDebounceMobileTriggerSave(newTitle)
				}}
				onKeyDown={e => {
					if (e.key === 'Enter') {
						if (title.length < 3) return
						p.onEdited(p.title, title)
						setHasBeenEdited(false)
					}
				}}
			/>
			{
				hasBeenEdited && <div className='press-to-save'>
					{/* <span>press enter to save</span> */}
					<Icon name="faCircle" color={cssVars.colors.main} size={0.7} />
				</div>
			}
		</div>
	)
}, (np, pp) => {
	let res = true
	if (np.title !== pp.title) res = false
	return res
})

