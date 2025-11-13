import React from 'react'
import styled from '@emotion/styled'
import { cssVars } from '../managers/style/vars.style.manager'
import { isIpad } from '../managers/device.manager'
import { css } from '@emotion/css'
import { Icon2 } from './Icon.component'

/**
 * Generic popup system
 */
export class Popup extends React.Component
	<{
		onClose: Function,
		title: string,
		disableBgClose?: boolean,
        disableBg?: boolean,
        cssStr?: string
	}, {

	}> {

	canBgClose = this.props.disableBgClose === true ? false : true
    cssStr = this.props.cssStr ? this.props.cssStr : ""
    disableBg = this.props.disableBg ? this.props.disableBg : false

	render() {
		return (
			<div className={`${css`${this.cssStr}`} popup-wrapper-component`} >
                {
                    !this.disableBg && <div className="overlay-click-popup" onClick={e => { if (this.canBgClose) this.props.onClose() }}></div>
                }
				<div className={`popup-wrapper ${isIpad() ? 'ipad' : ''}`}>
					<div className="popupTitle"> {this.props.title}</div>
					<div className="popupContent">{this.props.children}</div>
                    {
                        // button X
                        this.disableBg && <div className="close-popup" onClick={e => { if (this.canBgClose) this.props.onClose() }}> <Icon2 name="circle-xmark" color='white' /></div>
                    }
				</div>
			</div>
		)
	}
}

export const PopupWrapperCss = () => `
.popup-wrapper-component {
				position: absolute;
        top: 0px;
        left: 0px;
    .overlay-click-popup {
        position: fixed;
        z-index:10000;
        top: 0px;
        left: 0px;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.1);
    }
    .close-popup {
        position: absolute;
        top: -3px;
        right: 1px;
        cursor: pointer;
        padding: 10px;

    }
    .popup-wrapper {
        overflow-y: auto;
        position: fixed;
        z-index:10010;
        left: 50%;
        top:50%;
        &.ipad {
            top:20%;
        }
        max-height: 70%;
        
        width : auto;
        max-width: 90%;
        transform:translate(-50%,-50%);
				background: ${cssVars.colors.bgPopup};
        border-radius:6px;
        box-shadow: 0px 0px 5px rgba(0,0,0,.2);
        .popupTitle {
            margin: 0px 0px 20px 0px;
            text-align: left;
            background: ${cssVars.colors.main};
            color: white;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 14px;
            padding: 5px 0px 5px 20px;
            border-radius:6px 6px 0px 0px;
        }
        .popupContent {
            padding: 0px 20px 20px 20px;
            // min-width : 350px;
            // height: calc(100% - 69px);
            height: calc(100% - 69px);
            
        }
        img{
            padding: 0px 5px 0px 0px;
            margin: 5px 5px 0px 0px;
        }
    }
}
`

// const PopupWrapper = styled.div`
//     position: fixed;
//     z-index:1001;
//     left: 50%;
//     top:50%;
//     width : auto;
//     transform:translate(-50%,-50%);
//     background: white;
//     border-radius:6px;
//     box-shadow: 0px 0px 5px rgba(0,0,0,.2);
//     .popupTitle {
//         margin: 0px 0px 20px 0px;
//         text-align: left;
//         background: ${cssVars.colors.main};
//         color: white;
//         font-weight: 700;
//         text-transform: uppercase;
//         font-size: 14px;
//         padding: 5px 0px 5px 20px;
//         border-radius:6px 6px 0px 0px;
//     }
//     .popupContent {
//         padding: 0px 20px 20px 20px;
//         min-width : 350px;
//     }
//     img{
//         padding: 0px 5px 0px 0px;
//         margin: 5px 5px 0px 0px;
//     }
// `
// const OverlayClickPopup  = styled.div`
//     position: fixed;
//     z-index:1000;
//     top: 0px;
//     left: 0px;
//     width: 100vw;
//     height: 100vh;
//     background: rgba(0,0,0,0.1);
// `

