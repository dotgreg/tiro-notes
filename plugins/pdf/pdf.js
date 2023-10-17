const pdfApp = (innerTagStr, opts) => {
	if (!opts) opts = {}
	if (!opts.open) opts.open = true

	const ressPath = opts.base_url + "/ressources"

	const h = `[CTAG PDF VIEWER] v1.1 path:"${ressPath}"`
	//@ts-ignore
	const api = window.api;
	const { div, updateContent } = api.utils.createDiv();

	const infos = api.utils.getInfos();

	let pdf_url = innerTagStr.trim()
	let pdf_name = pdf_url.split("/").slice(-1)[0]

	const isAbs = pdf_url.startsWith("http")
	if (isAbs === false) {
		pdf_url = infos.backendUrl + "/static/" + infos.file.folder + "/" + pdf_url + `?token=${infos.loginToken}`
	}

	window.pdf_controller = {
		disableAutoFetch: true,
		disableStream: true,
		debug: false,
		workerSrc: api.utils.getCachedRessourceUrl(`${ressPath}/pdf_lib.worker.js`),
		url: pdf_url
	}
	console.log(h, "STARTING PDF VIEWER WITH FOLLOWING PARAMS :", window.pdf_controller, infos);

	window.start_pdf_viewer = () => {
		setTimeout(() => {
			api.utils.loadRessources(
				[
					`${ressPath}/viewer.css`,
					`${ressPath}/pdf_lib.js`,
					`${ressPath}/pdf_lib.worker.js`,
				],
				() => {
					api.utils.loadScripts(
						[`${ressPath}/viewer.js`],
						() => {
							// execPdfViewer(innerTagStr)
						})
				}
			);
		}, 100)

		const html_pdf = `
				<style>
				#viewerContainer {
					// overflow:hidden!important;	
					min-height: 300px;
					height: calc(100vh - 43px);
				}
				.ctag-pdf-wrapper {
						width: 800px;
						height: 600px;
				}
				${pdfAppCss()}
				</style>

				<div id="ctag-pdf-wrapper">
					<div id="outerContainer">
						${pdfAppHtml()}
					
					</div>
				</div>

				`
		updateContent(html_pdf)
		api.utils.resizeIframe("80%");

	}


	api.utils.resizeIframe("100px");

	if (opts.open === true) {

		window.start_pdf_viewer()

	} else {
		const html_button = `
				<div class="button-open-pdf">
				<div class="resource-link-wrapper">
				<div class="resource-link-icon pdf"></div>
				<a class="resource-link preview-link" >
				${pdf_name}
				</a>
				</div>
				<button onclick="window.start_pdf_viewer()">Open</button>
				</div>
				<style>
				.button-open-pdf button {
						position: absolute;
						top: 26px;
						right: 20px;
				}
				.button-open-pdf .resource-link-wrapper {
						padding-right: 61px;
				}
				</style>
				`
		updateContent(html_button)
	}

	return div
}

window.initCustomTag = pdfApp




