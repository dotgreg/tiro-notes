import React, { useState } from 'react';
import { ButtonsToolbar } from '../../components/ButtonsToolbar.component';
import { deviceType, iMobileView } from '../../managers/device.manager';
import { cssVars } from '../../managers/style/vars.style.manager';
import { useStatMemo } from "../useStatMemo.hook"

export const useMobileView = () => {

	const [mobileView, setMobileView] = useState<iMobileView>('navigator')

	const MobileToolbarComponent = (p: {
		forceRerender: boolean,
		onButtons: Function[]
	}) => useStatMemo(
		<>
			{
				deviceType() !== 'desktop' &&
				<ButtonsToolbar
					class='mobile-view-toggler'
					colors={["white","white"]}
					buttons={[
						{
							icon: 'faStream',
							class: `${mobileView === 'navigator' ? 'active' : ''}`,
							action: () => {
								setMobileView('navigator')
							}
						},
						{
							icon: 'faPenNib',
							class: `${mobileView === 'editor' ? 'active' : ''}`,
							action: () => { setMobileView('editor') }
						},
						{
							icon: 'faEye',
							class: `${mobileView === 'preview' ? 'active' : ''}`,
							action: () => { setMobileView('preview') }
						},
						{
							icon: 'faSearch',
							class: ``,
							action: () => { if (p.onButtons[0]) p.onButtons[0]() }
						},
					]}
				/>
			}
		</>, [mobileView, p.forceRerender])

	return {
		mobileView, setMobileView,
		MobileToolbarComponent
	}
}

export const mobileViewMenuCss = () => `
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
            ${cssVars.els().button};
            padding: 8px;
            width: 100%;
            span.icon-wrapper {
                transform: scale(1.1);
                background: rgba(255,255,255,0);
                padding: 10px 27px;
                border-radius: 6px;
            }
            &:hover {
                span.icon-wrapper {
                }
            }
            &.active {
                span.icon-wrapper {
                    background: rgba(255,255,255,0.2);
                }
            }
        }
    }
}
`
