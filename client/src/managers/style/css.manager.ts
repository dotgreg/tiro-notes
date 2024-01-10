import { css, cx } from '@emotion/css'
import { deviceType, iMobileView } from '../device.manager';
import { cssVars } from './vars.style.manager';
import {  editorAreaCss } from '../../components/dualView/EditorArea.component';
import { previewAreaCss } from '../../components/dualView/PreviewArea.component';
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
import { latexCss } from '../latex.manager';
import { omnibarPopupCss } from '../../components/OmniBar.component';
import { shortcutCompCss } from '../../components/Shortcuts.component';
import { renderedNoteCompCss } from '../../components/RenderedNote.component';
import { linksPreviewMdCss } from '../codeMirror/urlLink.plugin.cm';
import { NotePreviewCss } from '../../components/NotePreview.component';
import { titleEditorCss } from '../../components/dualView/TitleEditor.component';
import { mem } from '../reactRenderer.manager';
import { ctagPreviewPluginCss } from '../codeMirror/ctag.plugin.cm';
import { NotificationsCenterCss } from '../../components/NotificationsCenter.component';
import { dualViewerCss } from '../../components/dualView/DualViewer.component';
import { notePreviewPopupCss } from '../../components/NotePreviewPopup.component';
import { styleCodeMirrorMarkdownPreviewPlugin } from '../codeMirror/markdownPreviewPlugin.cm';
import { ressourcePreviewSimpleCss } from '../../components/RessourcePreview.component';
import { noteLinkCss } from '../codeMirror/noteLink.plugin.cm';
import { markdownStylingTableCss } from '../codeMirror/markdownStyling.cm';
import { pluginsMarketplacePopupCss } from '../../components/settingsView/pluginsMarketplacePopup.component';
import { perf } from '../performance.manager';
import { memoize, values } from 'lodash-es';
import { iUserSettingsApi } from '../../hooks/useUserSettings.hook';
import { FloatingPanelCss } from '../../components/FloatingPanels.component';
import { iPinStatuses } from '../../hooks/app/usePinnedInterface.hook';
import { windowEditorCss } from '../../components/windowGrid/WindowEditor.component';
import { passwordPopupCss } from '../../components/PasswordPopup.component';
import { hashtagCmPluginCss } from '../codeMirror/hashtag.plugin.cm';
import { datePickerCmPluginCss } from '../codeMirror/datePicker.cm';


export const css2 = (css: string) => css

let d = deviceType()
const { els, colors, font, sizes } = { ...cssVars }


// const hist = {a1:null, a2:null}
// export const forceCssAppUpdate = () => {
// 	hist.a1 = null
// 	hist.a2 = null
// }
export const CssApp2 = memoize((a1, a2, a3, a4) => {
	return CssApp2Int(a1, a2, a3, a4)
}, (...args) => {
	// values(args).join("_"))
	return JSON.stringify(args)
})

export const CssApp2Int = (
	mobileView: iMobileView,
	refreshCss: number,
	userSettings: iUserSettingsApi,
	pinStatus: iPinStatuses
) => {
	// console.log("RELOAD CSS", pinStatus)
	let end = perf("CssApp2"+mobileView+refreshCss)
	const cssString = `

		height:100%;
		.main-wrapper,
		.mobile-view-container {
			height:100%;
		}

		.content-image {
				width: 90%;
		}
		.full {
				.content-image {
				}
		}

		// for preview css
		${styleCodeMirrorMarkdownPreviewPlugin()}
		// FILE RESSOURCE PREVIEW
		${ressourcePreviewSimpleCss()}
		// PREVIEW LINK
		${noteLinkCss()}
		${markdownStylingTableCss()}


		
		${hashtagCmPluginCss()}
		${notePreviewPopupCss()}
		${GlobalAppViewCss()}
		${NotificationsCenterCss()}
		${latexCss()}
		${lightboxCss()}
		${promptPopupCss()}
		${omnibarPopupCss()}

		${AppViewSwitcherComponentCss()}
		${ButtonsToolbarCss()}


		${imageGalleryCss()}

		${dropdownCss()}

		${searchBarCss()}

		${mobileViewMenuCss()}

		${connectionIndicatorCss()}

		${setupConfigCss()}

		${inputComponentCss()}

		${contentBlockCss()}

		${settingsPopupCss()}
		${pluginsMarketplacePopupCss()}

		${lastNotesCss()}
		${shortcutCompCss()}
		${renderedNoteCompCss()}

		${NotePreviewCss()}
		${titleEditorCss()}

		${PopupWrapperCss()}
		${linksPreviewMdCss(userSettings)}
		${ctagPreviewPluginCss()}
		${passwordPopupCss()}
		${datePickerCmPluginCss()}

		${FloatingPanelCss()}

		${windowEditorCss()}
		${previewAreaCss()}
		${editorAreaCss(mobileView)}
		${codeMirrorEditorCss()}
		${uploadButtonCss()}
		${uploadProgressBarCss()}

		${dualViewerCss(mobileView, pinStatus)}

		.draggable-grid-editors-view {
			width: ${deviceType() === 'desktop' ? cssVars.sizes.desktop.r : (mobileView !== 'navigator' ? 100 : 0)}vw;
			height: ${deviceType() === 'desktop' ? `calc(100vh - ${pinStatus.bottomBar ? "30" : "10"}px)` : "100%"};
			display: ${deviceType() === 'desktop' ? 'block' : (mobileView !== 'navigator' ? 'block' : 'none')};
			padding-top: 0px;
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

		.main-wrapper {
				${folderTreeCss()}
				display: flex;
				.no-file {
						text-align: center;
						margin-top: 49vh;
				}








				////////////////////////////////////////////v 
				// LEFT 1
				////////////////////////////////////////////v
				
				${newFileButtonCss()}

				&.device-view-mobile {
						.config-buttons-bar {
								bottom: 60px;
						}

				}

				.config-buttons-bar {
					position: fixed;
					bottom: 4px;
					left: 3px;
					z-index: 20;

					.config-button {
						// margin-top: 10px;
						opacity: 0.6;
						transition: 0.2s all; 
						padding: 5px;
						cursor: pointer;
						&:hover {
							opacity: 1;
						}
					}
					.plugins-marketplace-button {

					}
					.settings-button {
						
					}	
				}
				 


				&.without-sidebar.device-view-desktop {
						.left-sidebar-indicator {
								transition: 0.5s all;	
								&:hover {
									background: ${cssVars.colors.main};
								}
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
										transition-delay: 500ms, 0ms;
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
						height: ${deviceType() === 'desktop' ? "100vh" : "calc(100vh - 48px)"}; 
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
				${draggableGridCss(pinStatus)}
				${GridMobileCss()}

				${mobileNoteToolbarCss()}
				${scrollingBarCss()}

				&.without-sidebar.device-view-desktop {
						.right-wrapper.draggable-grid-editors-view {
								width: calc(100vw - 18px);
								margin-left: 18px;
						}
				}
				
		} // end main-wrapper



		
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
end()
	return css`${cssString}`
}