const pdfAppHtml = () => `
<div id="sidebarContainer">
<div id="toolbarSidebar">
<div id="toolbarSidebarLeft">
<div id="sidebarViewButtons" class="splitToolbarButton toggled" role="radiogroup">
<button id="viewThumbnail" class="toolbarButton toggled" title="Show Thumbnails" tabindex="2" data-l10n-id="thumbs" role="radio" aria-checked="true" aria-controls="thumbnailView">
<span data-l10n-id="thumbs_label">Thumbnails</span>
</button>
<button id="viewOutline" class="toolbarButton" title="Show Document Outline (double-click to expand/collapse all items)" tabindex="3" data-l10n-id="document_outline" role="radio" aria-checked="false" aria-controls="outlineView">
<span data-l10n-id="document_outline_label">Document Outline</span>
</button>
<button id="viewAttachments" class="toolbarButton" title="Show Attachments" tabindex="4" data-l10n-id="attachments" role="radio" aria-checked="false" aria-controls="attachmentsView">
<span data-l10n-id="attachments_label">Attachments</span>
</button>
<button id="viewLayers" class="toolbarButton" title="Show Layers (double-click to reset all layers to the default state)" tabindex="5" data-l10n-id="layers" role="radio" aria-checked="false" aria-controls="layersView">
<span data-l10n-id="layers_label">Layers</span>
</button>
</div>
</div>

<div id="toolbarSidebarRight">
<div id="outlineOptionsContainer" class="hidden">
<div class="verticalToolbarSeparator"></div>

<button id="currentOutlineItem" class="toolbarButton" disabled="disabled" title="Find Current Outline Item" tabindex="6" data-l10n-id="current_outline_item">
<span data-l10n-id="current_outline_item_label">Current Outline Item</span>
</button>
</div>
</div>
</div>
<div id="sidebarContent">
<div id="thumbnailView">
</div>
<div id="outlineView" class="hidden">
</div>
<div id="attachmentsView" class="hidden">
</div>
<div id="layersView" class="hidden">
</div>
</div>
<div id="sidebarResizer"></div>
</div>  <!-- sidebarContainer -->

<div id="mainContainer">
<div class="findbar hidden doorHanger" id="findbar">
<div id="findbarInputContainer">
<input id="findInput" class="toolbarField" title="Find" placeholder="Find in document…" tabindex="91" data-l10n-id="find_input" aria-invalid="false">
<div class="splitToolbarButton">
<button id="findPrevious" class="toolbarButton" title="Find the previous occurrence of the phrase" tabindex="92" data-l10n-id="find_previous">
<span data-l10n-id="find_previous_label">Previous</span>
</button>
<div class="splitToolbarButtonSeparator"></div>
<button id="findNext" class="toolbarButton" title="Find the next occurrence of the phrase" tabindex="93" data-l10n-id="find_next">
<span data-l10n-id="find_next_label">Next</span>
</button>
</div>
</div>

<div id="findbarOptionsOneContainer">
<input type="checkbox" id="findHighlightAll" class="toolbarField" tabindex="94">
<label for="findHighlightAll" class="toolbarLabel" data-l10n-id="find_highlight">Highlight All</label>
<input type="checkbox" id="findMatchCase" class="toolbarField" tabindex="95">
<label for="findMatchCase" class="toolbarLabel" data-l10n-id="find_match_case_label">Match Case</label>
</div>
<div id="findbarOptionsTwoContainer">
<input type="checkbox" id="findMatchDiacritics" class="toolbarField" tabindex="96">
<label for="findMatchDiacritics" class="toolbarLabel" data-l10n-id="find_match_diacritics_label">Match Diacritics</label>
<input type="checkbox" id="findEntireWord" class="toolbarField" tabindex="97">
<label for="findEntireWord" class="toolbarLabel" data-l10n-id="find_entire_word_label">Whole Words</label>
</div>

<div id="findbarMessageContainer" aria-live="polite">
<span id="findResultsCount" class="toolbarLabel"></span>
<span id="findMsg" class="toolbarLabel"></span>
</div>
</div>  <!-- findbar -->

<div class="editorParamsToolbar hidden doorHangerRight" id="editorFreeTextParamsToolbar">
<div class="editorParamsToolbarContainer">
<div class="editorParamsSetter">
<label for="editorFreeTextColor" class="editorParamsLabel" data-l10n-id="editor_free_text_font_color">Font Color</label>
<input type="color" id="editorFreeTextColor" class="editorParamsColor" tabindex="100">
</div>
<div class="editorParamsSetter">
<label for="editorFreeTextFontSize" class="editorParamsLabel" data-l10n-id="editor_free_text_font_size">Font Size</label>
<input type="range" id="editorFreeTextFontSize" class="editorParamsSlider" value="10" min="5" max="100" step="1" tabindex="101">
</div>
</div>
</div>

<div class="editorParamsToolbar hidden doorHangerRight" id="editorInkParamsToolbar">
<div class="editorParamsToolbarContainer">
<div class="editorParamsSetter">
<label for="editorInkColor" class="editorParamsLabel" data-l10n-id="editor_ink_line_color">Line Color</label>
<input type="color" id="editorInkColor" class="editorParamsColor" tabindex="102">
</div>
<div class="editorParamsSetter">
<label for="editorInkThickness" class="editorParamsLabel" data-l10n-id="editor_ink_line_thickness">Line Thickness</label>
<input type="range" id="editorInkThickness" class="editorParamsSlider" value="1" min="1" max="20" step="1" tabindex="103">
</div>
</div>
</div>

<div id="secondaryToolbar" class="secondaryToolbar hidden doorHangerRight">
<div id="secondaryToolbarButtonContainer">
<button id="secondaryPresentationMode" class="secondaryToolbarButton visibleLargeView" title="Switch to Presentation Mode" tabindex="51" data-l10n-id="presentation_mode">
<span data-l10n-id="presentation_mode_label">Presentation Mode</span>
</button>

<button id="secondaryOpenFile" class="secondaryToolbarButton visibleLargeView" title="Open File" tabindex="52" data-l10n-id="open_file">
<span data-l10n-id="open_file_label">Open</span>
</button>

<button id="secondaryPrint" class="secondaryToolbarButton visibleMediumView" title="Print" tabindex="53" data-l10n-id="print">
<span data-l10n-id="print_label">Print</span>
</button>

<button id="secondaryDownload" class="secondaryToolbarButton visibleMediumView" title="Download" tabindex="54" data-l10n-id="download">
<span data-l10n-id="download_label">Download</span>
</button>

<a href="#" id="secondaryViewBookmark" class="secondaryToolbarButton visibleSmallView" title="Current view (copy or open in new window)" tabindex="55" data-l10n-id="bookmark">
<span data-l10n-id="bookmark_label">Current View</span>
</a>

<div class="horizontalToolbarSeparator visibleLargeView"></div>

<button id="firstPage" class="secondaryToolbarButton" title="Go to First Page" tabindex="56" data-l10n-id="first_page">
<span data-l10n-id="first_page_label">Go to First Page</span>
</button>
<button id="lastPage" class="secondaryToolbarButton" title="Go to Last Page" tabindex="57" data-l10n-id="last_page">
<span data-l10n-id="last_page_label">Go to Last Page</span>
</button>

<div class="horizontalToolbarSeparator"></div>

<button id="pageRotateCw" class="secondaryToolbarButton" title="Rotate Clockwise" tabindex="58" data-l10n-id="page_rotate_cw">
<span data-l10n-id="page_rotate_cw_label">Rotate Clockwise</span>
</button>
<button id="pageRotateCcw" class="secondaryToolbarButton" title="Rotate Counterclockwise" tabindex="59" data-l10n-id="page_rotate_ccw">
<span data-l10n-id="page_rotate_ccw_label">Rotate Counterclockwise</span>
</button>

<div class="horizontalToolbarSeparator"></div>

<div id="cursorToolButtons" role="radiogroup">
<button id="cursorSelectTool" class="secondaryToolbarButton toggled" title="Enable Text Selection Tool" tabindex="60" data-l10n-id="cursor_text_select_tool" role="radio" aria-checked="true">
<span data-l10n-id="cursor_text_select_tool_label">Text Selection Tool</span>
</button>
<button id="cursorHandTool" class="secondaryToolbarButton" title="Enable Hand Tool" tabindex="61" data-l10n-id="cursor_hand_tool" role="radio" aria-checked="false">
<span data-l10n-id="cursor_hand_tool_label">Hand Tool</span>
</button>
</div>

<div class="horizontalToolbarSeparator"></div>

<div id="scrollModeButtons" role="radiogroup">
<button id="scrollPage" class="secondaryToolbarButton" title="Use Page Scrolling" tabindex="62" data-l10n-id="scroll_page" role="radio" aria-checked="false">
<span data-l10n-id="scroll_page_label">Page Scrolling</span>
</button>
<button id="scrollVertical" class="secondaryToolbarButton toggled" title="Use Vertical Scrolling" tabindex="63" data-l10n-id="scroll_vertical" role="radio" aria-checked="true">
<span data-l10n-id="scroll_vertical_label" >Vertical Scrolling</span>
</button>
<button id="scrollHorizontal" class="secondaryToolbarButton" title="Use Horizontal Scrolling" tabindex="64" data-l10n-id="scroll_horizontal" role="radio" aria-checked="false">
<span data-l10n-id="scroll_horizontal_label">Horizontal Scrolling</span>
</button>
<button id="scrollWrapped" class="secondaryToolbarButton" title="Use Wrapped Scrolling" tabindex="65" data-l10n-id="scroll_wrapped" role="radio" aria-checked="false">
<span data-l10n-id="scroll_wrapped_label">Wrapped Scrolling</span>
</button>
</div>

<div class="horizontalToolbarSeparator"></div>

<div id="spreadModeButtons" role="radiogroup">
<button id="spreadNone" class="secondaryToolbarButton toggled" title="Do not join page spreads" tabindex="66" data-l10n-id="spread_none" role="radio" aria-checked="true">
<span data-l10n-id="spread_none_label">No Spreads</span>
</button>
<button id="spreadOdd" class="secondaryToolbarButton" title="Join page spreads starting with odd-numbered pages" tabindex="67" data-l10n-id="spread_odd" role="radio" aria-checked="false">
<span data-l10n-id="spread_odd_label">Odd Spreads</span>
</button>
<button id="spreadEven" class="secondaryToolbarButton" title="Join page spreads starting with even-numbered pages" tabindex="68" data-l10n-id="spread_even" role="radio" aria-checked="false">
<span data-l10n-id="spread_even_label">Even Spreads</span>
</button>
</div>

<div class="horizontalToolbarSeparator"></div>

<button id="documentProperties" class="secondaryToolbarButton" title="Document Properties…" tabindex="69" data-l10n-id="document_properties" aria-controls="documentPropertiesDialog">
<span data-l10n-id="document_properties_label">Document Properties…</span>
</button>
</div>
</div>  <!-- secondaryToolbar -->

<div class="toolbar">
<div id="toolbarContainer">
<div id="toolbarViewer">
<div id="toolbarViewerLeft">
<button id="sidebarToggle" class="toolbarButton" title="Toggle Sidebar" tabindex="11" data-l10n-id="toggle_sidebar" aria-expanded="false" aria-controls="sidebarContainer">
<span data-l10n-id="toggle_sidebar_label">Toggle Sidebar</span>
</button>
<div class="toolbarButtonSpacer"></div>
<button id="viewFind" class="toolbarButton" title="Find in Document" tabindex="12" data-l10n-id="findbar" aria-expanded="false" aria-controls="findbar">
<span data-l10n-id="findbar_label">Find</span>
</button>
<div class="splitToolbarButton hiddenSmallView">
<button class="toolbarButton" title="Previous Page" id="previous" tabindex="13" data-l10n-id="previous">
<span data-l10n-id="previous_label">Previous</span>
</button>
<div class="splitToolbarButtonSeparator"></div>
<button class="toolbarButton" title="Next Page" id="next" tabindex="14" data-l10n-id="next">
<span data-l10n-id="next_label">Next</span>
</button>
</div>
<input type="number" id="pageNumber" class="toolbarField" title="Page" value="1" size="4" min="1" tabindex="15" data-l10n-id="page" autocomplete="off">
<span id="numPages" class="toolbarLabel"></span>
</div>
<div id="toolbarViewerRight">
<button id="presentationMode" class="toolbarButton hiddenLargeView" title="Switch to Presentation Mode" tabindex="31" data-l10n-id="presentation_mode">
<span data-l10n-id="presentation_mode_label">Presentation Mode</span>
</button>

<button id="openFile" class="toolbarButton hiddenLargeView" title="Open File" tabindex="32" data-l10n-id="open_file">
<span data-l10n-id="open_file_label">Open</span>
</button>

<button id="print" class="toolbarButton hiddenMediumView" title="Print" tabindex="33" data-l10n-id="print">
<span data-l10n-id="print_label">Print</span>
</button>

<button id="download" class="toolbarButton hiddenMediumView" title="Download" tabindex="34" data-l10n-id="download">
<span data-l10n-id="download_label">Download</span>
</button>
<a href="#" id="viewBookmark" class="toolbarButton hiddenSmallView" title="Current view (copy or open in new window)" tabindex="35" data-l10n-id="bookmark">
<span data-l10n-id="bookmark_label">Current View</span>
</a>

<div class="verticalToolbarSeparator hiddenSmallView"></div>

<div id="editorModeButtons" class="splitToolbarButton toggled hidden" role="radiogroup">
<button id="editorNone" class="toolbarButton toggled" disabled="disabled" title="Disable Annotation Editing" role="radio" aria-checked="true" tabindex="36" data-l10n-id="editor_none">
<span data-l10n-id="editor_none_label">Disable Editing</span>
</button>
<button id="editorFreeText" class="toolbarButton" disabled="disabled" title="Add FreeText Annotation" role="radio" aria-checked="false" tabindex="37" data-l10n-id="editor_free_text">
<span data-l10n-id="editor_free_text_label">FreeText Annotation</span>
</button>
<button id="editorInk" class="toolbarButton" disabled="disabled" title="Add Ink Annotation" role="radio" aria-checked="false" tabindex="38" data-l10n-id="editor_ink">
<span data-l10n-id="editor_ink_label">Ink Annotation</span>
</button>
</div>

<!-- Should be visible when the "editorModeButtons" are visible. -->
<div id="editorModeSeparator" class="verticalToolbarSeparator hidden"></div>

<button id="secondaryToolbarToggle" class="toolbarButton" title="Tools" tabindex="48" data-l10n-id="tools" aria-expanded="false" aria-controls="secondaryToolbar">
<span data-l10n-id="tools_label">Tools</span>
</button>
</div>
<div id="toolbarViewerMiddle">
<div class="splitToolbarButton">
<button id="zoomOut" class="toolbarButton" title="Zoom Out" tabindex="21" data-l10n-id="zoom_out">
<span data-l10n-id="zoom_out_label">Zoom Out</span>
</button>
<div class="splitToolbarButtonSeparator"></div>
<button id="zoomIn" class="toolbarButton" title="Zoom In" tabindex="22" data-l10n-id="zoom_in">
<span data-l10n-id="zoom_in_label">Zoom In</span>
</button>
</div>
<span id="scaleSelectContainer" class="dropdownToolbarButton">
<select id="scaleSelect" title="Zoom" tabindex="23" data-l10n-id="zoom">
<option id="pageAutoOption" title="" value="auto" selected="selected" data-l10n-id="page_scale_auto">Automatic Zoom</option>
<option id="pageActualOption" title="" value="page-actual" data-l10n-id="page_scale_actual">Actual Size</option>
<option id="pageFitOption" title="" value="page-fit" data-l10n-id="page_scale_fit">Page Fit</option>
<option id="pageWidthOption" title="" value="page-width" data-l10n-id="page_scale_width">Page Width</option>
<option id="customScaleOption" title="" value="custom" disabled="disabled" hidden="true"></option>
<option title="" value="0.5" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 50 }'>50%</option>
<option title="" value="0.75" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 75 }'>75%</option>
<option title="" value="1" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 100 }'>100%</option>
<option title="" value="1.25" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 125 }'>125%</option>
<option title="" value="1.5" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 150 }'>150%</option>
<option title="" value="2" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 200 }'>200%</option>
<option title="" value="3" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 300 }'>300%</option>
<option title="" value="4" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 400 }'>400%</option>
</select>
</span>
</div>
</div>
<div id="loadingBar">
<div class="progress">
<div class="glimmer">
</div>
</div>
</div>
</div>
</div>

<div id="viewerContainer" tabindex="0">
<div id="viewer" class="pdfViewer"></div>
</div>

<div id="errorWrapper" hidden='true'>
<div id="errorMessageLeft">
<span id="errorMessage"></span>
<button id="errorShowMore" data-l10n-id="error_more_info">
More Information
</button>
<button id="errorShowLess" data-l10n-id="error_less_info" hidden='true'>
Less Information
</button>
</div>
<div id="errorMessageRight">
<button id="errorClose" data-l10n-id="error_close">
Close
</button>
</div>
<div id="errorSpacer"></div>
<textarea id="errorMoreInfo" hidden='true' readonly="readonly"></textarea>
</div>
</div> <!-- mainContainer -->

<div id="dialogContainer">
<dialog id="passwordDialog">
<div class="row">
<label for="password" id="passwordText" data-l10n-id="password_label">Enter the password to open this PDF file:</label>
</div>
<div class="row">
<input type="password" id="password" class="toolbarField">
</div>
<div class="buttonRow">
<button id="passwordCancel" class="dialogButton"><span data-l10n-id="password_cancel">Cancel</span></button>
<button id="passwordSubmit" class="dialogButton"><span data-l10n-id="password_ok">OK</span></button>
</div>
</dialog>
<dialog id="documentPropertiesDialog">
<div class="row">
<span id="fileNameLabel" data-l10n-id="document_properties_file_name">File name:</span>
<p id="fileNameField" aria-labelledby="fileNameLabel">-</p>
</div>
<div class="row">
<span id="fileSizeLabel" data-l10n-id="document_properties_file_size">File size:</span>
<p id="fileSizeField" aria-labelledby="fileSizeLabel">-</p>
</div>
<div class="separator"></div>
<div class="row">
<span id="titleLabel" data-l10n-id="document_properties_title">Title:</span>
<p id="titleField" aria-labelledby="titleLabel">-</p>
</div>
<div class="row">
<span id="authorLabel" data-l10n-id="document_properties_author">Author:</span>
<p id="authorField" aria-labelledby="authorLabel">-</p>
</div>
<div class="row">
<span id="subjectLabel" data-l10n-id="document_properties_subject">Subject:</span>
<p id="subjectField" aria-labelledby="subjectLabel">-</p>
</div>
<div class="row">
<span id="keywordsLabel" data-l10n-id="document_properties_keywords">Keywords:</span>
<p id="keywordsField" aria-labelledby="keywordsLabel">-</p>
</div>
<div class="row">
<span id="creationDateLabel" data-l10n-id="document_properties_creation_date">Creation Date:</span>
<p id="creationDateField" aria-labelledby="creationDateLabel">-</p>
</div>
<div class="row">
<span id="modificationDateLabel" data-l10n-id="document_properties_modification_date">Modification Date:</span>
<p id="modificationDateField" aria-labelledby="modificationDateLabel">-</p>
</div>
<div class="row">
<span id="creatorLabel" data-l10n-id="document_properties_creator">Creator:</span>
<p id="creatorField" aria-labelledby="creatorLabel">-</p>
</div>
<div class="separator"></div>
<div class="row">
<span id="producerLabel" data-l10n-id="document_properties_producer">PDF Producer:</span>
<p id="producerField" aria-labelledby="producerLabel">-</p>
</div>
<div class="row">
<span id="versionLabel" data-l10n-id="document_properties_version">PDF Version:</span>
<p id="versionField" aria-labelledby="versionLabel">-</p>
</div>
<div class="row">
<span id="pageCountLabel" data-l10n-id="document_properties_page_count">Page Count:</span>
<p id="pageCountField" aria-labelledby="pageCountLabel">-</p>
</div>
<div class="row">
<span id="pageSizeLabel" data-l10n-id="document_properties_page_size">Page Size:</span>
<p id="pageSizeField" aria-labelledby="pageSizeLabel">-</p>
</div>
<div class="separator"></div>
<div class="row">
<span id="linearizedLabel" data-l10n-id="document_properties_linearized">Fast Web View:</span>
<p id="linearizedField" aria-labelledby="linearizedLabel">-</p>
</div>
<div class="buttonRow">
<button id="documentPropertiesClose" class="dialogButton"><span data-l10n-id="document_properties_close">Close</span></button>
</div>
</dialog>
<dialog id="printServiceDialog" style="min-width: 200px;">
<div class="row">
<span data-l10n-id="print_progress_message">Preparing document for printing…</span>
</div>
<div class="row">
<progress value="0" max="100"></progress>
<span data-l10n-id="print_progress_percent" data-l10n-args='{ "progress": 0 }' class="relative-progress">0%</span>
</div>
<div class="buttonRow">
<button id="printCancel" class="dialogButton"><span data-l10n-id="print_progress_close">Cancel</span></button>
</div>
</dialog>
</div>  <!-- dialogContainer -->

</div> <!-- outerContainer -->
<div id="printContainer"></div>

<input type="file" id="fileInput" class="hidden">
`


