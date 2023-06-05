import React, { forwardRef, useEffect, useRef, useState } from "react";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { autocompletion } from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";

import { cssVars } from "../../managers/style/vars.style.manager";
import { syncScroll3 } from "../../hooks/syncScroll.hook";
import { deviceType, isA } from "../../managers/device.manager";
import { iFile } from "../../../../shared/types.shared";
import { onTitleClickFn } from "./EditorArea.component";
import { useElResize } from "../../hooks/useResize.hook";
import { CodeMirrorUtils } from "../../managers/codeMirror/editorUtils.cm";
import { getCustomTheme } from "../../managers/codeMirror/theme.cm";
import { getAllCompletionSources } from "../../managers/codeMirror/completion.cm";
import { sharedConfig } from "../../../../shared/shared.config";
import { LatexMdEl, markdownPreviewPlugin, styleCodeMirrorMarkdownPreviewPlugin } from "../../managers/codeMirror/markdownPreviewPlugin.cm";
import { useUserSettings } from "../../hooks/useUserSettings.hook";
import { Extension } from "@codemirror/state";
import { ressourcePreviewSimpleCss } from "../RessourcePreview.component";
import { linksPreviewPlugin } from "../../managers/codeMirror/urlLink.plugin.cm";
import { noteLinkCss, noteLinkPreviewPlugin } from "../../managers/codeMirror/noteLink.plugin.cm";
import { imagePreviewPlugin } from "../../managers/codeMirror/image.plugin.cm";
import { filePreviewPlugin } from "../../managers/codeMirror/filePreview.plugin.cm";
import { evenTable, markdownMobileTitle, markdownStylingTable, markdownStylingTableCell, markdownStylingTableCss, markdownStylingTableLimiter, testClassLine } from "../../managers/codeMirror/markdownStyling.cm";
import { ctagPreviewPlugin } from "../../managers/codeMirror/ctag.plugin.cm";
import { Icon2 } from "../Icon.component";
import { isBoolean } from "lodash";
import { useDebounce } from "../../hooks/lodash.hooks";
import { getApi } from "../../hooks/api/api.hook";


const h = `[Code Mirror]`
const log = sharedConfig.client.log.verbose

export interface iCMPluginConfig {
	markdown?: boolean
}

