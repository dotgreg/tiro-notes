import { css, cx } from '@emotion/css'
									 import { deviceType, MobileView, DeviceType } from '../device.manager';
import { cssVars } from './vars.style.manager';
import { commonCssEditors, editorAreaCss } from '../../components/dualView/EditorArea.component';
import { previewAreaCss } from '../../components/dualView/PreviewArea.component';
import { monacoColorsCss, monacoEditorCss } from '../../components/MonacoEditor.Component';
import { mobileViewMenuCss } from '../../hooks/app/mobileView.hook';
import { connectionIndicatorCss } from '../../hooks/app/connectionIndicator.hook';
import { newFileButtonCss } from '../../components/NewFileButton.component';
import { filesListCss } from '../../components/List.component';
import { mobileNoteToolbarCss } from '../../components/dualView/NoteToolbar.component';
import { folderTreeCss } from '../../components/TreeView.Component';
import { lastNotesCss } from '../../components/LastNotes.component';
import { setupConfigCss } from '../../hooks/app/setupConfig.hook';
import { inputComponentCss } from '../../components/Input.component';
import { AppViewSwitcherComponentCss, GlobalAppViewCss } from '../../hooks/app/appView.hook';
import { searchBarCss } from '../../components/SearchBar.component';
import { imageGalleryCss } from '../../components/ImageGallery.component';
import { ButtonsToolbarCss } from '../../components/ButtonsToolbar.component';
import { lightboxCss } from '../../components/Lightbox.component';
import { promptPopupCss } from '../../hooks/app/usePromptPopup.hook';
import { scrollingBarCss } from '../../components/dualView/Scroller.component';
import { draggableGridCss, GridMobileCss } from '../../components/windowGrid/DraggableGrid.component';
import { tabsCss } from '../../components/tabs/TabList.component';
import { dropdownCss } from '../../components/Dropdown.component';
import { uploadButtonCss } from '../../components/UploadButton.component';
import { uploadProgressBarCss } from '../../components/UploadProgressBar.component';
import { PopupWrapperCss } from '../../components/Popup.component';
import { contentBlockCss } from '../../components/ContentBlock.component';
import { settingsPopupCss } from '../../components/settingsView/settingsView.component';
import { codeMirrorEditorCss } from '../../components/dualView/CodeMirrorEditor.component';


export const css2 = (css: string) => css

let d = deviceType()
const { els, colors, font, sizes } = { ...cssVars }

