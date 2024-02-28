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
import { iUserSettingsApi, userSettingsSync } from '../../hooks/useUserSettings.hook';
import { FloatingPanelCss } from '../../components/FloatingPanels.component';
import { iPinStatuses } from '../../hooks/app/usePinnedInterface.hook';
import { windowEditorCss } from '../../components/windowGrid/WindowEditor.component';
import { passwordPopupCss } from '../../components/PasswordPopup.component';
import { hashtagCmPluginCss } from '../codeMirror/hashtag.plugin.cm';
import { datePickerCmPluginCss } from '../codeMirror/datePicker.cm';
import { getFontSize } from '../font.manager';
import { fileHistoryCss } from '../../components/FileHistoryPopup.component';
import { IconCss } from '../../components/Icon.component';
import { getLoginToken } from '../../hooks/app/loginToken.hook';
import { configClient } from '../../config';
import { absoluteLinkPathRoot } from '../textProcessor.manager';
import { BackgroundVideoCSS } from '../../components/BackgroundVideo.component';
import { checkboxTodoCmPluginCss } from '../codeMirror/checkboxTodo.cm';


export const css2 = (css: string) => css

let d = deviceType()
const { els, colors, font, sizes } = { ...cssVars }


//
// Dynamic CSS that changes often
// 
export const CssAppDynamic = memoize((a1, a2, a3, a4) => {
	// console.log("CssApp2memoize")	
	return CssAppIntDynamic(a1, a2, a3, a4)
}, (...args) => {
	// values(args).join("_"))
	return JSON.stringify(args)
})


//
// Static CSS that stays the same most of the time
// 
export const CssAppStatic = memoize((a1) => {
	// console.log("CssApp2memoize")	
	return CssAppIntStatic(a1)
}, (...args) => {
	// values(args).join("_"))
	return JSON.stringify(args)
})






const CssAppIntStatic = (
	// refreshCss: number,
	userSettings: iUserSettingsApi,
) => {
	// console.log("RELOAD CSS STATIC", {  userSettings})
	let end = perf("CssAppDynamic")


	//
	// Background image
	//
	let backgroundImageEnable = userSettingsSync.curr.ui_layout_background_image_enable
	let backgroundImage = userSettingsSync.curr.ui_layout_background_image
	let windowsOpacity = 100
	let windowOpacityActive = 100
	// if "https://www.youtube.com/embed"  is inside the url, then it's a video
	let backgroundVideoEnable = userSettingsSync.curr.ui_layout_background_video_enable

	// IF PICTURE BG
	if (backgroundImageEnable === true && backgroundVideoEnable === false) {
		// if exists, remove ?token=.... from the url
		let i = backgroundImage.indexOf('?token=')
		if (i > 0)  backgroundImage = backgroundImage.substring(0, i)
		// then add it back
		backgroundImage += `?token=${getLoginToken()}`
		// if does not start with http, add the server url
		if (!backgroundImage.startsWith('http')) {
			backgroundImage = `${absoluteLinkPathRoot(backgroundImage)}`
		}
	}
	// IF VIDEO BG

	// FOR BOTH
	if (backgroundVideoEnable === true || backgroundImageEnable === true) {
		windowsOpacity = parseInt(userSettingsSync.curr.ui_layout_background_image_window_opacity) / 100
		windowOpacityActive = parseInt(userSettingsSync.curr.ui_layout_background_image_window_opacity_active) / 100
	}


	const cssString = `
		// IMPORTANT for all height app
		height:100%;
		
		//
		// Background image
		//
		${backgroundImageEnable ? `background-image: url('${backgroundImage}');` : ''}
		
		background-size: cover;
		.react-grid-item {
			opacity: ${windowsOpacity};
		}
		.react-grid-item.active {
			opacity: ${windowOpacityActive};
		}

		${BackgroundVideoCSS()}


		// for preview css
		${styleCodeMirrorMarkdownPreviewPlugin()}
		// FILE RESSOURCE PREVIEW
		${ressourcePreviewSimpleCss()}
		// PREVIEW LINK
		${noteLinkCss()}
		${markdownStylingTableCss()}

		${fileHistoryCss()}

		${IconCss()}
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
		${checkboxTodoCmPluginCss()}

		${FloatingPanelCss()}

		${windowEditorCss()}
		${previewAreaCss()}
		${codeMirrorEditorCss()}
		${uploadButtonCss()}
		${uploadProgressBarCss()}

		${mobileNoteToolbarCss()}

		
		.config-buttons-bar {
			position: fixed;
			z-index: 300;
			background: ${deviceType() === "mobile" ? "none": "white"};
			right: ${deviceType() === "mobile" ? "3px": "0px"};
			bottom: ${deviceType() === "mobile" ? "55px": "3px"};
			display: ${deviceType() === "mobile" ? "block": "flex"};
			padding: 0px 9px;
			font-size: 10px;

			.config-button {
				font-size: 10px;
				// margin-top: 10px;
				opacity: 0.6;
				transition: 0.2s all; 
				padding: 6px;
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
												font-size: ${getFontSize()}px;
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
								font-size: ${getFontSize()}px;
								cursor: pointer;
								span {
										margin-right: 5px;
								}
						}

						.items-list-count {
								position: absolute;
								color: grey;
								font-size: ${getFontSize()}px;
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
			${GridMobileCss()}

			
			${scrollingBarCss()}

			&.without-sidebar.device-view-desktop {
					.right-wrapper.draggable-grid-editors-view {
							width: calc(100vw - 18px);
							margin-left: 18px;
					}
			}
		}// end main-wrapper
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
	
	`
	end()
	return css`${cssString}`
}

const CssAppIntDynamic = (
	mobileView: iMobileView,
	refreshCss: number,
	userSettings: iUserSettingsApi,
	pinStatus: iPinStatuses
) => {
	// console.log("RELOAD CSS DYNAMIC", {pinStatus, mobileView, refreshCss, userSettings})
	let end = perf("CssAppDynamic"+mobileView+refreshCss)
	const cssString = `
		// IMPORTANT for all height app
		height:100%;
		${editorAreaCss(mobileView)}
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
			////////////////////////////////////////////v 
			// TEXT VIEW : RIGHT
			////////////////////////////////////////////v 
			${draggableGridCss(pinStatus)}
			.left-wrapper {
				width: ${deviceType() === 'desktop' ? sizes.desktop.l : (mobileView !== 'navigator' ? 0 : 100)}vw;
				display: ${deviceType() === 'desktop' ? 'flex' : (mobileView !== 'navigator' ? 'none' : 'flex')};
			}
		} // end main-wrapper
`//css
end()
	return css`${cssString}`
}
