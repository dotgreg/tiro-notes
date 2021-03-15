import { Global, css } from '@emotion/react'
import styled from '@emotion/styled';
import { deviceType, MobileView, DeviceType } from './device.manager';
import {DragzoneCss} from '../hooks/editor/editorUpload.hook'

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

const printCss = `

.preview-title, .date,
.editor-area, .connected, .left-wrapper {
  display:none!important;
}
html {
  overflow-y: scroll!important;
}
html, body {
  height: auto!important;
  background-color: white;
}
.preview-area {
  height: auto!important;
  overflow: visible!important;
  width: 100vw!important;
  top: 0;
  font-family: arial, sans-serif!important;
  left: 0;
  margin: 0;
  padding: 15px;
  font-size: 14px;
  line-height: 18px;
}
`

export const appFontFamily = `font-family: Verdana, DejaVu Sans, Bitstream Vera Sans, Geneva, sans-serif`
export const GlobalCssApp = css`
  * {
    -webkit-print-color-adjust: exact !important; 
    color-adjust: exact !important;             
  }
  body {
    margin: 0;
    padding: 0px;
    overflow: hidden;
    background: ${styleApp.colors.bg.light};
    font-size: 11px;
    ${appFontFamily};
    // font-family: Consolas, Menlo, Monaco, Lucida Console, Liberation Mono, DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace, serif;
  }
  html, body {
    height: 100vh;
    overflow:hidden;
  }

  @media print {
    ${printCss}
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
      display:flex;
      width: 100%;
      list-style: none;
      margin: 0px;
      padding: 0px;
      li {
        flex: 1 1 auto;
        button {
          padding: 10px;
          width: 100%;
        }
      }
  }

  .connection-status {
    font-size: 9px;
    z-index: 11;
    .back-online, .disconnected {
      position: absolute;
      text-align:center;
      color:white;
      top: 0px;
      left: 0px;
      width: 100vw;
      padding: 1px;
    }
    .back-online{
      background: green;
    }
    .disconnected{
      background: rgba(255,0,0,1);
    }
    .connected {
      position: absolute;
      bottom: 5px;
      right: 5px;
      color: green;
    }
  }

  .no-file {
    text-align: center;
    margin-top: 49vh;
  }

  ////////////////////////////////////////////v 
  // LEFT
  ////////////////////////////////////////////v
  .left-wrapper {
    background: ${styleApp.colors.bg.grey}; 
    width: ${d === 'desktop' ? '40' : (props => props.v !== 'navigator' ? 0 : 100)}vw;
    display: ${d === 'desktop' ? 'flex' : (props => props.v !== 'navigator' ? 'none' : 'flex')};
    .left-wrapper-1 {
      // remove scrollbar
      overflow: hidden;

      background: ${styleApp.colors.bg.dark}; 
      color: white;
      width: 40%;
      padding-left: ${d === 'desktop' ? '90' : '10'}px;
      height:100vh;
      position: relative;



      .folder-tree-view-component {
        // invisible scrollbars
        height: 100vh;
        padding-right: 20px;
        width: 100%;
        box-sizing: content-box;
        overflow-y:scroll;
        
        li.folder-wrapper {

          position: relative;
          .context-menu-wrapper {
            position: absolute;
            right: 5px;
            top: 5px;
            display:none;
            .context-menu {
              position: absolute;
              right: -15px;
              top: 17px;
              background: white;
              color: black;
              padding: 5px 10px;
              width: 70px;
              z-index: 10;
              border-radius: 4px;
              // display:none;
            }
          }
          .folder-title:hover > .context-menu-wrapper {
            cursor:pointer;
            display:block;
          }



          list-style: none;
          font-size: 12px;
          
          &.current > .folder-title {
              background: #01789cf5;
          }
          .folder-title {
            padding: 4px;
            position:relative;
            padding-left: 20px;
            .icon {
              position: absolute;
              left: 2px;
              cursor: pointer;
              padding: 4px;
              top: 0px;
            }
            .title {
              padding-left: 4px;
              cursor: pointer;
              padding: 4px 20px 4px 7px;
            }
          }
        }
        ul.folder-children {
          margin: 0px;
          padding: 0px 0px 0px 10px;
        }
      }

      // OLDY
      .folder-tree {
        // invisible scrollbars
        height: 100vh;
        padding-right: 20px;
        width: 100%;
        box-sizing: content-box;
        overflow-y:scroll;
      }
      
    }
    .left-wrapper-2 {
      width: 60%;
      height:100vh;
      overflow: hidden;
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
      .list-wrapper-scroller{
        // remove scroll
        height: 80vh;
        padding-right: 20px;
        width: 100%;
        box-sizing: content-box;
        overflow-y:scroll;
      }
      div.List {
          list-style: none;
          padding: 0px 0px 0px 0px;
          &.multiselect-mode {
            li .label {
              margin-left: 4px;
            }
          }
          li {
              padding: 5px 15px;
              display: block;
              border-bottom: 1px rgba(0,0,0,0.1) solid;
              color: blue;
              cursor: pointer;
              position: relative;
              height: 50px;
              overflow: hidden;
              &.multiselected,
              &.active  {
                
                  background: #ddddff;
              }

              .preview {
                position:relative;
                // float:left;

                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                justify-content: center;
                align-content: flex-start;
                align-items: flex-start;

                .content, .picture {
                  // display:inline-block;
                }
                &.with-image .content {
                  width: 60%;
                }
                .content {
                  color: grey;
                  font-size: 9px;
                  margin-top: 3px;
                  flex:  1 auto;
                  height: 34px;
                  overflow: hidden;
                  line-break: anywhere;
                  word-break: break-all;
                }
                .picture {
                  // flex: 1 1 auto;
                  width: 50px;
                  height: 50px;
                  background-size: cover;
                  position: relative;
                  top: 4px;
                  left: 14px;
                }
              }
              .checkbox {
                position: absolute;
                left: 0px;
                top: 3px;
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
      .dual-view-wrapper {



        &.view-editor {
          .editor-area {
            width: 100%;
          }
          .preview-area {
            display: none;
          }
        }
        &.view-preview {
          .editor-area {
            .title-input-wrapper {
              display: none;
            }
            width: 0%;
          }
          .preview-area {
            width: 100%;
          }
        }

        



        position:relative;
        display: ${d === 'desktop' ? 'flex' : 'block'};
        ${DragzoneCss}
        .editor-area {
          width: ${d === 'desktop' ? '50%' : (props => props.v === 'editor' ? '100vw' : '0vw')};
          display: ${d === 'desktop' ? 'block' : (props => props.v === 'editor' ? 'block' : 'none')};
          position: relative;
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
          position: relative;
          width: ${d === 'desktop' ? '43' : (props => props.v === 'editor' ? '0' : '91')}%;
          display: ${d === 'desktop' ? 'block' : (props => props.v === 'editor' ? 'none' : 'block')};
          padding: 0px 30px 30px 10px;
          height: ${d === 'desktop' ? '100vh':'87vh'};
          margin-bottom: 100px;
          overflow: hidden;
          ${d !== 'desktop' ? 'overflow-y: scroll;':''}

          .extrawurst-link {
            font-weight: 800;
            color: rgb(38 183 2);
          }
          .preview-content {
            margin-bottom:100px;
          }
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





      .preview-only .toolbar-wrapper {
        left: 10px;
      }

      .toolbar-wrapper {    
        position: absolute;
        z-index: 10;
        ${d !== 'desktop' ? 'top: -30px;':''}

        
        
        ul.toolbar {
          display: flex;
          list-style: none;
          padding: 0px 0px 0px 0px;
          margin: 10px 0px 0px 0px;
          &.editor-main-toolbar {
            margin-left: 10px
          }
          li {
    
          }
        }

        .mobile-text-manip-toolbar {
          position: fixed;
          bottom: 40px;
          display: flex;
          list-style: none;
          width: 100%;
          li {
            flex: 1 1 auto;
            button {
              width: 100%;
              padding: 5px;
            }
          }
        }

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
            // position:absolute;
            // right: 10px;
            margin-left: 30px;
          }
        }
      }
    
      
      .title-input-wrapper {
          position:relative;
          margin-top: 62px; 
          .press-to-save {
            position: absolute;
            top: 32px;
            font-size: 8px;
            color: darkgrey;
            right: 47px;
          }
          input {
            border: none;
            background: #eaeaea;
            padding: 10px 1vw;
            margin: 10px 10px; 
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


