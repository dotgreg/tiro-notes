import React  from 'react';
import { ButtonToolbar } from '../../components/dualView/NoteToolbar.component';
import { deviceType, MobileView } from '../../managers/device.manager';
import { useLocalStorage } from '../useLocalStorage.hook';
import { useStatMemo } from "../useStatMemo.hook"

export const useMobileView = () => {

    const [mobileView, setMobileView] = useLocalStorage<MobileView>('mobileView','navigator')
    
    const MobileToolbarComponent = () => useStatMemo(
        <>
            { 
                deviceType() !== 'desktop' &&
                <ButtonToolbar
                    class='mobile-view-toggler'
                    buttons={[
                        {icon: 'faList', action: () => {setMobileView('navigator')} },
                        {icon: 'faEdit', action: () => {setMobileView('editor')} },
                        {icon: 'faEye', action: () => {setMobileView('preview')} },
                    ]}
                />
            }
        </>, [])

    return {
        mobileView, setMobileView,
        MobileToolbarComponent
    }
}