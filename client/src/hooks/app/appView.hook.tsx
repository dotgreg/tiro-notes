import React, { useState } from 'react';

export type AppView = 'text'|'image'
export type iSwitchTypeViewFn = (view: AppView) => void
export type onViewSwitchedFn = (view: AppView) => void

export const useAppViewType = (p:{
    onViewSwitched:onViewSwitchedFn
}) => {

    const [currentAppView, setCurrentAppView] = useState<AppView>('text')

    const switchAppView:iSwitchTypeViewFn = view => {
        console.log(`[APP VIEW] switching from ${currentAppView} to ${view}`);
        setCurrentAppView(view)
        setTimeout(() => {
            p.onViewSwitched(view)
        })
    }

    const AppViewSwitcherComponent = () =>
        <div
            className="app-view-switcher-component"
        >
            <button onClick={e => {
                const nView = currentAppView === 'text' ? 'image': 'text'
                switchAppView(nView)
            }}> toggle view</button>
        </div>

    return {
        currentAppView, switchAppView,
        AppViewSwitcherComponent
    }
}


export const AppViewSwitcherComponentCss = `
    .top-files-list-wrapper {
        position: relative;
        .app-view-switcher-component {
            position: absolute;
            top: 10px;
            right: 100px;
        }
    }
`


const leftWidthImage = 15
export const GlobalAppViewCss = `
    .main-wrapper.view-image {
        .mobile-view-toggler {
            display: none;
        }
        
        .left-wrapper {
            width: ${leftWidthImage}vw;
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
        .right-wrapper.image-gallery-view {
            width: ${100 - leftWidthImage}vw;
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