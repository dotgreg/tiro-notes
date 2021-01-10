import React from 'react'
import styled from '@emotion/styled'

/**
 * Generic popup system
 */
export class Popup extends React.Component
    <{
        onClose:Function, 
        title:string,
    }, {
        
    }> {

    render() {
      return (
        <>
            <OverlayClickPopup onClick={e => {this.props.onClose()}}></OverlayClickPopup>
            {/* <OverlayClickPopup onClick={e => {}}></OverlayClickPopup> */}
            <PopupWrapper>
                <div className="popupTitle"> {this.props.title}</div>
                <div className="popupContent">{this.props.children}</div>
            </PopupWrapper>
        </>
      )
    }
}

const PopupWrapper = styled.div`
    position: absolute;
    z-index:1001;
    left: 50%;
    top:50%;
    width : auto;
    font-family: sans-serif;
    transform:translate(-50%,-50%);
    background: white;
    .popupTitle {
        margin: 0px 0px 20px 0px;
        text-align: left;
        background: grey;
        color: white;
        font-size: 14px;
        padding: 5px 0px 5px 20px;
    }
    .popupContent {
        padding: 0px 20px 20px 20px;
        min-width : 350px;
    }
    img{
        padding: 0px 5px 0px 0px;
        margin: 5px 5px 0px 0px;
    }
`
const OverlayClickPopup  = styled.div`
    position: absolute;
    z-index:1000;
    top: 0px;
    left: 0px;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.1);
`
  