import React, { useEffect, useState } from 'react';

export type PathModifFn = (initPath:string, endPath:string) => void

export const NoteTitleInput = (p: { 
    title:string,
    onEdited: PathModifFn
}) => {
    const [title, setTitle] = useState('')

    useEffect(() => {
        setTitle(p.title)
    }, [p.title])

    return (
        <div className='title-input-wrapper'>
            <input 
                type="text" 
                value={title}
                onChange={(e) => {setTitle(e.target.value)}}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        if (title.length < 3) return
                        p.onEdited(p.title , title)
                    }
                }}
            />
        </div>
    )
}