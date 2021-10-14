import { Global } from '@emotion/react'
import { css, cx } from '@emotion/css'
import styled from '@emotion/styled';
import { deviceType, MobileView, DeviceType } from '../device.manager';
import {DragzoneCss} from '../../hooks/editor/editorUpload.hook'
import { cssVars } from './vars.style.manager';
import { editorAreaCss } from '../../components/dualView/EditorArea.component';
import { previewAreaCss } from '../../components/dualView/PreviewArea.component';
import { monacoColorsCss } from '../../components/MonacoEditor.Component';
import { mobileViewMenuCss } from '../../hooks/app/mobileView.hook';
import { connectionIndicatorCss } from '../../hooks/app/connectionIndicator.hook';
import { newFileButtonCss } from '../../components/NewFileButton.component';
import { filesListCss } from '../../components/List.component';
import { mobileNoteToolbarCss } from '../../components/dualView/NoteToolbar.component';
import { folderTreeCss } from '../../components/TreeView.Component';
import { lastNotesCss } from '../../components/LastNotes.component';
import { setupConfigCss } from '../../hooks/app/setupConfig.hook';
import { inputComponentCss } from '../../components/Input.component';
import { PopupWrapperCss } from '../../components/Popup.component';
import { AppView, AppViewSwitcherComponentCss, GlobalAppViewCss } from '../../hooks/app/appView.hook';
import { searchBarCss } from '../../components/SearchBar.component';
import { imageGalleryCss } from '../../components/ImageGallery.component';

let d = deviceType()
const {els,colors,font,sizes, other } = {...cssVars}

