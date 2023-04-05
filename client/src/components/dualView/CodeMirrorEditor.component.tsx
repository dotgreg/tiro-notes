import React, { forwardRef, useEffect, useRef, useState } from "react";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { autocompletion } from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
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
import { evenTable, markdownStylingTable, markdownStylingTableCell, markdownStylingTableCss, markdownStylingTableLimiter } from "../../managers/codeMirror/markdownStyling.cm";
import { ctagPreviewPlugin } from "../../managers/codeMirror/ctag.plugin.cm";
import { cacheNode } from "../../managers/nodeCache.manager";

const h = `[Code Mirror]`
const log = sharedConfig.client.log.verbose

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
}, forwardedRef) => {


	const getEditorObj = (): any => {
		// @ts-ignore
		const f: any = forwardedRef.current
		if (!f || !f.state) return null
		return f
	}

	const histVal = useRef<null | string>(null)
	const initVal = (): boolean => {
		const f = getEditorObj()
		// @ts-ignore
		window.cmobj = f
		if (!f) return false

		if (p.value === histVal.current) return false
		if (p.value === "loading...") return false
		if (f.view.state.doc.toString() === p.value) return false
		const li = CodeMirrorUtils.getCurrentLineInfos(f)
		const cpos = li.currentPosition
		CodeMirrorUtils.updateText(f, p.value, cpos)
		histVal.current = p.value
		return true
	}



	//
	// Cache Nodes System
	//
	const cacheNodeRef = useRef()
	const [cacheNodeId, setCacheNodeId] = useState<string|null>(null)
	useEffect(() => {
		if (!cacheNodeId) {
			// create it
			if (!cacheNodeRef.current) return console.warn("cache node error 1")
			let cacheId = cacheNode.createCache(cacheNodeRef.current)
			setCacheNodeId(cacheId)
		} else {
			// path changed, delete cache node
			cacheNode.deleteCache(cacheNodeId)
		}
	}, [p.file.path])
	

	const onCodeMirrorScroll = (e) => {
		cacheNodeId && cacheNode.updatePosNodes(cacheNodeId)
	}


	
	//
	// INIT VAL MECHANISME
	//
	useEffect(() => {
		// setTimeout(() => {
		// need to wait for 100ms to get codemirror object, need to refactor that
		// console.log(res, 4440, p.value, p.forceRender);
		let res = initVal()
		// }, 100)
	}, [p.value, p.forceRender]);


	const onChange = (value, viewUpdate) => {
		// activateTitleInt()
		// do not trigger change if value didnt changed from p.value (on file entering)
		if (value === p.value) return
		// debouncedActivateTitles()
		histVal.current = value
		p.onChange(value)

		//
		evenTable.val = false

		syncScrollUpdateDims()
		// updatePosCmPlugins()
		cacheNodeId && cacheNode.updatePosNodes(cacheNodeId)
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
		CodeMirrorUtils.scrollToLine(f, p.jumpToLine)
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


	// if --disable-table inside content
	let enhancedTable = !p.value.includes("--no-editor-table") && !p.value.includes("--nt")
	let enhancedLatex = !p.value.includes("--no-latex") && !p.value.includes("--nl")

	const { userSettingsApi } = useUserSettings()
	const ua = userSettingsApi
	// const disablePlugins = true
	const disablePlugins = false
	// disable markdown plugin on mobile as it makes it really unstable and slow
	const disableMd = deviceType() !== "desktop"

	// codemirrorExtensions.push(linksPreviewPlugin)
	if (ua.get("ui_editor_links_as_button") && !disablePlugins) {
		codemirrorExtensions.push(linksPreviewPlugin)
		codemirrorExtensions.push(noteLinkPreviewPlugin(p.windowId))
		// codemirrorExtensions.push(ctagPreviewPlugin)
	}
	if (ua.get("ui_editor_markdown_table_preview") && enhancedTable && !disablePlugins) {
		codemirrorExtensions.push(markdownStylingTableLimiter)
		codemirrorExtensions.push(markdownStylingTableCell)
		codemirrorExtensions.push(markdownStylingTable())
	}
	if (ua.get("ui_editor_markdown_preview") && enhancedLatex && !disablePlugins) {
		markdownExtensionCnf.extensions.push(LatexMdEl)
	}
	if (ua.get("ui_editor_markdown_preview") && !disablePlugins) {
		codemirrorExtensions.push(markdownPreviewPluginWFile)
		codemirrorExtensions.push(imagePreviewPlugin(p.file))
		codemirrorExtensions.push(filePreviewPlugin(p.file, cacheNodeId))
		codemirrorExtensions.push(ctagPreviewPlugin(p.file, cacheNodeId))
	}
	if (!disablePlugins && !disableMd) {
		codemirrorExtensions.push(markdown(markdownExtensionCnf))
	}

	let classes = ``
	if (ua.get("ui_editor_markdown_table_preview")) classes += "md-table-preview-enabled"

	 
	// const [cmTop, setCmTop] = useState(0)
	// const onCodeMScroll = (e) => {
	// 	updatePosCmPlugins()
	// }

	// const updatePosCmPlugins = () => {
	// 	// if (!forwardedRef || !forwardedRef.current) return
	// 	// console.log(22111, forwardedRef.current)
	// 	// @ts-ignore
	// 	let el2 = forwardedRef.current
	// 	if (!el2) return
		
	// 	let parEl = el2.editor.parentNode
	// 	let scrollEl = parEl.querySelector(".cm-scroller")
	// 	let iframeEl = parEl.querySelector(".teststorage")
	// 	let placeholderEl = parEl.querySelector(".anchor-link-cm")
	// 	let scrollCm = scrollEl.scrollTop
	// 	if (!iframeEl) return
		
	// 	// if placeholder not here, make it invisible
	// 	let placeholderTop = placeholderEl ? placeholderEl.offsetTop : -99999

	// 	console.log(scrollCm, placeholderTop)
	// 	// iframeEl.style.top = scrollCm + placeholderTop
	// 	let nTop = -scrollCm + placeholderTop
	// 	iframeEl.style.transform = `translateY(${nTop}px);`
	// 	iframeEl.style.top = `${nTop}px`
	// }

	


	return (
		<div className={`codemirror-editor-wrapper ${classes}`}>
			{/* <div className="teststorage" style={{top:200+cmTop}}><iframe src="http://raw2.websocial.cc"></iframe></div> */}
			{/* <div className="teststorage"><iframe src="http://raw2.websocial.cc"></iframe></div> */}
			<div className="cache-nodes" ref={cacheNodeRef as any}></div>
			<CodeMirror
				value=""
				ref={forwardedRef as any}
				theme={getCustomTheme()}
				onChange={onChange}
				onScrollCapture={onCodeMirrorScroll}

				basicSetup={{
					foldGutter: false,
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
		// console.log("rerendercontrol cm", res);
		return res
	})




export const codeMirrorEditorCss = () => `
.teststorage {
    position: absolute;
    top: 120px;
    z-index: 10;
}
.cm-selectionLayer {
    pointer-events: none;
		z-index:0!important;
}
.cm-selectionBackground {
		background: rgba(0,0,0,0.1);
}


.actionable-title {
		color: ${cssVars.colors.main};
		position: relative;
		&:before {
				content: "➝";
				position: absolute;
				right: -20px;
				color: #c6c6c6;
				font-size: 18px;
				opacity: 0;
				transition: 0.2s all;
				bottom: -3px;
		}
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

.cm-focused {
		outline: none!important;
}
.main-editor-wrapper {
		width: calc(100% + 18px);
		margin: 32px 0px 0px 0px;
		padding: 0px;
		width:100%;
		height: ${isA('desktop') ? 'calc(100% - 32px);' : 'calc(100% - 180px);'}; 
}

.codemirror-editor-wrapper {
		margin-right: 18px;
		width: calc(100% - 10px);
}
.codemirror-editor-wrapper, 	.cm-editor, .cm-theme {
		height: calc(100% - 30px);
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
.cm-content {
		width: 100%;
		overflow:hidden;
		white-space: pre-wrap;
}
.cm-scroller {
		z-index: auto!important;
		left: 15px;
		padding-right: 25px;
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
		textarea {
				width: calc(100% - 20px);
				height: calc(100vh - 350px);
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

${styleCodeMirrorMarkdownPreviewPlugin()}

// FILE RESSOURCE PREVIEW
${ressourcePreviewSimpleCss()}

// PREVIEW LINK
${noteLinkCss()}


${markdownStylingTableCss()}
`
