import { Global, css } from '@emotion/react'
import styled from '@emotion/styled';
import { deviceType, MobileView, DeviceType } from './device.manager';

let d = deviceType()
// let v = 'editor'

export const styleApp = {
    inputText: `
        border: none;
        background: #eaeaea;
        padding: 10px 2vw;
        margin: 10px ; 
    `,
    colors: {
        bg: {
            dark: 'rgb(39, 39, 39)' ,
            grey: 'rgb(221, 221, 221)',
            light: '#fceeded6'
        }
    }
}

export const GlobalCssApp = css`
  body {
    margin: 0;
    padding: 0px;
    height: 100vh;
    overflow: hidden;
    background: ${styleApp.colors.bg.light};
    font-size: 11px;
    font-family: Consolas, Menlo, Monaco, Lucida Console, Liberation Mono, DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace, serif;
  }
  html, body {
    overflow-x: hidden;
    heigth: 100vh;
  }
  body {
    position: relative;
  }
`

export const CssApp = styled.div<{v:MobileView }>`

display: flex;
flex-wrap: wrap;
justify-content:center;


.content-image {
    /* max-width: 300px; */
    width: 90%;
  }
.full {
  .content-image {
    /* max-width: 10000px; */
  }
}

.main-wrapper {
  display: flex;


  .mobile-view-toggler {
      position: fixed;
      bottom: 0px;
      left: 0px;
      z-index: 10;
      button {
        width: 33vw;
        padding: 10px;
      }
  }

  .connection-status {
    position: absolute;
    bottom: 5px;
    right: 5px;
    font-size: 9px;
    z-index: 11;
    .disconnected{
      color:red;
    }
    .connected {
      color: green;
    }
  }

  ////////////////////////////////////////////v 
  // LEFT
  ////////////////////////////////////////////v
  .left-wrapper {
    background: ${styleApp.colors.bg.grey}; 
    width: ${d === 'desktop' ? '40' : (props => props.v !== 'navigator' ? 0 : 100)}vw;
    display: ${d === 'desktop' ? 'flex' : (props => props.v !== 'navigator' ? 'none' : 'flex')};
    .left-wrapper-1 {
      background: ${styleApp.colors.bg.dark}; 
      color: white;
      width: 40%;
      padding-left: ${d === 'desktop' ? '90' : '10'}px;
      height:100vh;
      overflow: hidden;
      overflow-y: auto;
      position: relative;

      
    }
    .left-wrapper-2 {
      width: 60%;
      height:100vh;
      overflow: hidden;
      overflow-y: auto;
    }

    .list-toolbar {
      padding: 0px 10px;
      position: relative;
      button {
        margin-right: 5px; 
      }

      .items-list-count {
        position: absolute;
        color: grey;
        font-size: 10px;
        right: 10px;
        top: 5px;
      }
    }

    .list-wrapper {
      ul {
          list-style: none;
          padding: 0px 0px 0px 0px;
          li {
              padding: 5px 15px;
              display: block;
              border-bottom: 1px rgba(0,0,0,0.1) solid;
              color: blue;
              cursor: pointer;
              position: relative;
              &.active {
                text-decoration: underline;
                  font-weight: 800;
                  background: #ddddff;
              }
              .checkbox {

              }
              .label {
                display: inline-block;
                width: 90%;
              }
              .date {
                position: absolute;
                color: #a8a6a6;
                font-size: 9px;
                right: 5px;
                top: 6px;
                &.modified {
                  color: green;
                }
              }
          }
      }
    }
    .search-input {
        input {
         ${styleApp.inputText}
        }
    }
    .search-status {
      text-align: center;
      font-size: 8px;
    }
  }

  ////////////////////////////////////////////v 
  // RIGHT
  ////////////////////////////////////////////v 
  .right-wrapper {
      width: ${d === 'desktop' ? '70' : (props => props.v !== 'navigator' ? 100 : 0)}vw;
      display: ${d === 'desktop' ? 'block' : (props => props.v !== 'navigator' ? 'block' : 'none')};
      /* padding: 10px; */
      padding-top: 0px;
      /* max-height: 100vh;
      overflow-y: auto; */
    .note-wrapper {
      .editor {
        display: ${d === 'desktop' ? 'flex' : 'block'};
        .dragzone {
          &.hidden {
            display:none;
          }
          display:block;
          position: absolute;
          top: 0px;
          left: 0px;
          width: 100vw;
          height: 100vh;
          z-index: 10;
          background: rgba(255,255,255,0.4);
        }
        .editor-area {
          &.inactive {
            display: none;
          }
          width: ${d === 'desktop' ? '50%' : (props => props.v === 'editor' ? '100vw' : '0vw')};
          display: ${d === 'desktop' ? 'block' : (props => props.v === 'editor' ? 'block' : 'none')};
          .monaco-editor {
            margin: 0px;
          }
          .textarea-editor {
            border: none;
            width: 96vw;
            height: 70vh;
            margin: 0px;
            padding: 2vw;
            background: rgba(255,255,255,0.7);
          }
      }
        .preview-area {
          .extrawurst-link {
            font-weight: 800;
            color: rgb(38 183 2);
          }
          &.full {
            width: 100%;
            pre {
              code {
                width: 90%;
              }
            }
          }
          width: ${d === 'desktop' ? '43' : (props => props.v === 'editor' ? '0' : '100')}%;
          /* display: ${d === 'desktop' ? 'block' : 'none'}; */
          display: ${d === 'desktop' ? 'block' : (props => props.v === 'editor' ? 'none' : 'block')};
          padding: 30px 30px 30px 10px;
          height: ${d === 'desktop' ? '100vh':'80vh'};
          margin-bottom: 100px;
          overflow: hidden;
          overflow-y: scroll;
          pre {
            code {
              display: block;
              background: #434242;
              border-radius: 8px;
              color: rgb(243 232 223);
              padding: 10px;
            }
          }
        }
      }






      .toolbar-wrapper {
        ${
          d === 'desktop' ?
          `position: absolute;
          left: 70%;
          width: 30%;`
          : `
          position: relative;
          `
        }
        padding: 10px 0px 10px 0px;
        
        .upload-button-wrapper {
          position: relative;  
          .input-file-hidden {
            width: 0.1px;
            height: 0.1px;
            opacity: 0;
            overflow: hidden;
            position: absolute;
            z-index: -1;
          }
        }


        button {
          margin-right: 5px;
          &.delete {
            /* background: red; */
            position:absolute;
            right: 10px;
          }
        }
      }
    
      
      .title-input-wrapper {
          input {
            border: none;
            background: #eaeaea;
            padding: 10px 1vw;
            margin: 10px 1vw; 
            width: ${d === 'desktop' ? '80%' :'96vw'};
          }
        }
      h3 {
        margin-bottom: 0px;
      }
      .date {
        font-size: 10px;
        color: grey;
      }
      pre {
        white-space: -moz-pre-wrap; /* Mozilla, supported since 1999 */
        white-space: -pre-wrap; /* Opera */
        white-space: -o-pre-wrap; /* Opera */
        white-space: pre-wrap; /* CSS3 - Text module (Candidate Recommendation) http://www.w3.org/TR/css3-text/#white-space */
        word-wrap: break-word; /* IE 5.5+ */
      }
    }
  }
}
`


