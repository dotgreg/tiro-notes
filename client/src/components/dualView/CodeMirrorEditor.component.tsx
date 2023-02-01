import React, { forwardRef, useEffect, useRef, useState } from "react";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { autocompletion } from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { cssVars } from "../../managers/style/vars.style.manager";
import { syncScroll3 } from "../../hooks/syncScroll.hook";
import { isA } from "../../managers/device.manager";
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

		syncScrollUpdateDims()
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


	const { userSettingsApi } = useUserSettings()
	const ua = userSettingsApi
	if (ua.get("ui_editor_links_as_button")) {
		codemirrorExtensions.push(linksPreviewPlugin)
		codemirrorExtensions.push(noteLinkPreviewPlugin(p.windowId))
		// codemirrorExtensions.push(ctagPreviewPlugin)
	}
	if (ua.get("ui_editor_markdown_preview")) {
		codemirrorExtensions.push(markdownPreviewPluginWFile)
		markdownExtensionCnf.extensions.push(LatexMdEl)
		codemirrorExtensions.push(imagePreviewPlugin(p.file))
		codemirrorExtensions.push(filePreviewPlugin(p.file))
	}
	codemirrorExtensions.push(markdown(markdownExtensionCnf))


	return (
		<div className="codemirror-editor-wrapper">
			<CodeMirror
				value=""
				ref={forwardedRef as any}
				theme={getCustomTheme()}
				onChange={onChange}

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
		</div>
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
		word-break: break-all;
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

.cm-underline  {background: red}

`
