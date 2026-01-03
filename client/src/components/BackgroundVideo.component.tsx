import React, { useEffect, useState } from 'react';
import { getLoginToken } from '../hooks/app/loginToken.hook';
import { isMobile } from '../managers/device.manager';
export const BackgroundVideo = (p:{
    url: string
    width: number
    height: number
}) => {
    let url = p.url;
    url = url.trim()
    // if ? exists, just add &autoplay=1, otherwise add ?autoplay=1
    
    // if url contains [[token]], replaces it
    if (url.includes("[[token]]")) {
        url = url.replace("[[token]]", getLoginToken());
    }

    // if url includes < or >, it is raw HTML, insert it as it is
    let isRawHTML = false;
    if (url.includes('<') || url.includes('>')) {
        isRawHTML = true;
    }else {
        if (url.includes('?')) {
            url += '&autoplay=1&mute=1';
        } else {
            url += '?autoplay=1&mute=1';
        }
    }


    const [show, setShow] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setShow(true);
        }, 3000);
    }, []);

    return (
        <>
            {!isMobile() &&

                <div id="background-video" className={`background-video ${isRawHTML ? 'html' : 'iframe'}`} style={{ width: `${p.width}%`, height: `${p.height}%` }}>
                    {show && !isRawHTML && <iframe
                        src={`${url}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    >

                    </iframe>}
                    {show && isRawHTML && <div className='html-wrapper-raw' dangerouslySetInnerHTML={{ __html: url }}></div>}
                </div>
            }
        </>
    );
}
export const BackgroundVideoCSS = () => `
.html-wrapper-raw {
    width: 100%;
    height: 100%;
}
.background-video {
    position: fixed;
}
.background-video.iframe {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    iframe {
        width: 100%;
        height: 100%;
    }
}
`