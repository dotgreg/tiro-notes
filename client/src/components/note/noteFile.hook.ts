import React, { useEffect,  useState } from 'react';

export const useFileContent = (content:string) => {
    const [fileContent, setFileContent] = useState('')

    useEffect(() => {
        setFileContent(content)
    }, [content])
    
    return fileContent
}