export const CssApp2 = (
		mobileView: MobileView,
		refreshCss: number
) => {
		const cssString = `//css
		.content-image {
				width: 90%;
		}
		.full {
				.content-image {
				}
		}

		${GlobalAppViewCss()}
		${lightboxCss()}
		${promptPopupCss()}

		${AppViewSwitcherComponentCss}
		${ButtonsToolbarCss}

		.main-wrapper {
				display: flex;

				${imageGalleryCss()}

				${dropdownCss()}

				${searchBarCss()}

				${mobileViewMenuCss()}

				${connectionIndicatorCss()}

				${setupConfigCss()}

				${inputComponentCss()}

				${contentBlockCss()}

				.no-file {
						text-align: center;
						margin-top: 49vh;
				}

				${PopupWrapperCss()}


				${settingsPopupCss()}

				${lastNotesCss()}

				${folderTreeCss()}






				////////////////////////////////////////////v 
				// LEFT 1
				////////////////////////////////////////////v
				
				${newFileButtonCss()}

				&.device-view-mobile {
						.settings-button {
								bottom: 60px;
						}

				}
				.settings-button {
						position: fixed;
						bottom: 10px;
						left: 10px;
						z-index: 11;
				}



				&.without-sidebar.device-view-desktop {
						.left-sidebar-indicator {
								display: block;
								position: absolute;
								top: 0%;
								z-index:100;
								width: 18px;
								height: 100vh;
								background: rgb(236, 236, 236);
								box-shadow: 0px 0px 5px rgba(0,0,0,.2);
								margin: 0% 0px;
								border-radius: 0px 5px;
								.left-wrapper {
										box-shadow: 0px 0px 5px rgba(0,0,0,.2);
										transition: 0.2s all;
										transition-delay: 0s;
										position: absolute;
										left: -${sizes.desktop.l}vw;
										top: 0px;
								}
						}

						.left-sidebar-indicator:hover {
								.left-wrapper {
										left: 0vw;
										top: 0px;
								}
						}
				}

				.invisible-scrollbars {
						width: 100%;
						padding-right: 18px;
						overflow-y: scroll;
						height: 100vh;
				}

				.left-wrapper {
						background: ${colors.l2.bg}; 
						width: ${deviceType() === 'desktop' ? sizes.desktop.l : (mobileView !== 'navigator' ? 0 : 100)}vw;

						display: ${deviceType() === 'desktop' ? 'flex' : (mobileView !== 'navigator' ? 'none' : 'flex')};


						.left-wrapper-1 {
								overflow: hidden;
								background-image: url('${cssVars.assets.decoBgMap}');
								background-color: ${cssVars.colors.bgInterface2};
								background-blend-mode: color-burn;
								color: ${cssVars.colors.fontInterface2};
								width: ${sizes.desktop.l1}%;
								height:100vh;
								position: relative;


								h3.subtitle {
										margin: 0px 0px 15px;
										font-family: "Open sans", sans-serif;
										text-transform: uppercase;
										font-size: 14px;
										font-weight: 800;
										font-style: italic;
										color: ${colors.main};
								}
						}


						////////////////////////////////////////////v 
						// TEXT VIEW : LEFT 2
																////////////////////////////////////////////v2
																.left-wrapper-2 {
								width: ${sizes.desktop.l2}%;
								height:100vh;
								overflow: hidden;
								background: ${cssVars.colors.bgInterface};



								
								.top-files-list-wrapper {
										padding-top: ${sizes.search.padding}px;
										height: ${sizes.search.h}px;
										.subtitle-wrapper {
												position: relative;
												display: flex;
												.folder-wrapper {
														padding: 2px 16px 10px 20px;
														/* margin-top: 4px; */
														font-weight: bold;
														color: #aeadad;
												}
												.toggle-sidebar-btn {
														position: absolute;
														right: 10px;
												}

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

						

						
						

						.files-list-component {
								position: relative
						}

						.list-toolbar {
								position: absolute;
								top: -93px;
								right: 23px;
								color: ${colors.l2.text};
								button {
										color: ${colors.l2.text};
										${els().button}
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

						
						${filesListCss()}

						
				}

				









				////////////////////////////////////////////v 
				// IMAGE GALLERY VIEW
				////////////////////////////////////////////v
				.right-wrapper.image-gallery-view {
						background: ${colors.l2.bg}; 
						.image-gallery-header {
								padding-top: ${sizes.search.padding}px;
								height: ${sizes.gallery.topH}px;

								.search-bar-component {
										// padding: 10px 0px;
								}
						}

						.image-gallery-component-wrapper {
								
						}
				}



				////////////////////////////////////////////v 
				// TEXT VIEW : RIGHT
													 ////////////////////////////////////////////v 
													 ${tabsCss()}
				${draggableGridCss()}
				${GridMobileCss()}

				${mobileNoteToolbarCss()}
				${scrollingBarCss()}

				&.without-sidebar.device-view-desktop {
						.right-wrapper.dual-viewer-view {
								width: calc(100vw - 18px);
								margin-left: 18px;
						}
				}

				.right-wrapper.dual-viewer-view {

						width: ${deviceType() === 'desktop' ? sizes.desktop.r : (mobileView !== 'navigator' ? 100 : 0)}vw;
						height: 100vh;
						display: ${deviceType() === 'desktop' ? 'block' : (mobileView !== 'navigator' ? 'block' : 'none')};
						padding-top: 0px;
						.note-wrapper {
								.dual-view-wrapper.device-tablet, 
								.dual-view-wrapper.device-mobile {
										.editor-area,
										.preview-area-wrapper {
												width: 100%;
										}
								}
								.dual-view-wrapper {
										&.view-both.device-desktop {
												.preview-area-wrapper {
														width: 50%;
												}
										}



										.__EDITOR_DESIGN HERE__ {}
										&.view-editor.device-desktop {
												.editor-area {
														width: 100%;
												}

												.preview-area-wrapper {
														display:none
												}
										}

										&.view-editor-with-map.device-desktop {
												.editor-area {
														width: 80%;
												}

												.__MINIMAP_DESIGN HERE__ {}

												.preview-area-wrapper:hover {
														transform: scale(0.8);
														right: -50%;
														opacity: 1;
														box-shadow: -4px 5px 10px rgba(0, 0, 0, 0.10);
														.preview-area {
																width: 56%;
																padding: 20px;
														}
												}
												.preview-area-wrapper {
														word-break: break-word;
														transform: scale(0.2) translateZ(0);
														transform-origin: 0px 0px;
														position: absolute;
														width: 100%;
														right: calc(-80% - 20px);
														height: 500vh;
														.preview-area {
																padding: 80px;
																padding-right: 140px;
																padding-left: 40px;
														}
												}
										}

										&.view-preview.device-desktop {
												.editor-area {
														position: absolute;
														.main-editor-wrapper {
																display:none;
														}
												}
												.preview-area-wrapper {
														width: 100%;
														.preview-area {
														}
												}
										}

										position:relative;
										display: ${deviceType() === 'desktop' ? 'flex' : 'block'};
										
										
										

										${editorAreaCss(mobileView)}
										${codeMirrorEditorCss()}

										${monacoColorsCss()}
										${monacoEditorCss()}

										${previewAreaCss()}

										${uploadButtonCss()}
										${uploadProgressBarCss()}
										
								}
								
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


.preview-content {
		counter-reset: h2counter;
    h1 {
        counter-reset: h2counter;
    }
    h2:before {
        content: counter(h2counter) ".\\0000a0\\0000a0";
        counter-increment: h2counter;
        counter-reset: h3counter;
    }
    h3:before {
        content: counter(h2counter) "." counter(h3counter) ".\\0000a0\\0000a0";
        counter-increment: h3counter;
    }
}


`//css

return css`${cssString}`
}
