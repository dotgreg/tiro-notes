import React, { useState }  from 'react';
import { ButtonToolbar } from '../../components/dualView/NoteToolbar.component';
import { deviceType, MobileView } from '../../managers/device.manager';
import { cssVars } from '../../managers/style/vars.style.manager';
import { useLocalStorage } from '../useLocalStorage.hook';
import { useStatMemo } from "../useStatMemo.hook"

export const useMobileView = () => {

    const [mobileView, setMobileView] = useState<MobileView>('navigator')

    const MobileToolbarComponent = (forceRerender: boolean) => useStatMemo(
        <>
            { 
                deviceType() !== 'desktop' &&
                <ButtonToolbar
                    class='mobile-view-toggler'
                    buttons={[
                        {icon: 'faStream', class:`${mobileView === 'navigator' ? 'active' : ''}`, action: () => {setMobileView('navigator')} },
                        {icon: 'faPenNib', class:`${mobileView === 'editor' ? 'active' : ''}`, action: () => {setMobileView('editor')} },
                        {icon: 'faEye', class:`${mobileView === 'preview' ? 'active' : ''}`, action: () => {setMobileView('preview')} },
                    ]}
                />
            }
        </>, [mobileView, forceRerender])

    return {
        mobileView, setMobileView,
        MobileToolbarComponent
    }
}

export const mobileViewMenuCss = `
.mobile-view-toggler {
    position: fixed;
    bottom: 0px;
    left: 0px;
    z-index: 10;
    display:flex;
    width: 100%;
    list-style: none;
    margin: 0px;
    padding: 0px;
    background: ${cssVars.colors.main};
    li {
        flex: 1 1 auto;
        button {
            ${cssVars.els.button};
            padding: 8px;
            width: 100%;
            svg {
                color: white;
                transform: scale(1.1);
                background: rgba(255,255,255,0);
                padding: 10px 40px;
                border-radius: 6px;
            }
            &.active svg {
                background: rgba(255,255,255,0.2);
            }
        }
    }
}
`