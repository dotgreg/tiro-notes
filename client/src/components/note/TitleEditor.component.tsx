import React, { useEffect, useState } from 'react';

export type PathModifFn = (initPath:string, endPath:string) => void

export const NoteTitleInput = (p: { 
    path:string,
    onEdited: PathModifFn
}) => {
    const [filePath, setFilePath] = useState('')

    useEffect(() => {
        setFilePath(p.path)
    }, [p.path])

    return (
        <div className='title-input-wrapper'>
            <input 
                type="text" 
                value={filePath}
                onChange={(e) => {setFilePath(e.target.value)}}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        if (filePath.length < 3) return
                        p.onEdited(p.path , filePath)
                    }
                }}
            />
        </div>
    )
}