import React, { useEffect, useState } from 'react';
export const BackgroundVideo = (p:{
    url: string
    width: number
    height: number
}) => {
    let url = p.url;
    url = url.trim()
    // if ? exists, just add &autoplay=1, otherwise add ?autoplay=1
    if (url.includes('?')) {
        url += '&autoplay=1&mute=1';
    } else {
        url += '?autoplay=1&mute=1';
    }


    const [show, setShow] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setShow(true);
        }, 3000);
    }, []);

    return (
        <div className="background-video" style={{width: `${p.width}%`, height:`${p.height}%`} }>
            {show && <iframe  
            src={`${url}`} 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            >

            </iframe>}
        </div>
    );
}
export const BackgroundVideoCSS = () => `
.background-video {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    iframe {
        width: 100%;
        height: 100%;
    }
}
`