const pdfAppCss = () => `
/* Copyright 2014 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

.textLayer {
		position: absolute;
		text-align: initial;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		overflow: hidden;
		opacity: 0.2;
		line-height: 1;
		-webkit-text-size-adjust: none;
    -moz-text-size-adjust: none;
    text-size-adjust: none;
		forced-color-adjust: none;
}

.textLayer span,
.textLayer br {
		color: transparent;
		position: absolute;
		white-space: pre;
		cursor: text;
		transform-origin: 0% 0%;
}

/* Only necessary in Google Chrome, see issue 14205, and most unfortunately
 * the problem doesn't show up in "text" reference tests. */
.textLayer span.markedContent {
		top: 0;
		height: 0;
}

.textLayer .highlight {
		margin: -1px;
		padding: 1px;
		background-color: rgba(180, 0, 170, 1);
		border-radius: 4px;
}

.textLayer .highlight.appended {
		position: initial;
}

.textLayer .highlight.begin {
		border-radius: 4px 0 0 4px;
}

.textLayer .highlight.end {
		border-radius: 0 4px 4px 0;
}

.textLayer .highlight.middle {
		border-radius: 0;
}

.textLayer .highlight.selected {
		background-color: rgba(0, 100, 0, 1);
}

.textLayer ::-moz-selection {
		background: rgba(0, 0, 255, 1);
}

.textLayer ::selection {
		background: rgba(0, 0, 255, 1);
}

/* Avoids https://github.com/mozilla/pdf.js/issues/13840 in Chrome */
.textLayer br::-moz-selection {
		background: transparent;
}
.textLayer br::selection {
		background: transparent;
}

.textLayer .endOfContent {
		display: block;
		position: absolute;
		left: 0;
		top: 100%;
		right: 0;
		bottom: 0;
		z-index: -1;
		cursor: default;
		-webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
}

.textLayer .endOfContent.active {
		top: 0;
}


:root {
		--annotation-unfocused-field-background: url("data:image/svg+xml;charset=UTF-8,<svg width='1px' height='1px' xmlns='http://www.w3.org/2000/svg'><rect width='100%' height='100%' style='fill:rgba(0, 54, 255, 0.13);'/></svg>");
}

@media (forced-colors: active) {
		.annotationLayer .textWidgetAnnotation input:required,
		.annotationLayer .textWidgetAnnotation textarea:required,
		.annotationLayer .choiceWidgetAnnotation select:required,
		.annotationLayer .buttonWidgetAnnotation.checkBox input:required,
		.annotationLayer .buttonWidgetAnnotation.radioButton input:required {
				outline: 1.5px solid selectedItem;
		}
}

.annotationLayer {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
		transform-origin: 0 0;
}

.annotationLayer section {
		position: absolute;
		text-align: initial;
		pointer-events: auto;
		box-sizing: border-box;
		transform-origin: 0 0;
}

.annotationLayer .linkAnnotation > a,
.annotationLayer .buttonWidgetAnnotation.pushButton > a {
		position: absolute;
		font-size: 1em;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
}

.annotationLayer .buttonWidgetAnnotation.pushButton > canvas {
		width: 100%;
		height: 100%;
}

.annotationLayer .linkAnnotation > a:hover,
.annotationLayer .buttonWidgetAnnotation.pushButton > a:hover {
		opacity: 0.2;
		background: rgba(255, 255, 0, 1);
		box-shadow: 0 2px 10px rgba(255, 255, 0, 1);
}

.annotationLayer .textAnnotation img {
		position: absolute;
		cursor: pointer;
		width: 100%;
		height: 100%;
}

.annotationLayer .textWidgetAnnotation input,
.annotationLayer .textWidgetAnnotation textarea,
.annotationLayer .choiceWidgetAnnotation select,
.annotationLayer .buttonWidgetAnnotation.checkBox input,
.annotationLayer .buttonWidgetAnnotation.radioButton input {
		background-image: var(--annotation-unfocused-field-background);
		border: 1px solid transparent;
		box-sizing: border-box;
		font: calc(9px * var(--scale-factor)) sans-serif;
		height: 100%;
		margin: 0;
		vertical-align: top;
		width: 100%;
}

.annotationLayer .textWidgetAnnotation input:required,
.annotationLayer .textWidgetAnnotation textarea:required,
.annotationLayer .choiceWidgetAnnotation select:required,
.annotationLayer .buttonWidgetAnnotation.checkBox input:required,
.annotationLayer .buttonWidgetAnnotation.radioButton input:required {
		outline: 1.5px solid red;
}

.annotationLayer .choiceWidgetAnnotation select option {
		padding: 0;
}

.annotationLayer .buttonWidgetAnnotation.radioButton input {
		border-radius: 50%;
}

.annotationLayer .textWidgetAnnotation textarea {
		resize: none;
}

.annotationLayer .textWidgetAnnotation input[disabled],
.annotationLayer .textWidgetAnnotation textarea[disabled],
.annotationLayer .choiceWidgetAnnotation select[disabled],
.annotationLayer .buttonWidgetAnnotation.checkBox input[disabled],
.annotationLayer .buttonWidgetAnnotation.radioButton input[disabled] {
		background: none;
		border: 1px solid transparent;
		cursor: not-allowed;
}

.annotationLayer .textWidgetAnnotation input:hover,
.annotationLayer .textWidgetAnnotation textarea:hover,
.annotationLayer .choiceWidgetAnnotation select:hover,
.annotationLayer .buttonWidgetAnnotation.checkBox input:hover,
.annotationLayer .buttonWidgetAnnotation.radioButton input:hover {
		border: 1px solid rgba(0, 0, 0, 1);
}

.annotationLayer .textWidgetAnnotation input:focus,
.annotationLayer .textWidgetAnnotation textarea:focus,
.annotationLayer .choiceWidgetAnnotation select:focus {
		background: none;
		border: 1px solid transparent;
}

.annotationLayer .textWidgetAnnotation input :focus,
.annotationLayer .textWidgetAnnotation textarea :focus,
.annotationLayer .choiceWidgetAnnotation select :focus,
.annotationLayer .buttonWidgetAnnotation.checkBox :focus,
.annotationLayer .buttonWidgetAnnotation.radioButton :focus {
		background-image: none;
		background-color: transparent;
		outline: auto;
}

.annotationLayer .buttonWidgetAnnotation.checkBox input:checked:before,
.annotationLayer .buttonWidgetAnnotation.checkBox input:checked:after,
.annotationLayer .buttonWidgetAnnotation.radioButton input:checked:before {
		background-color: CanvasText;
		content: "";
		display: block;
		position: absolute;
}

.annotationLayer .buttonWidgetAnnotation.checkBox input:checked:before,
.annotationLayer .buttonWidgetAnnotation.checkBox input:checked:after {
		height: 80%;
		left: 45%;
		width: 1px;
}

.annotationLayer .buttonWidgetAnnotation.checkBox input:checked:before {
		transform: rotate(45deg);
}

.annotationLayer .buttonWidgetAnnotation.checkBox input:checked:after {
		transform: rotate(-45deg);
}

.annotationLayer .buttonWidgetAnnotation.radioButton input:checked:before {
		border-radius: 50%;
		height: 50%;
		left: 30%;
		top: 20%;
		width: 50%;
}

.annotationLayer .textWidgetAnnotation input.comb {
		font-family: monospace;
		padding-left: 2px;
		padding-right: 0;
}

.annotationLayer .textWidgetAnnotation input.comb:focus {
		/*
		 * Letter spacing is placed on the right side of each character. Hence, the
		 * letter spacing of the last character may be placed outside the visible
		 * area, causing horizontal scrolling. We avoid this by extending the width
		 * when the element has focus and revert this when it loses focus.
		 */
		width: 103%;
}

.annotationLayer .buttonWidgetAnnotation.checkBox input,
.annotationLayer .buttonWidgetAnnotation.radioButton input {
		-webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
}

.annotationLayer .popupTriggerArea {
		height: 100%;
		width: 100%;
}

.annotationLayer .popupWrapper {
		position: absolute;
		font-size: calc(9px * var(--scale-factor));
		width: 100%;
		min-width: calc(180px * var(--scale-factor));
		pointer-events: none;
}

.annotationLayer .popup {
		position: absolute;
		z-index: 200;
		max-width: calc(180px * var(--scale-factor));
		background-color: rgba(255, 255, 153, 1);
		box-shadow: 0 calc(2px * var(--scale-factor)) calc(5px * var(--scale-factor))
								rgba(136, 136, 136, 1);
		border-radius: calc(2px * var(--scale-factor));
		padding: calc(6px * var(--scale-factor));
		margin-left: calc(5px * var(--scale-factor));
		cursor: pointer;
		font: message-box;
		white-space: normal;
		word-wrap: break-word;
		pointer-events: auto;
}

.annotationLayer .popup > * {
		font-size: calc(9px * var(--scale-factor));
}

.annotationLayer .popup h1 {
		display: inline-block;
}

.annotationLayer .popupDate {
		display: inline-block;
		margin-left: calc(5px * var(--scale-factor));
}

.annotationLayer .popupContent {
		border-top: 1px solid rgba(51, 51, 51, 1);
		margin-top: calc(2px * var(--scale-factor));
		padding-top: calc(2px * var(--scale-factor));
}

.annotationLayer .richText > * {
		white-space: pre-wrap;
		font-size: calc(9px * var(--scale-factor));
}

.annotationLayer .highlightAnnotation,
.annotationLayer .underlineAnnotation,
.annotationLayer .squigglyAnnotation,
.annotationLayer .strikeoutAnnotation,
.annotationLayer .freeTextAnnotation,
.annotationLayer .lineAnnotation svg line,
.annotationLayer .squareAnnotation svg rect,
.annotationLayer .circleAnnotation svg ellipse,
.annotationLayer .polylineAnnotation svg polyline,
.annotationLayer .polygonAnnotation svg polygon,
.annotationLayer .caretAnnotation,
.annotationLayer .inkAnnotation svg polyline,
.annotationLayer .stampAnnotation,
.annotationLayer .fileAttachmentAnnotation {
		cursor: pointer;
}

.annotationLayer section svg {
		position: absolute;
		width: 100%;
		height: 100%;
}

.annotationLayer .annotationTextContent {
		position: absolute;
		width: 100%;
		height: 100%;
		opacity: 0;
		color: transparent;
		-webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
		pointer-events: none;
}

.annotationLayer .annotationTextContent span {
		width: 100%;
		display: inline-block;
}


:root {
		--xfa-unfocused-field-background: url("data:image/svg+xml;charset=UTF-8,<svg width='1px' height='1px' xmlns='http://www.w3.org/2000/svg'><rect width='100%' height='100%' style='fill:rgba(0, 54, 255, 0.13);'/></svg>");
}

@media (forced-colors: active) {
		.xfaLayer *:required {
				outline: 1.5px solid selectedItem;
		}
}

.xfaLayer .highlight {
		margin: -1px;
		padding: 1px;
		background-color: rgba(239, 203, 237, 1);
		border-radius: 4px;
}

.xfaLayer .highlight.appended {
		position: initial;
}

.xfaLayer .highlight.begin {
		border-radius: 4px 0 0 4px;
}

.xfaLayer .highlight.end {
		border-radius: 0 4px 4px 0;
}

.xfaLayer .highlight.middle {
		border-radius: 0;
}

.xfaLayer .highlight.selected {
		background-color: rgba(203, 223, 203, 1);
}

.xfaLayer ::-moz-selection {
		background: rgba(0, 0, 255, 1);
}

.xfaLayer ::selection {
		background: rgba(0, 0, 255, 1);
}

.xfaPage {
		overflow: hidden;
		position: relative;
}

.xfaContentarea {
		position: absolute;
}

.xfaPrintOnly {
		display: none;
}

.xfaLayer {
		position: absolute;
		text-align: initial;
		top: 0;
		left: 0;
		transform-origin: 0 0;
		line-height: 1.2;
}

.xfaLayer * {
		color: inherit;
		font: inherit;
		font-style: inherit;
		font-weight: inherit;
		font-kerning: inherit;
		letter-spacing: -0.01px;
		text-align: inherit;
		text-decoration: inherit;
		box-sizing: border-box;
		background-color: transparent;
		padding: 0;
		margin: 0;
		pointer-events: auto;
		line-height: inherit;
}

.xfaLayer *:required {
		outline: 1.5px solid red;
}

.xfaLayer div {
		pointer-events: none;
}

.xfaLayer svg {
		pointer-events: none;
}

.xfaLayer svg * {
		pointer-events: none;
}

.xfaLayer a {
		color: blue;
}

.xfaRich li {
		margin-left: 3em;
}

.xfaFont {
		color: black;
		font-weight: normal;
		font-kerning: none;
		font-size: 10px;
		font-style: normal;
		letter-spacing: 0;
		text-decoration: none;
		vertical-align: 0;
}

.xfaCaption {
		overflow: hidden;
		flex: 0 0 auto;
}

.xfaCaptionForCheckButton {
		overflow: hidden;
		flex: 1 1 auto;
}

.xfaLabel {
		height: 100%;
		width: 100%;
}

.xfaLeft {
		display: flex;
		flex-direction: row;
		align-items: center;
}

.xfaRight {
		display: flex;
		flex-direction: row-reverse;
		align-items: center;
}

.xfaLeft > .xfaCaption,
.xfaLeft > .xfaCaptionForCheckButton,
.xfaRight > .xfaCaption,
.xfaRight > .xfaCaptionForCheckButton {
		max-height: 100%;
}

.xfaTop {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
}

.xfaBottom {
		display: flex;
		flex-direction: column-reverse;
		align-items: flex-start;
}

.xfaTop > .xfaCaption,
.xfaTop > .xfaCaptionForCheckButton,
.xfaBottom > .xfaCaption,
.xfaBottom > .xfaCaptionForCheckButton {
		width: 100%;
}

.xfaBorder {
		background-color: transparent;
		position: absolute;
		pointer-events: none;
}

.xfaWrapped {
		width: 100%;
		height: 100%;
}

.xfaTextfield:focus,
.xfaSelect:focus {
		background-image: none;
		background-color: transparent;
		outline: auto;
		outline-offset: -1px;
}

.xfaCheckbox:focus,
.xfaRadio:focus {
		outline: auto;
}

.xfaTextfield,
.xfaSelect {
		height: 100%;
		width: 100%;
		flex: 1 1 auto;
		border: none;
		resize: none;
		background-image: var(--xfa-unfocused-field-background);
}

.xfaTop > .xfaTextfield,
.xfaTop > .xfaSelect,
.xfaBottom > .xfaTextfield,
.xfaBottom > .xfaSelect {
		flex: 0 1 auto;
}

.xfaButton {
		cursor: pointer;
		width: 100%;
		height: 100%;
		border: none;
		text-align: center;
}

.xfaLink {
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
}

.xfaCheckbox,
.xfaRadio {
		width: 100%;
		height: 100%;
		flex: 0 0 auto;
		border: none;
}

.xfaRich {
		white-space: pre-wrap;
		width: 100%;
		height: 100%;
}

.xfaImage {
		-o-object-position: left top;
    object-position: left top;
		-o-object-fit: contain;
    object-fit: contain;
		width: 100%;
		height: 100%;
}

.xfaLrTb,
.xfaRlTb,
.xfaTb {
		display: flex;
		flex-direction: column;
		align-items: stretch;
}

.xfaLr {
		display: flex;
		flex-direction: row;
		align-items: stretch;
}

.xfaRl {
		display: flex;
		flex-direction: row-reverse;
		align-items: stretch;
}

.xfaTb > div {
		justify-content: left;
}

.xfaPosition {
		position: relative;
}

.xfaArea {
		position: relative;
}

.xfaValignMiddle {
		display: flex;
		align-items: center;
}

.xfaTable {
		display: flex;
		flex-direction: column;
		align-items: stretch;
}

.xfaTable .xfaRow {
		display: flex;
		flex-direction: row;
		align-items: stretch;
}

.xfaTable .xfaRlRow {
		display: flex;
		flex-direction: row-reverse;
		align-items: stretch;
		flex: 1;
}

.xfaTable .xfaRlRow > div {
		flex: 1;
}

.xfaNonInteractive input,
.xfaNonInteractive textarea,
.xfaDisabled input,
.xfaDisabled textarea,
.xfaReadOnly input,
.xfaReadOnly textarea {
		background: initial;
}

@media print {
		.xfaTextfield,
		.xfaSelect {
				background: transparent;
		}

		.xfaSelect {
				-webkit-appearance: none;
				-moz-appearance: none;
        appearance: none;
				text-indent: 1px;
				text-overflow: "";
		}
}


:root {
		--focus-outline: solid 2px red;
		--hover-outline: dashed 2px blue;
		--freetext-line-height: 1.35;
		--freetext-padding: 2px;
		--editorInk-editing-cursor: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-editorInk.svg) 0 16;
}

@media (forced-colors: active) {
		:root {
				--focus-outline: solid 3px ButtonText;
				--hover-outline: dashed 3px ButtonText;
		}
}

[data-editor-rotation="90"] {
		transform: rotate(90deg);
}
[data-editor-rotation="180"] {
		transform: rotate(180deg);
}
[data-editor-rotation="270"] {
		transform: rotate(270deg);
}

.annotationEditorLayer {
		background: transparent;
		position: absolute;
		top: 0;
		left: 0;
		font-size: calc(100px * var(--scale-factor));
		transform-origin: 0 0;
}

.annotationEditorLayer .selectedEditor {
		outline: var(--focus-outline);
		resize: none;
}

.annotationEditorLayer .freeTextEditor {
		position: absolute;
		background: transparent;
		border-radius: 3px;
		padding: calc(var(--freetext-padding) * var(--scale-factor));
		resize: none;
		width: auto;
		height: auto;
		z-index: 1;
		transform-origin: 0 0;
		touch-action: none;
}

.annotationEditorLayer .freeTextEditor .internal {
		background: transparent;
		border: none;
		top: 0;
		left: 0;
		overflow: visible;
		white-space: nowrap;
		resize: none;
		font: 10px sans-serif;
		line-height: var(--freetext-line-height);
}

.annotationEditorLayer .freeTextEditor .overlay {
		position: absolute;
		display: none;
		background: transparent;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
}

.annotationEditorLayer .freeTextEditor .overlay.enabled {
		display: block;
}

.annotationEditorLayer .freeTextEditor .internal:empty::before {
		content: attr(default-content);
		color: gray;
}

.annotationEditorLayer .freeTextEditor .internal:focus {
		outline: none;
}

.annotationEditorLayer .inkEditor.disabled {
		resize: none;
}

.annotationEditorLayer .inkEditor.disabled.selectedEditor {
		resize: horizontal;
}

.annotationEditorLayer .freeTextEditor:hover:not(.selectedEditor),
.annotationEditorLayer .inkEditor:hover:not(.selectedEditor) {
		outline: var(--hover-outline);
}

.annotationEditorLayer .inkEditor {
		position: absolute;
		background: transparent;
		border-radius: 3px;
		overflow: auto;
		width: 100%;
		height: 100%;
		z-index: 1;
		transform-origin: 0 0;
		cursor: auto;
}

.annotationEditorLayer .inkEditor.editing {
		resize: none;
		cursor: var(--editorInk-editing-cursor), pointer;
}

.annotationEditorLayer .inkEditor .inkEditorCanvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		touch-action: none;
}

:root {
		--viewer-container-height: 0;
		--pdfViewer-padding-bottom: 0;
		--page-margin: 1px auto -8px;
		--page-border: 9px solid transparent;
		--page-border-image: url(https://mozilla.github.io/pdf.js/web/images/shadow.png) 9 9 repeat;
		--spreadHorizontalWrapped-margin-LR: -3.5px;
		--scale-factor: 1;
}

@media screen and (forced-colors: active) {
		:root {
				--pdfViewer-padding-bottom: 9px;
				--page-margin: 8px auto -1px;
				--page-border: 1px solid CanvasText;
				--page-border-image: none;
				--spreadHorizontalWrapped-margin-LR: 3.5px;
		}
}

[data-main-rotation="90"] {
		transform: rotate(90deg) translateY(-100%);
}
[data-main-rotation="180"] {
		transform: rotate(180deg) translate(-100%, -100%);
}
[data-main-rotation="270"] {
		transform: rotate(270deg) translateX(-100%);
}

.pdfViewer {
		padding-bottom: var(--pdfViewer-padding-bottom);
}

.pdfViewer .canvasWrapper {
		overflow: hidden;
}

.pdfViewer .page {
		direction: ltr;
		width: 816px;
		height: 1056px;
		margin: var(--page-margin);
		position: relative;
		overflow: visible;
		border: var(--page-border);
		-o-border-image: var(--page-border-image);
    border-image: var(--page-border-image);
		background-clip: content-box;
		background-color: rgba(255, 255, 255, 1);
}

.pdfViewer .dummyPage {
		position: relative;
		width: 0;
		height: var(--viewer-container-height);
}

.pdfViewer.removePageBorders .page {
		margin: 0 auto 10px;
		border: none;
}

.pdfViewer.singlePageView {
		display: inline-block;
}

.pdfViewer.singlePageView .page {
		margin: 0;
		border: none;
}

.pdfViewer.scrollHorizontal,
.pdfViewer.scrollWrapped,
.spread {
		margin-left: 3.5px;
		margin-right: 3.5px;
		text-align: center;
}

.pdfViewer.scrollHorizontal,
.spread {
		white-space: nowrap;
}

.pdfViewer.removePageBorders,
.pdfViewer.scrollHorizontal .spread,
.pdfViewer.scrollWrapped .spread {
		margin-left: 0;
		margin-right: 0;
}

.spread .page,
.spread .dummyPage,
.pdfViewer.scrollHorizontal .page,
.pdfViewer.scrollWrapped .page,
.pdfViewer.scrollHorizontal .spread,
.pdfViewer.scrollWrapped .spread {
		display: inline-block;
		vertical-align: middle;
}

.spread .page,
.pdfViewer.scrollHorizontal .page,
.pdfViewer.scrollWrapped .page {
		margin-left: var(--spreadHorizontalWrapped-margin-LR);
		margin-right: var(--spreadHorizontalWrapped-margin-LR);
}

.pdfViewer.removePageBorders .spread .page,
.pdfViewer.removePageBorders.scrollHorizontal .page,
.pdfViewer.removePageBorders.scrollWrapped .page {
		margin-left: 5px;
		margin-right: 5px;
}

.pdfViewer .page canvas {
		margin: 0;
		display: block;
}

.pdfViewer .page canvas[hidden] {
		display: none;
}

.pdfViewer .page .loadingIcon {
		position: absolute;
		display: block;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		background: url("https://mozilla.github.io/pdf.js/web/images/loading-icon.gif") center no-repeat;
}
.pdfViewer .page .loadingIcon.notVisible {
		background: none;
}

.pdfViewer.enablePermissions .textLayer span {
		-webkit-user-select: none !important;
    -moz-user-select: none !important;
    user-select: none !important;
		cursor: not-allowed;
}

.pdfPresentationMode .pdfViewer {
		padding-bottom: 0;
}

.pdfPresentationMode .spread {
		margin: 0;
}

.pdfPresentationMode .pdfViewer .page {
		margin: 0 auto;
		border: 2px solid transparent;
}

:root {
		--dir-factor: 1;
		--sidebar-width: 200px;
		--sidebar-transition-duration: 200ms;
		--sidebar-transition-timing-function: ease;
		--scale-select-container-width: 140px;
		--scale-select-overflow: 22px;

		--toolbar-icon-opacity: 0.7;
		--doorhanger-icon-opacity: 0.9;

		--main-color: rgba(12, 12, 13, 1);
		--body-bg-color: rgba(237, 237, 240, 1);
		--errorWrapper-bg-color: rgba(255, 110, 110, 1);
		--progressBar-percent: 0%;
		--progressBar-end-offset: 0;
		--progressBar-color: rgba(10, 132, 255, 1);
		--progressBar-indeterminate-bg-color: rgba(221, 221, 222, 1);
		--progressBar-indeterminate-blend-color: rgba(116, 177, 239, 1);
		--scrollbar-color: auto;
		--scrollbar-bg-color: auto;
		--toolbar-icon-bg-color: rgba(0, 0, 0, 1);
		--toolbar-icon-hover-bg-color: rgba(0, 0, 0, 1);

		--sidebar-narrow-bg-color: rgba(237, 237, 240, 0.9);
		--sidebar-toolbar-bg-color: rgba(245, 246, 247, 1);
		--toolbar-bg-color: rgba(249, 249, 250, 1);
		--toolbar-border-color: rgba(204, 204, 204, 1);
		--button-hover-color: rgba(221, 222, 223, 1);
		--toggled-btn-color: rgba(0, 0, 0, 1);
		--toggled-btn-bg-color: rgba(0, 0, 0, 0.3);
		--toggled-hover-active-btn-color: rgba(0, 0, 0, 0.4);
		--dropdown-btn-bg-color: rgba(215, 215, 219, 1);
		--separator-color: rgba(0, 0, 0, 0.3);
		--field-color: rgba(6, 6, 6, 1);
		--field-bg-color: rgba(255, 255, 255, 1);
		--field-border-color: rgba(187, 187, 188, 1);
		--treeitem-color: rgba(0, 0, 0, 0.8);
		--treeitem-hover-color: rgba(0, 0, 0, 0.9);
		--treeitem-selected-color: rgba(0, 0, 0, 0.9);
		--treeitem-selected-bg-color: rgba(0, 0, 0, 0.25);
		--sidebaritem-bg-color: rgba(0, 0, 0, 0.15);
		--doorhanger-bg-color: rgba(255, 255, 255, 1);
		--doorhanger-border-color: rgba(12, 12, 13, 0.2);
		--doorhanger-hover-color: rgba(12, 12, 13, 1);
		--doorhanger-hover-bg-color: rgba(237, 237, 237, 1);
		--doorhanger-separator-color: rgba(222, 222, 222, 1);
		--dialog-button-border: 0 none;
		--dialog-button-bg-color: rgba(12, 12, 13, 0.1);
		--dialog-button-hover-bg-color: rgba(12, 12, 13, 0.3);

		--loading-icon: url(https://mozilla.github.io/pdf.js/web/images/loading.svg);
		--treeitem-expanded-icon: url(https://mozilla.github.io/pdf.js/web/images/treeitem-expanded.svg);
		--treeitem-collapsed-icon: url(https://mozilla.github.io/pdf.js/web/images/treeitem-collapsed.svg);
		--toolbarButton-editorNone-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-editorNone.svg);
		--toolbarButton-editorFreeText-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-editorFreeText.svg);
		--toolbarButton-editorInk-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-editorInk.svg);
		--toolbarButton-menuArrow-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-menuArrow.svg);
		--toolbarButton-sidebarToggle-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-sidebarToggle.svg);
		--toolbarButton-secondaryToolbarToggle-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-secondaryToolbarToggle.svg);
		--toolbarButton-pageUp-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-pageUp.svg);
		--toolbarButton-pageDown-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-pageDown.svg);
		--toolbarButton-zoomOut-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-zoomOut.svg);
		--toolbarButton-zoomIn-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-zoomIn.svg);
		--toolbarButton-presentationMode-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-presentationMode.svg);
		--toolbarButton-print-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-print.svg);
		--toolbarButton-openFile-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-openFile.svg);
		--toolbarButton-download-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-download.svg);
		--toolbarButton-bookmark-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-bookmark.svg);
		--toolbarButton-viewThumbnail-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-viewThumbnail.svg);
		--toolbarButton-viewOutline-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-viewOutline.svg);
		--toolbarButton-viewAttachments-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-viewAttachments.svg);
		--toolbarButton-viewLayers-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-viewLayers.svg);
		--toolbarButton-currentOutlineItem-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-currentOutlineItem.svg);
		--toolbarButton-search-icon: url(https://mozilla.github.io/pdf.js/web/images/toolbarButton-search.svg);
		--findbarButton-previous-icon: url(https://mozilla.github.io/pdf.js/web/images/findbarButton-previous.svg);
		--findbarButton-next-icon: url(https://mozilla.github.io/pdf.js/web/images/findbarButton-next.svg);
		--secondaryToolbarButton-firstPage-icon: url(https://mozilla.github.io/pdf.js/web/images/secondaryToolbarButton-firstPage.svg);
		--secondaryToolbarButton-lastPage-icon: url(https://mozilla.github.io/pdf.js/web/images/secondaryToolbarButton-lastPage.svg);
		--secondaryToolbarButton-rotateCcw-icon: url(https://mozilla.github.io/pdf.js/web/images/secondaryToolbarButton-rotateCcw.svg);
		--secondaryToolbarButton-rotateCw-icon: url(https://mozilla.github.io/pdf.js/web/images/secondaryToolbarButton-rotateCw.svg);
		--secondaryToolbarButton-selectTool-icon: url(https://mozilla.github.io/pdf.js/web/images/secondaryToolbarButton-selectTool.svg);
		--secondaryToolbarButton-handTool-icon: url(https://mozilla.github.io/pdf.js/web/images/secondaryToolbarButton-handTool.svg);
		--secondaryToolbarButton-scrollPage-icon: url(https://mozilla.github.io/pdf.js/web/images/secondaryToolbarButton-scrollPage.svg);
		--secondaryToolbarButton-scrollVertical-icon: url(https://mozilla.github.io/pdf.js/web/images/secondaryToolbarButton-scrollVertical.svg);
		--secondaryToolbarButton-scrollHorizontal-icon: url(https://mozilla.github.io/pdf.js/web/images/secondaryToolbarButton-scrollHorizontal.svg);
		--secondaryToolbarButton-scrollWrapped-icon: url(https://mozilla.github.io/pdf.js/web/images/secondaryToolbarButton-scrollWrapped.svg);
		--secondaryToolbarButton-spreadNone-icon: url(https://mozilla.github.io/pdf.js/web/images/secondaryToolbarButton-spreadNone.svg);
		--secondaryToolbarButton-spreadOdd-icon: url(https://mozilla.github.io/pdf.js/web/images/secondaryToolbarButton-spreadOdd.svg);
		--secondaryToolbarButton-spreadEven-icon: url(https://mozilla.github.io/pdf.js/web/images/secondaryToolbarButton-spreadEven.svg);
		--secondaryToolbarButton-documentProperties-icon: url(https://mozilla.github.io/pdf.js/web/images/secondaryToolbarButton-documentProperties.svg);
}

[dir="rtl"]:root {
		--dir-factor: -1;
}

@media (prefers-color-scheme: dark) {
		:root {
				--main-color: rgba(249, 249, 250, 1);
				--body-bg-color: rgba(42, 42, 46, 1);
				--errorWrapper-bg-color: rgba(169, 14, 14, 1);
				--progressBar-color: rgba(0, 96, 223, 1);
				--progressBar-indeterminate-bg-color: rgba(40, 40, 43, 1);
				--progressBar-indeterminate-blend-color: rgba(20, 68, 133, 1);
				--scrollbar-color: rgba(121, 121, 123, 1);
				--scrollbar-bg-color: rgba(35, 35, 39, 1);
				--toolbar-icon-bg-color: rgba(255, 255, 255, 1);
				--toolbar-icon-hover-bg-color: rgba(255, 255, 255, 1);

				--sidebar-narrow-bg-color: rgba(42, 42, 46, 0.9);
				--sidebar-toolbar-bg-color: rgba(50, 50, 52, 1);
				--toolbar-bg-color: rgba(56, 56, 61, 1);
				--toolbar-border-color: rgba(12, 12, 13, 1);
				--button-hover-color: rgba(102, 102, 103, 1);
				--toggled-btn-color: rgba(255, 255, 255, 1);
				--toggled-btn-bg-color: rgba(0, 0, 0, 0.3);
				--toggled-hover-active-btn-color: rgba(0, 0, 0, 0.4);
				--dropdown-btn-bg-color: rgba(74, 74, 79, 1);
				--separator-color: rgba(0, 0, 0, 0.3);
				--field-color: rgba(250, 250, 250, 1);
				--field-bg-color: rgba(64, 64, 68, 1);
				--field-border-color: rgba(115, 115, 115, 1);
				--treeitem-color: rgba(255, 255, 255, 0.8);
				--treeitem-hover-color: rgba(255, 255, 255, 0.9);
				--treeitem-selected-color: rgba(255, 255, 255, 0.9);
				--treeitem-selected-bg-color: rgba(255, 255, 255, 0.25);
				--sidebaritem-bg-color: rgba(255, 255, 255, 0.15);
				--doorhanger-bg-color: rgba(74, 74, 79, 1);
				--doorhanger-border-color: rgba(39, 39, 43, 1);
				--doorhanger-hover-color: rgba(249, 249, 250, 1);
				--doorhanger-hover-bg-color: rgba(93, 94, 98, 1);
				--doorhanger-separator-color: rgba(92, 92, 97, 1);
				--dialog-button-bg-color: rgba(92, 92, 97, 1);
				--dialog-button-hover-bg-color: rgba(115, 115, 115, 1);

				/* This image is used in <input> elements, which unfortunately means that
				 * the  approach used with all of the other images doesn't work
				 * here; hence why we still have two versions of this particular image. */
				--loading-icon: url(https://mozilla.github.io/pdf.js/web/images/loading-dark.svg);
		}
}

@media screen and (forced-colors: active) {
		:root {
				--button-hover-color: Highlight;
				--doorhanger-hover-bg-color: Highlight;
				--toolbar-icon-opacity: 1;
				--toolbar-icon-bg-color: ButtonText;
				--toolbar-icon-hover-bg-color: ButtonFace;
				--toggled-btn-color: HighlightText;
				--toggled-btn-bg-color: LinkText;
				--doorhanger-hover-color: ButtonFace;
				--doorhanger-border-color-whcm: 1px solid ButtonText;
				--doorhanger-triangle-opacity-whcm: 0;
				--dialog-button-border: 1px solid Highlight;
				--dialog-button-hover-bg-color: Highlight;
				--dialog-button-hover-color: ButtonFace;
				--field-border-color: ButtonText;
		}
}

* {
		padding: 0;
		margin: 0;
}

html,
body {
		height: 100%;
		width: 100%;
}

body {
		background-color: var(--body-bg-color);
}

body,
input,
button,
select {
		font: message-box;
		outline: none;
		scrollbar-color: var(--scrollbar-color) var(--scrollbar-bg-color);
}

.hidden,
[hidden] {
		display: none !important;
}

#viewerContainer.pdfPresentationMode:-webkit-full-screen {
		top: 0;
		background-color: rgba(0, 0, 0, 1);
		width: 100%;
		height: 100%;
		overflow: hidden;
		cursor: none;
		-webkit-user-select: none;
    user-select: none;
}

#viewerContainer.pdfPresentationMode:fullscreen {
		top: 0;
		background-color: rgba(0, 0, 0, 1);
		width: 100%;
		height: 100%;
		overflow: hidden;
		cursor: none;
		-webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
}

.pdfPresentationMode:-webkit-full-screen a:not(.internalLink) {
		display: none;
}

.pdfPresentationMode:fullscreen a:not(.internalLink) {
		display: none;
}

.pdfPresentationMode:-webkit-full-screen .textLayer span {
		cursor: none;
}

.pdfPresentationMode:fullscreen .textLayer span {
		cursor: none;
}

.pdfPresentationMode.pdfPresentationModeControls > *,
.pdfPresentationMode.pdfPresentationModeControls .textLayer span {
		cursor: default;
}

#outerContainer {
		width: 100%;
		height: 100%;
		position: relative;
}

[dir="ltr"] #sidebarContainer {
		left: calc(-1 * var(--sidebar-width));
}

[dir="rtl"] #sidebarContainer {
		right: calc(-1 * var(--sidebar-width));
}

[dir="ltr"] #sidebarContainer {
		border-right: var(--doorhanger-border-color-whcm);
}

[dir="rtl"] #sidebarContainer {
		border-left: var(--doorhanger-border-color-whcm);
}

[dir="ltr"] #sidebarContainer {
		transition-property: left;
}

[dir="rtl"] #sidebarContainer {
		transition-property: right;
}

#sidebarContainer {
		position: absolute;
		top: 32px;
		bottom: 0;
		inset-inline-start: calc(-1 * var(--sidebar-width));
		width: var(--sidebar-width);
		visibility: hidden;
		z-index: 100;
		border-top: 1px solid rgba(51, 51, 51, 1);
		-webkit-border-end: var(--doorhanger-border-color-whcm);
    border-inline-end: var(--doorhanger-border-color-whcm);
		transition-property: inset-inline-start;
		transition-duration: var(--sidebar-transition-duration);
		transition-timing-function: var(--sidebar-transition-timing-function);
}

#outerContainer.sidebarMoving #sidebarContainer,
#outerContainer.sidebarOpen #sidebarContainer {
		visibility: visible;
}
[dir="ltr"] #outerContainer.sidebarOpen #sidebarContainer {
		left: 0;
}
[dir="rtl"] #outerContainer.sidebarOpen #sidebarContainer {
		right: 0;
}
#outerContainer.sidebarOpen #sidebarContainer {
		inset-inline-start: 0;
}

#mainContainer {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		min-width: 350px;
}

[dir="ltr"] #sidebarContent {
		left: 0;
}

[dir="rtl"] #sidebarContent {
		right: 0;
}

#sidebarContent {
		top: 32px;
		bottom: 0;
		inset-inline-start: 0;
		overflow: auto;
		position: absolute;
		width: 100%;
		background-color: rgba(0, 0, 0, 0.1);
		box-shadow: inset calc(-1px * var(--dir-factor)) 0 0 rgba(0, 0, 0, 0.25);
}

#viewerContainer {
		overflow: auto;
		position: absolute;
		top: 32px;
		right: 0;
		bottom: 0;
		left: 0;
		outline: none;
}
#viewerContainer:not(.pdfPresentationMode) {
		transition-duration: var(--sidebar-transition-duration);
		transition-timing-function: var(--sidebar-transition-timing-function);
}

[dir="ltr"] #outerContainer.sidebarOpen #viewerContainer:not(.pdfPresentationMode) {
		left: var(--sidebar-width);
}

[dir="rtl"] #outerContainer.sidebarOpen #viewerContainer:not(.pdfPresentationMode) {
		right: var(--sidebar-width);
}

[dir="ltr"] #outerContainer.sidebarOpen #viewerContainer:not(.pdfPresentationMode) {
		transition-property: left;
}

[dir="rtl"] #outerContainer.sidebarOpen #viewerContainer:not(.pdfPresentationMode) {
		transition-property: right;
}

#outerContainer.sidebarOpen #viewerContainer:not(.pdfPresentationMode) {
		inset-inline-start: var(--sidebar-width);
		transition-property: inset-inline-start;
}

.toolbar {
		position: relative;
		left: 0;
		right: 0;
		z-index: 9999;
		cursor: default;
}

#toolbarContainer {
		width: 100%;
}

#toolbarSidebar {
		width: 100%;
		height: 32px;
		background-color: var(--sidebar-toolbar-bg-color);
		box-shadow: inset calc(-1px * var(--dir-factor)) 0 0 rgba(0, 0, 0, 0.25),
								0 1px 0 rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1);
}

[dir="ltr"] #sidebarResizer {
		right: -6px;
}

[dir="rtl"] #sidebarResizer {
		left: -6px;
}

#sidebarResizer {
		position: absolute;
		top: 0;
		bottom: 0;
		inset-inline-end: -6px;
		width: 6px;
		z-index: 200;
		cursor: ew-resize;
}

#toolbarContainer,
.findbar,
.secondaryToolbar,
.editorParamsToolbar {
		position: relative;
		height: 32px;
		background-color: var(--toolbar-bg-color);
		box-shadow: 0 1px 0 var(--toolbar-border-color);
}

#toolbarViewer {
		height: 32px;
}

[dir="ltr"] #loadingBar {
		left: 0;
		right: var(--progressBar-end-offset);
}

[dir="rtl"] #loadingBar {
		right: 0;
		left: var(--progressBar-end-offset);
}

[dir="ltr"] #loadingBar {
		transition-property: left;
}

[dir="rtl"] #loadingBar {
		transition-property: right;
}

#loadingBar {
		position: absolute;
		inset-inline: 0 var(--progressBar-end-offset);
		height: 4px;
		background-color: var(--body-bg-color);
		border-bottom: 1px solid var(--toolbar-border-color);
		transition-property: inset-inline-start;
		transition-duration: var(--sidebar-transition-duration);
		transition-timing-function: var(--sidebar-transition-timing-function);
}

[dir="ltr"] #outerContainer.sidebarOpen #loadingBar {
		left: var(--sidebar-width);
}

[dir="rtl"] #outerContainer.sidebarOpen #loadingBar {
		right: var(--sidebar-width);
}

#outerContainer.sidebarOpen #loadingBar {
		inset-inline-start: var(--sidebar-width);
}

#loadingBar .progress {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		transform: scaleX(var(--progressBar-percent));
		transform-origin: 0 0;
		height: 100%;
		background-color: var(--progressBar-color);
		overflow: hidden;
		transition: transform 200ms;
}

@-webkit-keyframes progressIndeterminate {
		0% {
				transform: translateX(-142px);
		}
		100% {
				transform: translateX(0);
		}
}

@keyframes progressIndeterminate {
		0% {
				transform: translateX(-142px);
		}
		100% {
				transform: translateX(0);
		}
}

#loadingBar.indeterminate .progress {
		transform: none;
		background-color: var(--progressBar-indeterminate-bg-color);
		transition: none;
}

#loadingBar.indeterminate .progress .glimmer {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: calc(100% + 150px);
		background: repeating-linear-gradient(
				135deg,
				var(--progressBar-indeterminate-blend-color) 0,
				var(--progressBar-indeterminate-bg-color) 5px,
				var(--progressBar-indeterminate-bg-color) 45px,
				var(--progressBar-color) 55px,
				var(--progressBar-color) 95px,
				var(--progressBar-indeterminate-blend-color) 100px
		);
		-webkit-animation: progressIndeterminate 1s linear infinite;
    animation: progressIndeterminate 1s linear infinite;
}

#outerContainer.sidebarResizing #sidebarContainer,
#outerContainer.sidebarResizing #viewerContainer,
#outerContainer.sidebarResizing #loadingBar {
		/* Improve responsiveness and avoid visual glitches when the sidebar is resized. */
		transition-duration: 0s;
}

.findbar,
.secondaryToolbar,
.editorParamsToolbar {
		top: 32px;
		position: absolute;
		z-index: 10000;
		height: auto;
		padding: 0 4px;
		margin: 4px 2px;
		font-size: 12px;
		line-height: 14px;
		text-align: left;
		cursor: default;
}

[dir="ltr"] .findbar {
		left: 64px;
}

[dir="rtl"] .findbar {
		right: 64px;
}

.findbar {
		inset-inline-start: 64px;
		min-width: 300px;
		background-color: var(--toolbar-bg-color);
}
.findbar > div {
		height: 32px;
}
[dir="ltr"] .findbar > div#findbarInputContainer {
		margin-right: 4px;
}
[dir="rtl"] .findbar > div#findbarInputContainer {
		margin-left: 4px;
}
.findbar > div#findbarInputContainer {
		-webkit-margin-end: 4px;
    margin-inline-end: 4px;
}
.findbar.wrapContainers > div,
.findbar.wrapContainers > div#findbarMessageContainer > * {
		clear: both;
}
.findbar.wrapContainers > div#findbarMessageContainer {
		height: auto;
}

.findbar input[type="checkbox"] {
		pointer-events: none;
}

.findbar label {
		-webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
}

.findbar label:hover,
.findbar input:focus-visible + label {
		color: var(--toggled-btn-color);
		background-color: var(--button-hover-color);
}

.findbar .toolbarField[type="checkbox"]:checked + .toolbarLabel {
		background-color: var(--toggled-btn-bg-color) !important;
		color: var(--toggled-btn-color);
}

#findInput {
		width: 200px;
}
#findInput::-moz-placeholder {
		font-style: normal;
}
#findInput::placeholder {
		font-style: normal;
}
#findInput[data-status="pending"] {
		background-image: var(--loading-icon);
		background-repeat: no-repeat;
		background-position: calc(50% + 48% * var(--dir-factor));
}
#findInput[data-status="notFound"] {
		background-color: rgba(255, 102, 102, 1);
}

[dir="ltr"] .secondaryToolbar,[dir="ltr"] 
																	.editorParamsToolbar {
		right: 4px;
}

[dir="rtl"] .secondaryToolbar,[dir="rtl"] 
																	.editorParamsToolbar {
		left: 4px;
}

.secondaryToolbar,
.editorParamsToolbar {
		padding: 6px 0 10px;
		inset-inline-end: 4px;
		height: auto;
		z-index: 30000;
		background-color: var(--doorhanger-bg-color);
}

.editorParamsToolbarContainer {
		width: 220px;
		margin-bottom: -4px;
}

.editorParamsToolbarContainer > .editorParamsSetter {
		min-height: 26px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-left: 10px;
		padding-right: 10px;
		padding-inline: 10px;
}

[dir="ltr"] .editorParamsToolbarContainer .editorParamsLabel {
		padding-right: 10px;
}

[dir="rtl"] .editorParamsToolbarContainer .editorParamsLabel {
		padding-left: 10px;
}

.editorParamsToolbarContainer .editorParamsLabel {
		-webkit-padding-end: 10px;
    padding-inline-end: 10px;
		flex: none;
		color: var(--main-color);
}

.editorParamsToolbarContainer .editorParamsColor {
		width: 32px;
		height: 32px;
		flex: none;
}

.editorParamsToolbarContainer .editorParamsSlider {
		background-color: transparent;
		width: 90px;
		flex: 0 1 0;
}

.editorParamsToolbarContainer .editorParamsSlider::-moz-range-progress {
		background-color: black;
}

.editorParamsToolbarContainer .editorParamsSlider::-webkit-slider-runnable-track,
.editorParamsToolbarContainer .editorParamsSlider::-moz-range-track {
		background-color: black;
}

.editorParamsToolbarContainer .editorParamsSlider::-webkit-slider-thumb,
.editorParamsToolbarContainer .editorParamsSlider::-moz-range-thumb {
		background-color: white;
}

#secondaryToolbarButtonContainer {
		max-width: 220px;
		min-height: 26px;
		max-height: calc(var(--viewer-container-height) - 40px);
		overflow-y: auto;
		margin-bottom: -4px;
}

[dir="ltr"] #editorInkParamsToolbar {
		right: 40px;
}

[dir="rtl"] #editorInkParamsToolbar {
		left: 40px;
}

#editorInkParamsToolbar {
		inset-inline-end: 40px;
		background-color: var(--toolbar-bg-color);
}

[dir="ltr"] #editorFreeTextParamsToolbar {
		right: 68px;
}

[dir="rtl"] #editorFreeTextParamsToolbar {
		left: 68px;
}

#editorFreeTextParamsToolbar {
		inset-inline-end: 68px;
		background-color: var(--toolbar-bg-color);
}

.doorHanger,
.doorHangerRight {
		border-radius: 2px;
		box-shadow: 0 1px 5px var(--doorhanger-border-color),
								0 0 0 1px var(--doorhanger-border-color);
		border: var(--doorhanger-border-color-whcm);
}
.doorHanger:after,
.doorHanger:before,
.doorHangerRight:after,
.doorHangerRight:before {
		bottom: 100%;
		border: 8px solid rgba(0, 0, 0, 0);
		content: " ";
		height: 0;
		width: 0;
		position: absolute;
		pointer-events: none;
		opacity: var(--doorhanger-triangle-opacity-whcm);
}
[dir="ltr"] .doorHanger:after {
		left: 10px;
}
[dir="rtl"] .doorHanger:after {
		right: 10px;
}
[dir="ltr"] .doorHanger:after {
		margin-left: -8px;
}
[dir="rtl"] .doorHanger:after {
		margin-right: -8px;
}
.doorHanger:after {
		inset-inline-start: 10px;
		-webkit-margin-start: -8px;
    margin-inline-start: -8px;
		border-bottom-color: var(--toolbar-bg-color);
}
[dir="ltr"] .doorHangerRight:after {
		right: 10px;
}
[dir="rtl"] .doorHangerRight:after {
		left: 10px;
}
[dir="ltr"] .doorHangerRight:after {
		margin-right: -8px;
}
[dir="rtl"] .doorHangerRight:after {
		margin-left: -8px;
}
.doorHangerRight:after {
		inset-inline-end: 10px;
		-webkit-margin-end: -8px;
    margin-inline-end: -8px;
		border-bottom-color: var(--doorhanger-bg-color);
}
.doorHanger:before,
.doorHangerRight:before {
		border-bottom-color: var(--doorhanger-border-color);
		border-width: 9px;
}
[dir="ltr"] .doorHanger:before {
		left: 10px;
}
[dir="rtl"] .doorHanger:before {
		right: 10px;
}
[dir="ltr"] .doorHanger:before {
		margin-left: -9px;
}
[dir="rtl"] .doorHanger:before {
		margin-right: -9px;
}
.doorHanger:before {
		inset-inline-start: 10px;
		-webkit-margin-start: -9px;
    margin-inline-start: -9px;
}
[dir="ltr"] .doorHangerRight:before {
		right: 10px;
}
[dir="rtl"] .doorHangerRight:before {
		left: 10px;
}
[dir="ltr"] .doorHangerRight:before {
		margin-right: -9px;
}
[dir="rtl"] .doorHangerRight:before {
		margin-left: -9px;
}
.doorHangerRight:before {
		inset-inline-end: 10px;
		-webkit-margin-end: -9px;
    margin-inline-end: -9px;
}

#findResultsCount {
		background-color: rgba(217, 217, 217, 1);
		color: rgba(82, 82, 82, 1);
		text-align: center;
		padding: 4px 5px;
		margin: 5px;
}

#findMsg {
		color: rgba(251, 0, 0, 1);
}

#findResultsCount:empty,
#findMsg:empty {
		display: none;
}

#toolbarViewerMiddle {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
}

[dir="ltr"] #toolbarViewerLeft,[dir="ltr"] 
																	 #toolbarSidebarLeft {
		float: left;
}

[dir="rtl"] #toolbarViewerLeft,[dir="rtl"] 
																	 #toolbarSidebarLeft {
		float: right;
}

#toolbarViewerLeft,
#toolbarSidebarLeft {
		float: inline-start;
}
[dir="ltr"] #toolbarViewerRight,[dir="ltr"] 
																		#toolbarSidebarRight {
		float: right;
}
[dir="rtl"] #toolbarViewerRight,[dir="rtl"] 
																		#toolbarSidebarRight {
		float: left;
}
#toolbarViewerRight,
#toolbarSidebarRight {
		float: inline-end;
}

[dir="ltr"] #toolbarViewerLeft > *,[dir="ltr"] 
																			 #toolbarViewerMiddle > *,[dir="ltr"] 
																																		#toolbarViewerRight > *,[dir="ltr"] 
																																																#toolbarSidebarLeft *,[dir="ltr"] 
																																																													#toolbarSidebarRight *,[dir="ltr"] 
																																																																										 .findbar * {
		float: left;
}

[dir="rtl"] #toolbarViewerLeft > *,[dir="rtl"] 
																			 #toolbarViewerMiddle > *,[dir="rtl"] 
																																		#toolbarViewerRight > *,[dir="rtl"] 
																																																#toolbarSidebarLeft *,[dir="rtl"] 
																																																													#toolbarSidebarRight *,[dir="rtl"] 
																																																																										 .findbar * {
		float: right;
}

#toolbarViewerLeft > *,
#toolbarViewerMiddle > *,
#toolbarViewerRight > *,
#toolbarSidebarLeft *,
#toolbarSidebarRight *,
.findbar * {
		position: relative;
		float: inline-start;
}

[dir="ltr"] #toolbarViewerLeft {
		padding-left: 1px;
}

[dir="rtl"] #toolbarViewerLeft {
		padding-right: 1px;
}

#toolbarViewerLeft {
		-webkit-padding-start: 1px;
    padding-inline-start: 1px;
}
[dir="ltr"] #toolbarViewerRight {
		padding-right: 1px;
}
[dir="rtl"] #toolbarViewerRight {
		padding-left: 1px;
}
#toolbarViewerRight {
		-webkit-padding-end: 1px;
    padding-inline-end: 1px;
}
[dir="ltr"] #toolbarSidebarRight {
		padding-right: 2px;
}
[dir="rtl"] #toolbarSidebarRight {
		padding-left: 2px;
}
#toolbarSidebarRight {
		-webkit-padding-end: 2px;
    padding-inline-end: 2px;
}

.splitToolbarButton {
		margin: 2px;
		display: inline-block;
}
[dir="ltr"] .splitToolbarButton > .toolbarButton {
		float: left;
}
[dir="rtl"] .splitToolbarButton > .toolbarButton {
		float: right;
}
.splitToolbarButton > .toolbarButton {
		float: inline-start;
}

.toolbarButton,
.secondaryToolbarButton,
.dialogButton {
		border: 0 none;
		background: none;
		width: 28px;
		height: 28px;
}

.dialogButton:hover,
.dialogButton:focus-visible {
		background-color: var(--dialog-button-hover-bg-color);
}

.dialogButton:hover > span,
.dialogButton:focus-visible > span {
		color: var(--dialog-button-hover-color);
}

.toolbarButton > span {
		display: inline-block;
		width: 0;
		height: 0;
		overflow: hidden;
}

.toolbarButton[disabled],
.secondaryToolbarButton[disabled],
.dialogButton[disabled] {
		opacity: 0.5;
}

.splitToolbarButton > .toolbarButton:hover,
.splitToolbarButton > .toolbarButton:focus-visible,
.dropdownToolbarButton:hover {
		background-color: var(--button-hover-color);
}
.splitToolbarButton > .toolbarButton {
		position: relative;
		margin: 0;
}
[dir="ltr"] #toolbarSidebar .splitToolbarButton > .toolbarButton {
		margin-right: 2px;
}
[dir="rtl"] #toolbarSidebar .splitToolbarButton > .toolbarButton {
		margin-left: 2px;
}
#toolbarSidebar .splitToolbarButton > .toolbarButton {
		-webkit-margin-end: 2px;
    margin-inline-end: 2px;
}

[dir="ltr"] .splitToolbarButtonSeparator {
		float: left;
}

[dir="rtl"] .splitToolbarButtonSeparator {
		float: right;
}

.splitToolbarButtonSeparator {
		float: inline-start;
		margin: 4px 0;
		width: 1px;
		height: 20px;
		background-color: var(--separator-color);
}

.toolbarButton,
.dropdownToolbarButton,
.secondaryToolbarButton,
.dialogButton {
		min-width: 16px;
		margin: 2px 1px;
		padding: 2px 6px 0;
		border: none;
		border-radius: 2px;
		color: var(--main-color);
		font-size: 12px;
		line-height: 14px;
		-webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
		cursor: default;
		box-sizing: border-box;
}

.toolbarButton:hover,
.toolbarButton:focus-visible {
		background-color: var(--button-hover-color);
}
.secondaryToolbarButton:hover,
.secondaryToolbarButton:focus-visible {
		background-color: var(--doorhanger-hover-bg-color);
		color: var(--doorhanger-hover-color);
}

.toolbarButton.toggled,
.splitToolbarButton.toggled > .toolbarButton.toggled,
.secondaryToolbarButton.toggled {
		background-color: var(--toggled-btn-bg-color);
		color: var(--toggled-btn-color);
}

.toolbarButton.toggled::before,
.secondaryToolbarButton.toggled::before {
		background-color: var(--toggled-btn-color);
}

.toolbarButton.toggled:hover:active,
.splitToolbarButton.toggled > .toolbarButton.toggled:hover:active,
.secondaryToolbarButton.toggled:hover:active {
		background-color: var(--toggled-hover-active-btn-color);
}

.dropdownToolbarButton {
		width: var(--scale-select-container-width);
		padding: 0;
		overflow: hidden;
		background-color: var(--dropdown-btn-bg-color);
}
[dir="ltr"] .dropdownToolbarButton::after {
		right: 7px;
}
[dir="rtl"] .dropdownToolbarButton::after {
		left: 7px;
}
.dropdownToolbarButton::after {
		top: 6px;
		inset-inline-end: 7px;
		pointer-events: none;
		-webkit-mask-image: var(--toolbarButton-menuArrow-icon);
    mask-image: var(--toolbarButton-menuArrow-icon);
}

[dir="ltr"] .dropdownToolbarButton > select {
		padding-left: 4px;
}

[dir="rtl"] .dropdownToolbarButton > select {
		padding-right: 4px;
}

.dropdownToolbarButton > select {
		width: calc(
				var(--scale-select-container-width) + var(--scale-select-overflow)
		);
		height: 28px;
		font-size: 12px;
		color: var(--main-color);
		margin: 0;
		padding: 1px 0 2px;
		-webkit-padding-start: 4px;
    padding-inline-start: 4px;
		border: none;
		background-color: var(--dropdown-btn-bg-color);
}
.dropdownToolbarButton > select:hover,
.dropdownToolbarButton > select:focus-visible {
		background-color: var(--button-hover-color);
		color: var(--toggled-btn-color);
}
.dropdownToolbarButton > select > option {
		background: var(--doorhanger-bg-color);
		color: var(--main-color);
}

.toolbarButtonSpacer {
		width: 30px;
		display: inline-block;
		height: 1px;
}

.toolbarButton::before,
.secondaryToolbarButton::before,
.dropdownToolbarButton::after,
.treeItemToggler::before {
		/* All matching images have a size of 16x16
		 * All relevant containers have a size of 28x28 */
		position: absolute;
		display: inline-block;
		width: 16px;
		height: 16px;

		content: "";
		background-color: var(--toolbar-icon-bg-color);
		-webkit-mask-size: cover;
    mask-size: cover;
}

.dropdownToolbarButton:hover::after,
.dropdownToolbarButton:focus-visible::after,
.dropdownToolbarButton:active::after {
		background-color: var(--toolbar-icon-hover-bg-color);
}

.toolbarButton::before {
		opacity: var(--toolbar-icon-opacity);
		top: 6px;
		left: 6px;
}

.toolbarButton:hover::before,
.toolbarButton:focus-visible::before,
.secondaryToolbarButton:hover::before,
.secondaryToolbarButton:focus-visible::before {
		background-color: var(--toolbar-icon-hover-bg-color);
}

[dir="ltr"] .secondaryToolbarButton::before {
		left: 12px;
}

[dir="rtl"] .secondaryToolbarButton::before {
		right: 12px;
}

.secondaryToolbarButton::before {
		opacity: var(--doorhanger-icon-opacity);
		top: 5px;
		inset-inline-start: 12px;
}

#sidebarToggle::before {
		-webkit-mask-image: var(--toolbarButton-sidebarToggle-icon);
    mask-image: var(--toolbarButton-sidebarToggle-icon);
		transform: scaleX(var(--dir-factor));
}

#secondaryToolbarToggle::before {
		-webkit-mask-image: var(--toolbarButton-secondaryToolbarToggle-icon);
    mask-image: var(--toolbarButton-secondaryToolbarToggle-icon);
		transform: scaleX(var(--dir-factor));
}

#findPrevious::before {
		-webkit-mask-image: var(--findbarButton-previous-icon);
    mask-image: var(--findbarButton-previous-icon);
}

#findNext::before {
		-webkit-mask-image: var(--findbarButton-next-icon);
    mask-image: var(--findbarButton-next-icon);
}

#previous::before {
		-webkit-mask-image: var(--toolbarButton-pageUp-icon);
    mask-image: var(--toolbarButton-pageUp-icon);
}

#next::before {
		-webkit-mask-image: var(--toolbarButton-pageDown-icon);
    mask-image: var(--toolbarButton-pageDown-icon);
}

#zoomOut::before {
		-webkit-mask-image: var(--toolbarButton-zoomOut-icon);
    mask-image: var(--toolbarButton-zoomOut-icon);
}

#zoomIn::before {
		-webkit-mask-image: var(--toolbarButton-zoomIn-icon);
    mask-image: var(--toolbarButton-zoomIn-icon);
}

#presentationMode::before,
#secondaryPresentationMode::before {
		-webkit-mask-image: var(--toolbarButton-presentationMode-icon);
    mask-image: var(--toolbarButton-presentationMode-icon);
}

#editorNone::before {
		-webkit-mask-image: var(--toolbarButton-editorNone-icon);
    mask-image: var(--toolbarButton-editorNone-icon);
}

#editorFreeText::before {
		-webkit-mask-image: var(--toolbarButton-editorFreeText-icon);
    mask-image: var(--toolbarButton-editorFreeText-icon);
}

#editorInk::before {
		-webkit-mask-image: var(--toolbarButton-editorInk-icon);
    mask-image: var(--toolbarButton-editorInk-icon);
}

#print::before,
#secondaryPrint::before {
		-webkit-mask-image: var(--toolbarButton-print-icon);
    mask-image: var(--toolbarButton-print-icon);
}

#openFile::before,
#secondaryOpenFile::before {
		-webkit-mask-image: var(--toolbarButton-openFile-icon);
    mask-image: var(--toolbarButton-openFile-icon);
}

#download::before,
#secondaryDownload::before {
		-webkit-mask-image: var(--toolbarButton-download-icon);
    mask-image: var(--toolbarButton-download-icon);
}

a.secondaryToolbarButton {
		padding-top: 6px;
		text-decoration: none;
}
a.toolbarButton[href="#"],
a.secondaryToolbarButton[href="#"] {
		opacity: 0.5;
		pointer-events: none;
}

#viewBookmark::before,
#secondaryViewBookmark::before {
		-webkit-mask-image: var(--toolbarButton-bookmark-icon);
    mask-image: var(--toolbarButton-bookmark-icon);
}

#viewThumbnail::before {
		-webkit-mask-image: var(--toolbarButton-viewThumbnail-icon);
    mask-image: var(--toolbarButton-viewThumbnail-icon);
}

#viewOutline::before {
		-webkit-mask-image: var(--toolbarButton-viewOutline-icon);
    mask-image: var(--toolbarButton-viewOutline-icon);
		transform: scaleX(var(--dir-factor));
}

#viewAttachments::before {
		-webkit-mask-image: var(--toolbarButton-viewAttachments-icon);
    mask-image: var(--toolbarButton-viewAttachments-icon);
}

#viewLayers::before {
		-webkit-mask-image: var(--toolbarButton-viewLayers-icon);
    mask-image: var(--toolbarButton-viewLayers-icon);
}

#currentOutlineItem::before {
		-webkit-mask-image: var(--toolbarButton-currentOutlineItem-icon);
    mask-image: var(--toolbarButton-currentOutlineItem-icon);
		transform: scaleX(var(--dir-factor));
}

#viewFind::before {
		-webkit-mask-image: var(--toolbarButton-search-icon);
    mask-image: var(--toolbarButton-search-icon);
}

[dir="ltr"] .pdfSidebarNotification::after {
		left: 17px;
}

[dir="rtl"] .pdfSidebarNotification::after {
		right: 17px;
}

.pdfSidebarNotification::after {
		position: absolute;
		display: inline-block;
		top: 1px;
		inset-inline-start: 17px;
		/* Create a filled circle, with a diameter of 9 pixels, using only CSS: */
		content: "";
		background-color: rgba(112, 219, 85, 1);
		height: 9px;
		width: 9px;
		border-radius: 50%;
}

[dir="ltr"] .secondaryToolbarButton {
		padding-left: 36px;
}

[dir="rtl"] .secondaryToolbarButton {
		padding-right: 36px;
}

[dir="ltr"] .secondaryToolbarButton {
		text-align: left;
}

[dir="rtl"] .secondaryToolbarButton {
		text-align: right;
}

.secondaryToolbarButton {
		position: relative;
		margin: 0;
		padding: 0 0 1px;
		-webkit-padding-start: 36px;
    padding-inline-start: 36px;
		height: auto;
		min-height: 26px;
		width: auto;
		min-width: 100%;
		text-align: start;
		white-space: normal;
		border-radius: 0;
		box-sizing: border-box;
}
[dir="ltr"] .secondaryToolbarButton > span {
		padding-right: 4px;
}
[dir="rtl"] .secondaryToolbarButton > span {
		padding-left: 4px;
}
.secondaryToolbarButton > span {
		-webkit-padding-end: 4px;
    padding-inline-end: 4px;
}

#firstPage::before {
		-webkit-mask-image: var(--secondaryToolbarButton-firstPage-icon);
    mask-image: var(--secondaryToolbarButton-firstPage-icon);
}

#lastPage::before {
		-webkit-mask-image: var(--secondaryToolbarButton-lastPage-icon);
    mask-image: var(--secondaryToolbarButton-lastPage-icon);
}

#pageRotateCcw::before {
		-webkit-mask-image: var(--secondaryToolbarButton-rotateCcw-icon);
    mask-image: var(--secondaryToolbarButton-rotateCcw-icon);
}

#pageRotateCw::before {
		-webkit-mask-image: var(--secondaryToolbarButton-rotateCw-icon);
    mask-image: var(--secondaryToolbarButton-rotateCw-icon);
}

#cursorSelectTool::before {
		-webkit-mask-image: var(--secondaryToolbarButton-selectTool-icon);
    mask-image: var(--secondaryToolbarButton-selectTool-icon);
}

#cursorHandTool::before {
		-webkit-mask-image: var(--secondaryToolbarButton-handTool-icon);
    mask-image: var(--secondaryToolbarButton-handTool-icon);
}

#scrollPage::before {
		-webkit-mask-image: var(--secondaryToolbarButton-scrollPage-icon);
    mask-image: var(--secondaryToolbarButton-scrollPage-icon);
}

#scrollVertical::before {
		-webkit-mask-image: var(--secondaryToolbarButton-scrollVertical-icon);
    mask-image: var(--secondaryToolbarButton-scrollVertical-icon);
}

#scrollHorizontal::before {
		-webkit-mask-image: var(--secondaryToolbarButton-scrollHorizontal-icon);
    mask-image: var(--secondaryToolbarButton-scrollHorizontal-icon);
}

#scrollWrapped::before {
		-webkit-mask-image: var(--secondaryToolbarButton-scrollWrapped-icon);
    mask-image: var(--secondaryToolbarButton-scrollWrapped-icon);
}

#spreadNone::before {
		-webkit-mask-image: var(--secondaryToolbarButton-spreadNone-icon);
    mask-image: var(--secondaryToolbarButton-spreadNone-icon);
}

#spreadOdd::before {
		-webkit-mask-image: var(--secondaryToolbarButton-spreadOdd-icon);
    mask-image: var(--secondaryToolbarButton-spreadOdd-icon);
}

#spreadEven::before {
		-webkit-mask-image: var(--secondaryToolbarButton-spreadEven-icon);
    mask-image: var(--secondaryToolbarButton-spreadEven-icon);
}

#documentProperties::before {
		-webkit-mask-image: var(--secondaryToolbarButton-documentProperties-icon);
    mask-image: var(--secondaryToolbarButton-documentProperties-icon);
}

.verticalToolbarSeparator {
		display: block;
		margin: 5px 2px;
		width: 1px;
		height: 22px;
		background-color: var(--separator-color);
}
.horizontalToolbarSeparator {
		display: block;
		margin: 6px 0;
		height: 1px;
		width: 100%;
		background-color: var(--doorhanger-separator-color);
}

.toolbarField {
		padding: 4px 7px;
		margin: 3px 0;
		border-radius: 2px;
		background-color: var(--field-bg-color);
		background-clip: padding-box;
		border: 1px solid var(--field-border-color);
		box-shadow: none;
		color: var(--field-color);
		font-size: 12px;
		line-height: 16px;
		outline-style: none;
}

[dir="ltr"] .toolbarField[type="checkbox"] {
		margin-left: 7px;
}

[dir="rtl"] .toolbarField[type="checkbox"] {
		margin-right: 7px;
}

.toolbarField[type="checkbox"] {
		opacity: 0;
		position: absolute !important;
		left: 0;
		margin: 10px 0 3px;
		-webkit-margin-start: 7px;
    margin-inline-start: 7px;
}

#pageNumber {
		-moz-appearance: textfield; /* hides the spinner in moz */
		text-align: right;
		width: 40px;
}
#pageNumber.visiblePageIsLoading {
		background-image: var(--loading-icon);
		background-repeat: no-repeat;
		background-position: 3px;
}
#pageNumber::-webkit-inner-spin-button {
		-webkit-appearance: none;
}

.toolbarField:focus {
		border-color: #0a84ff;
}

.toolbarLabel {
		min-width: 16px;
		padding: 7px;
		margin: 2px;
		border-radius: 2px;
		color: var(--main-color);
		font-size: 12px;
		line-height: 14px;
		text-align: left;
		-webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
		cursor: default;
}

[dir="ltr"] #numPages.toolbarLabel {
		padding-left: 3px;
}

[dir="rtl"] #numPages.toolbarLabel {
		padding-right: 3px;
}

#numPages.toolbarLabel {
		-webkit-padding-start: 3px;
    padding-inline-start: 3px;
}

#thumbnailView,
#outlineView,
#attachmentsView,
#layersView {
		position: absolute;
		width: calc(100% - 8px);
		top: 0;
		bottom: 0;
		padding: 4px 4px 0;
		overflow: auto;
		-webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
}
#thumbnailView {
		width: calc(100% - 60px);
		padding: 10px 30px 0;
}

#thumbnailView > a:active,
#thumbnailView > a:focus {
		outline: 0;
}

[dir="ltr"] .thumbnail {
		float: left;
}

[dir="rtl"] .thumbnail {
		float: right;
}

.thumbnail {
		float: inline-start;
		margin: 0 10px 5px;
}

#thumbnailView > a:last-of-type > .thumbnail {
		margin-bottom: 10px;
}
#thumbnailView > a:last-of-type > .thumbnail:not([data-loaded]) {
		margin-bottom: 9px;
}

.thumbnail:not([data-loaded]) {
		border: 1px dashed rgba(132, 132, 132, 1);
		margin: -1px 9px 4px;
}

.thumbnailImage {
		border: 1px solid rgba(0, 0, 0, 0);
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3);
		opacity: 0.8;
		z-index: 99;
		background-color: rgba(255, 255, 255, 1);
		background-clip: content-box;
}

.thumbnailSelectionRing {
		border-radius: 2px;
		padding: 7px;
}

a:focus > .thumbnail > .thumbnailSelectionRing > .thumbnailImage,
.thumbnail:hover > .thumbnailSelectionRing > .thumbnailImage {
		opacity: 0.9;
}

a:focus > .thumbnail > .thumbnailSelectionRing,
.thumbnail:hover > .thumbnailSelectionRing {
		background-color: var(--sidebaritem-bg-color);
		background-clip: padding-box;
		color: rgba(255, 255, 255, 0.9);
}

.thumbnail.selected > .thumbnailSelectionRing > .thumbnailImage {
		opacity: 1;
}

.thumbnail.selected > .thumbnailSelectionRing {
		background-color: var(--sidebaritem-bg-color);
		background-clip: padding-box;
		color: rgba(255, 255, 255, 1);
}

[dir="ltr"] .treeWithDeepNesting > .treeItem,[dir="ltr"] 
																								 .treeItem > .treeItems {
		margin-left: 20px;
}

[dir="rtl"] .treeWithDeepNesting > .treeItem,[dir="rtl"] 
																								 .treeItem > .treeItems {
		margin-right: 20px;
}

.treeWithDeepNesting > .treeItem,
.treeItem > .treeItems {
		-webkit-margin-start: 20px;
    margin-inline-start: 20px;
}

[dir="ltr"] .treeItem > a {
		padding-left: 4px;
}

[dir="rtl"] .treeItem > a {
		padding-right: 4px;
}

.treeItem > a {
		text-decoration: none;
		display: inline-block;
		/* Subtract the right padding (left, in RTL mode) of the container: */
		min-width: calc(100% - 4px);
		height: auto;
		margin-bottom: 1px;
		padding: 2px 0 5px;
		-webkit-padding-start: 4px;
    padding-inline-start: 4px;
		border-radius: 2px;
		color: var(--treeitem-color);
		font-size: 13px;
		line-height: 15px;
		-webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
		white-space: normal;
		cursor: pointer;
}

#layersView .treeItem > a * {
		cursor: pointer;
}
[dir="ltr"] #layersView .treeItem > a > label {
		padding-left: 4px;
}
[dir="rtl"] #layersView .treeItem > a > label {
		padding-right: 4px;
}
#layersView .treeItem > a > label {
		-webkit-padding-start: 4px;
    padding-inline-start: 4px;
}
[dir="ltr"] #layersView .treeItem > a > label > input {
		float: left;
}
[dir="rtl"] #layersView .treeItem > a > label > input {
		float: right;
}
#layersView .treeItem > a > label > input {
		float: inline-start;
		margin-top: 1px;
}

[dir="ltr"] .treeItemToggler {
		float: left;
}

[dir="rtl"] .treeItemToggler {
		float: right;
}

.treeItemToggler {
		position: relative;
		float: inline-start;
		height: 0;
		width: 0;
		color: rgba(255, 255, 255, 0.5);
}
[dir="ltr"] .treeItemToggler::before {
		right: 4px;
}
[dir="rtl"] .treeItemToggler::before {
		left: 4px;
}
.treeItemToggler::before {
		inset-inline-end: 4px;
		-webkit-mask-image: var(--treeitem-expanded-icon);
    mask-image: var(--treeitem-expanded-icon);
}
.treeItemToggler.treeItemsHidden::before {
		-webkit-mask-image: var(--treeitem-collapsed-icon);
    mask-image: var(--treeitem-collapsed-icon);
		transform: scaleX(var(--dir-factor));
}
.treeItemToggler.treeItemsHidden ~ .treeItems {
		display: none;
}

.treeItem.selected > a {
		background-color: var(--treeitem-selected-bg-color);
		color: var(--treeitem-selected-color);
}

.treeItemToggler:hover,
.treeItemToggler:hover + a,
.treeItemToggler:hover ~ .treeItems,
.treeItem > a:hover {
		background-color: var(--sidebaritem-bg-color);
		background-clip: padding-box;
		border-radius: 2px;
		color: var(--treeitem-hover-color);
}

/* TODO: file FF bug to support ::-moz-selection:window-inactive
   so we can override the opaque grey background when the window is inactive;
   see https://bugzilla.mozilla.org/show_bug.cgi?id=706209 */
::-moz-selection {
		background: rgba(0, 0, 255, 0.3);
}
::selection {
		background: rgba(0, 0, 255, 0.3);
}

#errorWrapper {
		background-color: var(--errorWrapper-bg-color);
		color: var(--main-color);
		left: 0;
		position: absolute;
		right: 0;
		z-index: 1000;
		padding: 3px 6px;
}

#errorMessageLeft {
		float: left;
}
#errorMessageRight {
		float: right;
}

#errorSpacer {
		clear: both;
}
#errorMoreInfo {
		background-color: var(--field-bg-color);
		color: var(--field-color);
		border: 1px solid var(--field-border-color);
		padding: 3px;
		margin: 3px;
		width: 98%;
}

.dialogButton {
		width: auto;
		margin: 3px 4px 2px !important;
		padding: 2px 11px;
		color: var(--main-color);
		background-color: var(--dialog-button-bg-color);
		border: var(--dialog-button-border) !important;
}

dialog {
		margin: auto;
		padding: 15px;
		border-spacing: 4px;
		color: var(--main-color);
		font-size: 12px;
		line-height: 14px;
		background-color: var(--doorhanger-bg-color);
		border: 1px solid rgba(0, 0, 0, 0.5);
		border-radius: 4px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}
dialog::-webkit-backdrop {
		background-color: rgba(0, 0, 0, 0.2);
}
dialog::backdrop {
		background-color: rgba(0, 0, 0, 0.2);
}

dialog > .row {
		display: table-row;
}

dialog > .row > * {
		display: table-cell;
}

dialog .toolbarField {
		margin: 5px 0;
}

dialog .separator {
		display: block;
		margin: 4px 0;
		height: 1px;
		width: 100%;
		background-color: var(--separator-color);
}

dialog .buttonRow {
		text-align: center;
		vertical-align: middle;
}

dialog :link {
		color: rgba(255, 255, 255, 1);
}

#passwordDialog {
		text-align: center;
}
#passwordDialog .toolbarField {
		width: 200px;
}

#documentPropertiesDialog {
		text-align: left;
}
[dir="ltr"] #documentPropertiesDialog .row > * {
		text-align: left;
}
[dir="rtl"] #documentPropertiesDialog .row > * {
		text-align: right;
}
#documentPropertiesDialog .row > * {
		min-width: 100px;
		text-align: start;
}
#documentPropertiesDialog .row > span {
		width: 125px;
		word-wrap: break-word;
}
#documentPropertiesDialog .row > p {
		max-width: 225px;
		word-wrap: break-word;
}
#documentPropertiesDialog .buttonRow {
		margin-top: 10px;
}

.grab-to-pan-grab {
		cursor: -webkit-grab !important;
		cursor: grab !important;
}
.grab-to-pan-grab
*:not(input):not(textarea):not(button):not(select):not(:link) {
		cursor: inherit !important;
}
.grab-to-pan-grab:active,
.grab-to-pan-grabbing {
		cursor: -webkit-grabbing !important;
		cursor: grabbing !important;
		position: fixed;
		background: rgba(0, 0, 0, 0);
		display: block;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: hidden;
		z-index: 50000; /* should be higher than anything else in PDF.js! */
}

@page {
		margin: 0;
}

#printContainer {
		display: none;
}

@media print {
		body {
				background: rgba(0, 0, 0, 0) none;
		}
		body[data-pdfjsprinting] #outerContainer {
				display: none;
		}
		body[data-pdfjsprinting] #printContainer {
				display: block;
		}
		#printContainer {
				height: 100%;
		}
		/* wrapper around (scaled) print canvas elements */
		#printContainer > .printedPage {
				page-break-after: always;
				page-break-inside: avoid;

				/* The wrapper always cover the whole page. */
				height: 100%;
				width: 100%;

				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
		}

		#printContainer > .xfaPrintedPage .xfaPage {
				position: absolute;
		}

		#printContainer > .xfaPrintedPage {
				page-break-after: always;
				page-break-inside: avoid;
				width: 100%;
				height: 100%;
				position: relative;
		}

		#printContainer > .printedPage canvas,
		#printContainer > .printedPage img {
				/* The intrinsic canvas / image size will make sure that we fit the page. */
				max-width: 100%;
				max-height: 100%;

				direction: ltr;
				display: block;
		}
}

.visibleLargeView,
.visibleMediumView,
.visibleSmallView {
		display: none;
}

@media all and (max-width: 900px) {
		#toolbarViewerMiddle {
				display: table;
				margin: auto;
				left: auto;
				position: inherit;
				transform: none;
		}
}

@media all and (max-width: 840px) {
		#sidebarContainer {
				background-color: var(--sidebar-narrow-bg-color);
		}
		[dir="ltr"] #outerContainer.sidebarOpen #viewerContainer {
				left: 0 !important;
		}
		[dir="rtl"] #outerContainer.sidebarOpen #viewerContainer {
				right: 0 !important;
		}
		#outerContainer.sidebarOpen #viewerContainer {
				inset-inline-start: 0 !important;
		}
}

@media all and (max-width: 820px) {
		#outerContainer .hiddenLargeView {
				display: none;
		}
		#outerContainer .visibleLargeView {
				display: inherit;
		}
}

@media all and (max-width: 750px) {
		#outerContainer .hiddenMediumView {
				display: none;
		}
		#outerContainer .visibleMediumView {
				display: inherit;
		}
}

@media all and (max-width: 690px) {
		.hiddenSmallView,
		.hiddenSmallView * {
				display: none;
		}
		.visibleSmallView {
				display: inherit;
		}
		.toolbarButtonSpacer {
				width: 0;
		}
		[dir="ltr"] .findbar {
				left: 34px;
		}
		[dir="rtl"] .findbar {
				right: 34px;
		}
		.findbar {
				inset-inline-start: 34px;
		}
}

@media all and (max-width: 560px) {
		#scaleSelectContainer {
				display: none;
		}
}

`