const CodeMirrorEditorInt = forwardRef((p: {
	windowId: string,

	value: string,
	onChange: (text: string) => void

	posY: number
	jumpToLine: number

	forceRender: number
	file: iFile

	// using it for title scrolling, right now its more title clicking
	onScroll: Function
	onTitleClick: onTitleClickFn

	pluginsConfig?: iCMPluginConfig
}, forwardedRefCM) => {
	let pluginsConfig = p.pluginsConfig
	if (!pluginsConfig) pluginsConfig = {}
	if (!isBoolean(pluginsConfig.markdown)) pluginsConfig.markdown = true


	const getEditorObj = (): ReactCodeMirrorRef | null => {
		// @ts-ignore
		const f: any = forwardedRefCM.current
		if (!f || !f.state) return null
		return f as ReactCodeMirrorRef
	}

	const histVal = useRef<null | string>(null)
	const initVal = (): boolean => {
		const f = getEditorObj()
		// @ts-ignore
		// window.cmobj = f
		if (!f) return false
		if (p.value === histVal.current) return false
		if (p.value === "loading...") return false
		if (f.view?.state.doc.toString() === p.value) return false
		const li = CodeMirrorUtils.getCurrentLineInfos(f)
		const cpos = li.currentPosition
		CodeMirrorUtils.updateText(f, p.value, cpos)
		histVal.current = p.value
		return true
	}




	//
	// INIT VAL MECHANISME
	//
	useEffect(() => {
		// initVal()
		// setTimeout(() => {initVal()}, 100)


		// need to wait for 100ms to get codemirror object, need to refactor that
		// if not wait, some notes on load wont appear
		// weird bug, only first loading on first note out of 5...
		initVal()

		// let histFilePath = p.file.path
		// setTimeout(() => {
		// 	if (histFilePath !== p.file.path) return
		// 	initVal()
		// }, 200)

		// console.log(res, 4440, p.value, p.forceRender);
		// let res = initVal()
		// devHook("cm_update")(p)
		// }, 100)


	}, [p.value, p.forceRender, p.file.path]);


	const [isAllFolded, setIsAllFolded] = useState(false)
	const toggleFoldAll = () => {
		let CMObj = getEditorObj()
		if (!isAllFolded) CodeMirrorUtils.foldAllChildren(CMObj)
		else CodeMirrorUtils.unfoldAllChildren(CMObj)
		setIsAllFolded(!isAllFolded)
	}
	useEffect(() => {
		setIsAllFolded(false)
	}, [p.file.path])




	const textContent = useRef<string>(p.value)
	useEffect(() => {
		textContent.current = p.value
	}, [p.value])

	const onChange = (value, viewUpdate) => {
		// console.log(333, value, viewUpdate)
		// activateTitleInt()
		// do not trigger change if value didnt changed from p.value (on file entering)
		if (value === p.value) return
		// debouncedActivateTitles()
		histVal.current = value
		textContent.current = value
		p.onChange(value)
		setShowHoverPopup(false)

		//
		evenTable.val = false

		syncScrollUpdateDims()
		// updatePosCmPlugins()
		// cacheNodeId && cacheNode.updatePosNodes(cacheNodeId)
	}


	//
	// JUMP TO LINE
	//
	useEffect(() => {
		log && console.log(h, "JUMP to line :", p.jumpToLine);
		if (p.jumpToLine === -1) return
		const f = getEditorObj()
		if (!f) return
		if (p.posY <= -10) return
		try {
			CodeMirrorUtils.scrollToLine(f, p.jumpToLine)
		} catch (error) {
			console.log(error)
		}
	}, [p.jumpToLine])






	//
	// ON TITLE HOVER, CREATE A LINK => should do it in CM logic instead
	//
	const onTitleClick = (titleStr: string) => {
		const f = getEditorObj()
		if (!f) return
		const infs = CodeMirrorUtils.getCurrentLineInfos(f)
		log && console.log(h, "CLICK ON TITLE DETECTED", titleStr, infs);
		p.onTitleClick(infs.lineIndex)
	}

	useEffect(() => {
		// debouncedActivateTitles()
		syncScrollUpdateDims()
	}, [p.value])
	useEffect(() => {
		// debouncedActivateTitles()
		syncScrollUpdateDims()
	}, [])
	// END OF TODO

	const { resizeState } = useElResize(`.window-id-${p.windowId}`)
	useEffect(() => {
		syncScrollUpdateDims()
	}, [resizeState])

	//
	// SYNCSCROLL SIZE UPDATE
	//
	const syncScrollUpdateDims = () => {
		const f = getEditorObj()
		if (!f) return
		let infs = CodeMirrorUtils.getEditorInfos(f.view)
		// console.log(infs);
		syncScroll3.updateEditorDims(p.windowId, { viewport: infs.viewportHeight, full: infs.contentHeight })
		syncScroll3.updateScrollerDims(p.windowId)
	}

	const markdownPreviewPluginWFile = markdownPreviewPlugin({
		file: p.file,
		onTitleClick: (title: string) => { onTitleClick(title) }
	})



	//
	// CM CONFIG MODIF ACCORDING TO USER PREFS
	//
	const codemirrorExtensions: Extension[] = [
		autocompletion({ override: getAllCompletionSources(p.file) }),
		EditorView.domEventHandlers({
			scroll(event, view) {
				// debouncedActivateTitles();
				// throttleActivateTitles();
			},
			wheel(event, view) {
				let infs = CodeMirrorUtils.getEditorInfos(view)
				syncScroll3.onEditorScroll(p.windowId, infs.currentPercentScrolled)
				p.onScroll()
			}
		})
	]
	const markdownExtensionCnf: any = {
		base: markdownLanguage,
		codeLanguages: languages,
		extensions: []
	}


	// if --table//--latex inside content
	let enhancedTable = p.value.includes("--table")
	let enhancedLatex = p.value.includes("--latex")

	const { userSettingsApi } = useUserSettings()
	const ua = userSettingsApi
	// let disablePlugins = true
	let disablePlugins = false
	// disable markdown plugin on mobile as it makes it really unstable and slow
	let disableMd = deviceType() !== "desktop"
	// disableMd = true

	// codemirrorExtensions.push(linksPreviewPlugin)
	if (ua.get("ui_editor_links_as_button") && !disablePlugins) {
		codemirrorExtensions.push(linksPreviewPlugin(p.file, p.windowId))
		codemirrorExtensions.push(noteLinkPreviewPlugin(p.file, p.windowId))
	}
	if (ua.get("ui_editor_markdown_table_preview") && enhancedTable && !disablePlugins) {
		codemirrorExtensions.push(markdownStylingTableLimiter(p.file, p.windowId))
		codemirrorExtensions.push(testClassLine(p.file, p.windowId))
		codemirrorExtensions.push(markdownStylingTableCell(p.file, p.windowId))
		codemirrorExtensions.push(markdownStylingTable(p.file, p.windowId))
	}
	if (ua.get("ui_editor_markdown_latex_preview") && enhancedLatex && !disablePlugins) {
		markdownExtensionCnf.extensions.push(LatexMdEl)
	}

	if (ua.get("ui_editor_markdown_preview") && !disablePlugins) {
		codemirrorExtensions.push(markdownPreviewPluginWFile)
		if (ua.get("ui_editor_markdown_enhanced_preview") && !disablePlugins) {
			codemirrorExtensions.push(imagePreviewPlugin(p.file, p.windowId))
			codemirrorExtensions.push(filePreviewPlugin(p.file, p.windowId))
			codemirrorExtensions.push(ctagPreviewPlugin(p.file, p.windowId))
		}
	}


	if (!disablePlugins && !disableMd && pluginsConfig.markdown) {
		codemirrorExtensions.push(markdown(markdownExtensionCnf))
	} else {
		// markdown replacement plugin for mobile
		codemirrorExtensions.push(markdownMobileTitle(p.file, p.windowId))
	}


	let classes = `device-${deviceType()} `
	if (ua.get("ui_editor_markdown_table_preview")) classes += "md-table-preview-enabled"


	//
	// ON UPDATE
	//
	const onCodeMirrorUpdate = (e: any) => {
		let s = e.state.selection.ranges[0]
		currSelection.current = s
	}

	//
	// ON SELECTION CHANGE, MAKE CONTEXT MENU APPEARING
	// 
	const mouseStatus = useRef<string>("")
	const [hoverPopupPos, setHoverPopupPos] = useState<number[]>([-9999, -9999])
	const [showHoverPopup, setShowHoverPopup] = useState<boolean>(false)
	const currSelection = useRef<{ from: number, to: number }>({ from: -1, to: -1 })
	const debounceSelectionMenu = useDebounce(() => {
		const f = getEditorObj()
		if (!f) return
		let selection = currSelection.current
		if (selection.from === selection.to) return
		if (mouseStatus.current === "up") {

			getApi(api => {
				const aiSelectionEnabled = api.userSettings.get("ui_editor_ai_text_selection")
				if (!aiSelectionEnabled) return
				setShowHoverPopup(true)
			})
		}
	}, 100)

	//
	// MONITOR MOUSE CHANGE
	//
	const onMouseEvent = (status: string, e: any) => {
		mouseStatus.current = status
		setHoverPopupPos([e.clientX, e.clientY])
		setShowHoverPopup(false)
		debounceSelectionMenu()
	}


	//
	// AI SEARCH AND INSERT
	//

	const genTextAt = (
		currentContent: string,
		textUpdate: string,
		question: string,
		insertPos: number,
		isLast: boolean
	) => {
		// gradually insert at the end of the selection the returned text
		let header = `\n\n ### Ai Answer\n => Answering to '${question.trim()}'... \n\n`
		let txtAi = `\n\n${textUpdate}`
		if (!isLast) txtAi = `${header}${textUpdate}\n\n### \n`
		const nText = currentContent.substring(0, insertPos) + txtAi + currentContent.substring(insertPos)
		getApi(api => {
			api.file.saveContent(p.file.path, nText)
		})

	}

	const triggerAiSearch = () => {
		// close the popup
		setShowHoverPopup(false)

		// get the text selection
		const s = currSelection.current
		let selectionTxt = textContent.current.substring(s.from, s.to)

		const currentContent = textContent.current
		const insertPos = s.to

		getApi(api => {

			let cmd = api.userSettings.get("ui_editor_ai_command")
			selectionTxt = selectionTxt.replaceAll('"', '\"')
			selectionTxt = selectionTxt.replaceAll('\"', '\"')
			selectionTxt = selectionTxt.replaceAll("'", "\'")
			// selectionTxt = selectionTxt.trim()
			cmd = cmd.replace("{{input}}", selectionTxt)
			// console.log({ cmd, insertPos });
			const question = selectionTxt
			genTextAt(currentContent, "...", question, insertPos, false)
			api.command.stream(cmd, streamChunk => {
				// console.log({ cmd, streamChunk, txt: streamChunk.textTot, insertPos });
				genTextAt(currentContent, streamChunk.textTot, question, insertPos, streamChunk.isLast)
			})
		})

	}


	return (
		<>
			{/* HOVER POPUP*/}
			{showHoverPopup &&
				<div
					className={`cm-hover-popup cm-selection-popup`}
					style={{ left: `${hoverPopupPos[0]}px`, top: `${hoverPopupPos[1]}px`, }}
				>
					<span
						onClick={triggerAiSearch}
						title="AI Suggest: ask the selection to AI"
						className="link-audio link-action"
					>
						<Icon2 name="wand-magic-sparkles" />
					</span>
				</div>
			}

			{/* CM WRAPPER*/}
			<div
				className={`codemirror-editor-wrapper ${classes} `}
				onMouseDown={e => { onMouseEvent("down", e) }}
				onMouseUp={e => { onMouseEvent("up", e) }}
			>


				<div className={`foldall-wrapper ${deviceType()}`} onClick={e => { toggleFoldAll() }}>
					<Icon2
						name={`${isAllFolded ? 'up-right-and-down-left-from-center' : 'down-left-and-up-right-to-center'}`}
						label={`${isAllFolded ? 'Unfold all text' : 'Fold all text'}`}
					/>
				</div>
				<CodeMirror
					value=""
					ref={forwardedRefCM as any}
					theme={getCustomTheme()}
					onChange={onChange /* only triggered on content change*/}
					onUpdate={e => {
						onCodeMirrorUpdate(e)
					}}
					// onScrollCapture={onCodeMirrorScroll}


					basicSetup={{
						foldGutter: true,
						dropCursor: false,
						allowMultipleSelections: false,
						indentOnInput: false,
						closeBrackets: false,
						bracketMatching: false,
						lineNumbers: false,
					}}
					extensions={codemirrorExtensions}
				/>
			</div >
		</>
	);
})

