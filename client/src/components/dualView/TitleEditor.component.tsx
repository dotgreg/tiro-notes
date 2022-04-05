import React, { useEffect, useState } from 'react';
import { secureTitleString } from '../../managers/title.manager';

export type PathModifFn = (initPath:string, endPath:string) => void

export const NoteTitleInput = (p: { 
    title:string,
    onEdited: PathModifFn
}) => {
    const [title, setTitle] = useState('')
    const [hasBeenEdited, setHasBeenEdited] = useState(false)

    useEffect(() => {
        setTitle(p.title)
    }, [p.title])

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
                }}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        if (title.length < 3) return
                        p.onEdited(p.title , title)
                        setHasBeenEdited(false)
                    }
                }}
            />
            {
                hasBeenEdited && <div className='press-to-save'>press enter to save</div>
            }
        </div>
    )
}