export const CssApp2 = (mobileView:MobileView) => {
  
const cssString = `
.content-image {
    width: 90%;
  }
.full {
  .content-image {
  }
}

${GlobalAppViewCss}
${AppViewSwitcherComponentCss}

.main-wrapper {
  display: flex;

  ${imageGalleryCss}

  ${searchBarCss}

  ${mobileViewMenuCss}

  ${connectionIndicatorCss}

  ${setupConfigCss}

  ${inputComponentCss}

  .no-file {
    text-align: center;
    margin-top: 49vh;
  }











  ////////////////////////////////////////////v 
  // LEFT 1
  ////////////////////////////////////////////v
  
  ${newFileButtonCss}

  .settings-button {
    position: fixed;
    bottom: 10px;
    right: 10px;
    z-index: 11;
  }



  .left-wrapper {
    background: ${colors.l2.bg}; 
    width: ${deviceType() === 'desktop' ? sizes.desktop.l : (mobileView !== 'navigator' ? 0 : 100)}vw;
    display: ${deviceType() === 'desktop' ? 'flex' : (mobileView !== 'navigator' ? 'none' : 'flex')};



    .left-wrapper-1 {
      overflow: hidden;
      background-color: ${colors.l1.bg}; 
      background-image: url('${cssVars.assets.decoBgMap}');
      background-blend-mode: color-burn;
      color: ${colors.l1.font};
      width: ${sizes.desktop.l1}%;
      height:100vh;
      position: relative;

      ${lastNotesCss}

      ${folderTreeCss}
    }












    ////////////////////////////////////////////v 
    // LEFT 2
    ////////////////////////////////////////////v2
    .left-wrapper-2 {
      width: ${sizes.desktop.l2}%;
      height:100vh;
      overflow: hidden;
      
      .top-files-list-wrapper {
        padding-top: ${sizes.search.padding}px;
        height: ${sizes.search.h}px;
        .subtitle-wrapper {
          display: flex;
          h3.subtitle {
            margin: 0px ${sizes.block}px ${sizes.block}px ${sizes.block}px; 
          }
          .counter {
            margin: 0px;
            margin-top: 2px;
            color: ${colors.l2.text};
            font-size: 10px;
            font-weight: 800;
          }
        }
      }

      
    }

    

    
    .search-status {
      text-align: center;
      font-size: 8px;
    }

    .files-list-component {
      position: relative
    }

    .list-toolbar {
      position: absolute;
      top: -93px;
      right: 0px;
      color: ${colors.l2.text};
      button {
        color: ${colors.l2.text};
        ${els.button}
        padding: 0px;
        margin-right: ${sizes.block}px; 
        font-size: 10px;
        cursor: pointer;
        span {
          margin-right: 5px;
        }
      }

      .items-list-count {
        position: absolute;
        color: grey;
        font-size: 10px;
        right: 10px;
        top: 5px;
      }
    }

    
    ${filesListCss}

    
  }

  








  ////////////////////////////////////////////v 
  // RIGHT
  ////////////////////////////////////////////v 
  .right-wrapper {
      width: ${deviceType() === 'desktop' ? sizes.desktop.r : (mobileView !== 'navigator' ? 100 : 0)}vw;
      display: ${deviceType() === 'desktop' ? 'block' : (mobileView !== 'navigator' ? 'block' : 'none')};
      padding-top: 0px;
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
            position: absolute;
            .main-editor-wrapper {
              display:none;
            }
          }
          .preview-area {
            width: 100%;
            padding: 0px ${sizes.block*3}px;
          }
        }
        position:relative;
        display: ${deviceType() === 'desktop' ? 'flex' : 'block'};
        
        
        
        ${DragzoneCss}
        

        ${editorAreaCss(mobileView)}

        ${monacoColorsCss}

        ${previewAreaCss(mobileView)}
        
      }
        ${mobileNoteToolbarCss}
      }
    
      
      
      h3 {
        margin-bottom: 0px;
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

  return css`${cssString}`
}

// export const CssApp = styled.div<{v:MobileView }>`
// .content-image {
//     /* max-width: 300px; */
//     width: 90%;
//     color: ${test2()};
//   }
// .full {
//   .content-image {
//     /* max-width: 10000px; */
//   }
// }

// .main-wrapper {
//   display: flex;


//   ${mobileViewMenuCss}

//   ${connectionIndicatorCss}

//   ${setupConfigCss}

//   ${inputComponentCss}

//   .no-file {
//     text-align: center;
//     margin-top: 49vh;
//   }











//   ////////////////////////////////////////////v 
//   // LEFT 1
//   ////////////////////////////////////////////v
  
//   ${newFileButtonCss}



//   .left-wrapper {
//     background: ${colors.l2.bg}; 
//     width: ${deviceType() === 'desktop' ? sizes.desktop.l : (mobileView !== 'navigator' ? 0 : 100)}vw;
//     display: ${deviceType() === 'desktop' ? 'flex' : (mobileView !== 'navigator' ? 'none' : 'flex')};



//     .left-wrapper-1 {
//       overflow: hidden;
//       background-color: ${colors.l1.bg}; 
//       background-image: url('${cssVars.assets.decoBgMap}');
//       background-blend-mode: color-burn;
//       color: ${colors.l1.font};
//       width: ${sizes.desktop.l1}%;
//       height:100vh;
//       position: relative;

//       ${lastNotesCss}

//       ${folderTreeCss}
//     }












//     ////////////////////////////////////////////v 
//     // LEFT 2
//     ////////////////////////////////////////////v2
//     .left-wrapper-2 {
//       width: ${sizes.desktop.l2}%;
//       height:100vh;
//       overflow: hidden;
      
//       .top-files-list-wrapper {
//         padding-top: ${sizes.search.padding}px;
//         height: ${sizes.search.h}px;
//         .subtitle-wrapper {
//           display: flex;
//           h3.subtitle {
//             margin: 0px ${sizes.block}px ${sizes.block}px ${sizes.block}px; 
//           }
//           .counter {
//             margin: 0px;
//             margin-top: 2px;
//             color: ${colors.l2.text};
//             font-size: 10px;
//             font-weight: 800;
//           }
//         }
//         .search-input {
//           input {
//             ${other.radius}
//             width: calc(100% - ${sizes.block*2+20}px);
//             border: none;
//             background: white;
//             padding:14px 10px;
//             margin: 0px ${sizes.block}px ${sizes.block}px ${sizes.block}px; 
//             &::placeholder {
//               color: #afadad;
//             }
//           }
//         }
//       }

      
//     }

    

    
//     .search-status {
//       text-align: center;
//       font-size: 8px;
//     }

//     .files-list-component {
//       position: relative
//     }

//     .list-toolbar {
//       position: absolute;
//       top: -93px;
//       right: 0px;
//       color: ${colors.l2.text};
//       button {
//         color: ${colors.l2.text};
//         ${els.button}
//         padding: 0px;
//         margin-right: ${sizes.block}px; 
//         font-size: 10px;
//         cursor: pointer;
//         span {
//           margin-right: 5px;
//         }
//       }

//       .items-list-count {
//         position: absolute;
//         color: grey;
//         font-size: 10px;
//         right: 10px;
//         top: 5px;
//       }
//     }

    
//     ${filesListCss}

    
//   }

  








//   ////////////////////////////////////////////v 
//   // RIGHT
//   ////////////////////////////////////////////v 
//   .right-wrapper {
//       width: ${deviceType() === 'desktop' ? sizes.desktop.r : (mobileView !== 'navigator' ? 100 : 0)}vw;
//       display: ${deviceType() === 'desktop' ? 'block' : (mobileView !== 'navigator' ? 'block' : 'none')};
//       padding-top: 0px;
//     .note-wrapper {
//       .dual-view-wrapper {
//         &.view-editor {
//           .editor-area {
//             width: 100%;
//           }
//           .preview-area {
//             display: none;
//           }
//         }
//         &.view-preview {
//           .editor-area {
//             position: absolute;
//             .main-editor-wrapper {
//               display:none;
//             }
//           }
//           .preview-area {
//             width: 100%;
//             padding: 0px ${sizes.block*3}px;
//           }
//         }
//         position:relative;
//         display: ${deviceType() === 'desktop' ? 'flex' : 'block'};
        
        
        
//         ${DragzoneCss}
        

//         ${editorAreaCss(props.v)}

//         ${monacoColorsCss}

//         ${previewAreaCss(props.v)}
        
//       }
//         ${mobileNoteToolbarCss}
//       }
    
      
      
//       h3 {
//         margin-bottom: 0px;
//       }
//       pre {
//         white-space: -moz-pre-wrap; /* Mozilla, supported since 1999 */
//         white-space: -pre-wrap; /* Opera */
//         white-space: -o-pre-wrap; /* Opera */
//         white-space: pre-wrap; /* CSS3 - Text module (Candidate Recommendation) http://www.w3.org/TR/css3-text/#white-space */
//         word-wrap: break-word; /* IE 5.5+ */
//       }
//     }
//   }
// }
// `