//
// CACHING MECHANISM

// export const CodeMirrorEditor = CodeMirrorEditorInt
export const CodeMirrorEditor = React.memo(CodeMirrorEditorInt,
	(np, pp) => {
		let res = true
		if (np.forceRender !== pp.forceRender) res = false
		if (np.jumpToLine !== pp.jumpToLine) res = false
		if (np.file.path !== pp.file.path) res = false
		// if (np.windowId !== pp.windowId) res = false
		// console.log("rerendercontrol cm", res);
		return res
	})




export const codeMirrorEditorCss = () => `
.cm-hover-popup.cm-selection-popup {
		position: fixed;
z-index: 2;
background: white;
padding: 5px;
box-shadow: 0px 0px 5px rgba(0,0,0,0.3);
border-radius: 3px;

}
.cm-selectionLayer {
    pointer-events: none;
		z-index:0!important;
}
.cm-selectionBackground {
		background: rgba(0,0,0,0.1);
}


.cm-gutters {
		border: none;
		opacity: 0;
		z-index: 0;
		&:hover {
				opacity: 1;
		}
		.cm-gutter {
				.cm-gutterElement span {
						color: #cccaca;
				}
		}
}
.device-mobile {
		.cm-gutters {
				opacity:1!important;
				// background:red!important;
		}
}

.foldall-wrapper {
		&.desktop {
				opacity: 0;
		}
		&.desktop:hover {	
				opacity: 1;
		}
		&::selection {
				background: none;
		}
		
		opacity:0.6;
		position: absolute;
		z-index: 1;
		top: 2px;
		color: #d7d7d7;
		cursor: pointer;
		padding: 5px 4px;
		left: 0px;
		background: white;
}


.actionable-title {
		color: ${cssVars.colors.main};
		position: relative;
		// &:before {
				// 		content: "➝";
				// 		position: absolute;
				// 		right: -20px;
				// 		color: #c6c6c6;
				// 		font-size: 18px;
				// 		opacity: 0;
				// 		transition: 0.2s all;
				// 		bottom: -3px;
				// }
		&:hover {
				&:before {
						opacity: 1
				}
		}
		&.h1 {
				font-size: 15px;
				font-weight: bold;
				text-decoration: underline;

		}
		&.h2 {
				font-size: 13px;
				text-decoration: underline;

		}
		&.h3 {
				font-size: 12px;
		}

}


.cm-matchingBracket {
		background-color: rgba(0,0,0,0)!important;
}


.cm-content {
		// font-family: 'Open sans', sans-serif;
		font-family: Consolas, monaco, monospace;
		font-size: 11px;
}

.cm-foldPlaceholder {
		margin-left: 8px;
		opacity: 0.4;
		padding: 2px 5px;
		border: none;
}
.cm-foldGutter {
		&::before {

		}
}

.cm-focused {
		outline: none!important;
}
.main-editor-wrapper {
		// width: calc(100% + 18px);
		// margin: 32px 0px 0px 0px;
		padding: 0px;
		width:100%;
		height: ${isA('desktop') ? 'calc(100% - 32px);' : 'calc(100% - 180px);'}; 
}

.codemirror-editor-wrapper {
		// margin-right: 18px;
		// width: calc(100% - 10px);
		position: relative;
		// left: -10px;
}
.codemirror-editor-wrapper, .cm-editor, .cm-theme {
		// height: calc(100% - 30px);
}
.codemirror-editor-wrapper, 	.cm-editor, .cm-theme {
		height: 100% ;
		overflow:hidden;
		padding: 0px;
}
.cm-editor {
		word-break: break-word;
}
.cm-search {
		padding: 6px 10px 11px;
}

.cm-scroller {
		z-index: auto!important;
		width: calc(100% - 30px);
		width: calc(100% - 30px); // reduce width overall CM
															padding-right: 35px; // make scrollbar disappear
																									 padding-left: 5px; // some space for the gutter
																																			.cm-content {
				width: calc(100% - 10px); // needed otherwise x scroll
																	overflow:hidden;
				white-space: pre-wrap;
		} 
}
.cm-line {
}
.cm-cursor {
}

.cm-tooltip-autocomplete {
		padding: 10px 5px;
		background: white;
		border-radius: 5px;
		border: none;
		box-shadow: 0px 0px 5px rgba(0,0,0,0.3);
		[aria-selected="true"]{
				background: ${cssVars.colors.main};
				border-radius: 2px;
		}

}

.codemirror-mobile-fallback {
		margin: 10px;
		p {
				color:grey;
				font-size: 10px;
		}
		textarea {
				width: calc(100% - 20px);
				height: calc(100vh - 230px);
				border: 0px;
		}
}

.test-success {
		// background: orange;
		color: red;
		display: block;
		padding-top: 50px;
}
.tiro-image {
		color: red;
		display: block;
		padding: 20px;
}
.tiro-image-wrapper{
		position: relative;

		&:before {
				position: absolute;
				top: 0px;
				left: 50%;
				content: "x";
				width: 50%;
				height: 100px;
				display:block;
				// background: orange;

		}
}

// ${styleCodeMirrorMarkdownPreviewPlugin()}

// // FILE RESSOURCE PREVIEW
// ${ressourcePreviewSimpleCss()}

// // PREVIEW LINK
// ${noteLinkCss()}


// ${markdownStylingTableCss()}
`
