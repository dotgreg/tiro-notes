import React from 'react'
import styled from '@emotion/styled'
import { cssVars } from '../managers/style/vars.style.manager'
import { isIpad } from '../managers/device.manager'

/**
 * Generic popup system
 */
export class Popup extends React.Component
    <{
        onClose:Function, 
        title:string,
        inputFocus?:boolean,
    }, {
        
    }> {

    render() {
      return (
        <PopupWrapperCss>
            <div className="overlay-click-popup" onClick={e => {this.props.onClose()}}></div>
            <div className={`popup-wrapper ${isIpad() ? 'ipad' : ''}`}>
                <div className="popupTitle"> {this.props.title}</div>
                <div className="popupContent">{this.props.children}</div>
            </div>
        </PopupWrapperCss>
      )
    }
}

export const PopupWrapperCss = styled.div`
    .overlay-click-popup {
        position: fixed;
        z-index:1000;
        top: 0px;
        left: 0px;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.1);
    }
    .popup-wrapper {
        position: fixed;
        z-index:1001;
        left: 50%;
        top:50%;
        &.ipad {
            top:20%;
        }
        width : auto;
        transform:translate(-50%,-50%);
        background: white;
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
            min-width : 350px;
        }
        img{
            padding: 0px 5px 0px 0px;
            margin: 5px 5px 0px 0px;
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
  