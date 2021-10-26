import React, { useState } from 'react';
import { iAppView } from '../../../../shared/types.shared';
import { ButtonsToolbar, iToolbarButton } from '../../components/ButtonsToolbar.component';
import { deviceType, MobileView } from '../../managers/device.manager';
import { strings } from '../../managers/strings.manager';

export type iSwitchTypeViewFn = (view: iAppView) => void
export type onViewSwitchedFn = (view: iAppView) => void

export const useAppViewType = (p:{
    onViewSwitched:onViewSwitchedFn
}) => {

    const [currentAppView, setCurrentAppView] = useState<iAppView>('text')

    const switchAppView:iSwitchTypeViewFn = view => {
        console.log(`[APP VIEW] switching from ${currentAppView} to ${view}`);
        setCurrentAppView(view)
        setTimeout(() => {
            p.onViewSwitched(view)
        })
    }

    const AppViewSwitcherComponent = () => {
        const nView = currentAppView === 'text' ? 'image': 'text'
        const buttonsConf:iToolbarButton[] = [
            {
                icon: 'faFileAlt',
                // icon: 'faCopy',
                title: strings.appviews.text,
                action: e => { if (currentAppView === 'image' ) switchAppView(nView)},
                active: currentAppView === 'text'
            },
            {
                // icon: 'faImages',
                icon: 'faFileImage',
                title: strings.appviews.image,
                action: e => { if (currentAppView === 'text' ) switchAppView(nView)},
                active: currentAppView === 'image'
            },
        ]
        return (
            <div className="app-view-switcher-component">
                <ButtonsToolbar buttons={buttonsConf} />
            </div>
        )
    }

    return {
        currentAppView, switchAppView,
        AppViewSwitcherComponent
    }
}


export const AppViewSwitcherComponentCss = `
    .app-view-switcher-component {
        margin: 0px 10px 10px 10px;
        ul.buttons-toolbar-component {
            li {
                margin-left: 5px;
                margin-right: 5px;
            }
        }
    }
`


const leftWidthImage = 15
const leftWidthImageMobile = 40
export const GlobalAppViewCss = () => `
    .main-wrapper.view-image {
        .mobile-view-toggler {
            display: none;
        }
        
        .left-wrapper {
            width: ${deviceType() === 'desktop' ? leftWidthImage : leftWidthImageMobile}vw ;
            .left-wrapper-1 {
                width: 100%
            }
            .left-wrapper-2 {
                display: none;
            }
        }


        .right-wrapper.dual-viewer-view {
            display: none;
        }
        .right-wrapper {
            height: 100vh;
        }
        .right-wrapper.image-gallery-view {
            width: ${100 - (deviceType() === 'desktop' ? leftWidthImage : leftWidthImageMobile)}vw;
        }
    }
    
    .main-wrapper.view-text {
        .right-wrapper.dual-viewer-view {
            
        }
        .right-wrapper.image-gallery-view {
            display: none;
        }
    }
`