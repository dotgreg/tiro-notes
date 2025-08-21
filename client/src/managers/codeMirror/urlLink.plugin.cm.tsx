///////////////////////////////////
// URL LINK

import { regexs } from "../../../../shared/helpers/regexs.helper";
import { getApi } from "../../hooks/api/api.hook";
import { isMobile } from "../device.manager";
import { ssrFn, ssrIcon  } from "../ssr.manager";
import { cssVars } from "../style/vars.style.manager";
import { genericReplacementPlugin } from "./replacements.cm";
import { mem } from "../reactRenderer.manager";
import { ssrGenCtag, ssrToggleCtag } from "../ssr/ctag.ssr";
import { iFile } from "../../../../shared/types.shared";
import { iUserSettingsApi } from "../../hooks/useUserSettings.hook";
import { genUrlPreviewStr } from "../url.manager";
import { notifLog } from "../devCli.manager";

type iLinkPreviewOpts = {addLineJump?: boolean}
export const generateHtmlLinkPreview = mem((matchs, opts?:iLinkPreviewOpts) => generateHtmlLinkPreviewInt(matchs, opts))

export const linksPreviewPlugin = (file: iFile, windowId:string) => genericReplacementPlugin({
	file,
	windowId,
	pattern: regexs.externalLink3,
	replacement: params => {
		const matchs = params.matchs
		let resEl = document.createElement("span");
		// resEl.innerHTML = generateHtmlLinkPreview(matchs)
		resEl.innerHTML = generateHtmlLinkPreview(matchs)
		// resEl.innerHTML = "woop"
		return resEl
	}
})



// caching system
// cachedUrlLinks = () => {

// }

//
// HTML GENERATOR FUNC
//

export const generateHtmlLinkPreviewInt = (
	// el: any,
	matchsOrUrl: string[] | string,
	opts?: iLinkPreviewOpts
): string => {
	let matchs: any[] = []
	// if matchsOrUrl is an array
	if (!Array.isArray(matchsOrUrl)) {
		matchs = [...matchsOrUrl.matchAll(regexs.externalLink3)][0]
	}
	else matchs = matchsOrUrl

	let resEl = document.createElement("span");
	let fullLink = matchs[0].slice(0, -1) // removing last /
	// let website = matchs[1].replace("www.", "")
	// let firstSlash = matchs[3]
	// let secondSlash = matchs[4]
	// resEl.classList.add('link-mdpreview-wrapper')
	// resEl.classList.add('link-wrapper')
	// let limitChar = 17
	// if (website.length > limitChar) website = website.substring(website.length - limitChar)
	// let artTitle = firstSlash
	// if (artTitle === "" || !artTitle) artTitle = secondSlash
	// if (artTitle.length > limitChar) artTitle = artTitle.substring(0, limitChar) + ""
	// artTitle = (artTitle.length !== 0) ? `${artTitle}` : ``
	// let previewStr = `${website}${artTitle}`
	// if (previewStr.length > limitChar) previewStr = previewStr.substring(0, limitChar)

	

	  let previewStr = genUrlPreviewStr(fullLink)
	  


	//
	// JS
	//
	// support
	const getIframeEl = (el) => el.parentNode.parentNode.parentNode.querySelector(".cm-hover-popup")

	const fetchArticle = (el: any, cb: Function, openPopup:boolean=true) => {
		let link = el.dataset.link
		getApi(api => {
			notifLog(`fetching article "${link}"...`, "fetchArticle", 5)
			api.ressource.fetchUrlArticle(link, r => {
				let webpageContent = encodeURIComponent(r.html)
				if (openPopup) {
					api.ui.floatingPanel.create({
						type: "ctag",
						ctagConfig: {
							tagName: "web",
							content: webpageContent,
						},
					})
				}
				cb(r)
			})
		})
	}

	// function button
	// const previewFn = (el) => {
	// 	if (!el) return
	// 	let link = el.dataset.link
	// 	// ssrOpenIframeEl2(getIframeEl(el), link)
	// 	ssrToggleCtag(getIframeEl(el), ssrGenCtag("iframe",link, ))
	// }
	const openWinFn = (el) => {
		if (!el) return
		let link = el.dataset.link
		window.open(link, `popup-preview-link`, 'width=800,height=1000')
	}
	const detachWinFn = (el) => {
		if (!el) return
		let link = el.dataset.link
		getApi(api => {
			api.ui.floatingPanel.create({
				type: "ctag",
				ctagConfig: {
					tagName: "web",
					content: link,
				},
			})
		})
	}
	const fetchFn = (el) => {
		if (!el) return
		fetchArticle(el, () => { })
	}
	const audioFn = (el) => {
		if (!el) return
		fetchArticle(el, r => {
			if (!r.text) return;
			getApi(api => {
				api.ui.textToSpeechPopup.open(r.text, {id: el.dataset.link})
			})
		}, false)
	}

	let linejump = ``
	if (opts?.addLineJump) linejump = '\n'

	// HTML
	let i = ssrIcon
	let openWindow = `<span title="Open link in detached window" onclick="${ssrFn("open-win-link", openWinFn)}"
class="link-action link-openwindow"  data-link="${fullLink}">${i('up-right-from-square')}</span>`
// 	let openPreview = `<span
// onclick="${ssrFn("preview-link", previewFn)}"
// title="Preview link" class="link-openpreview link-action" data-link="${fullLink}">${i('eye')}</span>`
	let fetch = `<span
onclick="${ssrFn("fetch-link", fetchFn)}"
title="Display url content" class="link-fetcharticle link-action"  data-link="${fullLink}">${i('file-lines')}</span>`
	let audio = `<span
onclick="${ssrFn("audio-link", audioFn)}"
title="Text to speech url content" class="link-audio link-action"  data-link="${fullLink}">${i("volume-high")}</span>`
	let detach = `<span
		 title="Detach link in floating panel" class="
		ink-detach link-action"  data-link="${fullLink}">${i("window-restore")}</span>`
	let goto = `<a
		href="${fullLink}" target="_blank" rel="noreferrer"
		title="Go to link" class="link-goto link-action">${i("link")}</a>`


	let btns = `<span class="link-action-more"><span class="icon-more">${i("ellipsis")}</span><span class="link-action-wrapper">${fetch} ${audio} ${detach} ${openWindow} </span></span>`
	let btnsMobile = `<span class="link-action-wrapper">${fetch} ${audio} ${goto} ${detach} ${openWindow} </span>`

	let iframeWrapper = `<span class="cm-hover-popup cm-hover-popup"></span>`
	// let html = `<span class="${isMobile() ? "mobile-version" : ""} link-mdpreview-wrapper"><a href="${fullLink}" class="link-mdpreview" title="${fullLink}" target="_blank" rel="noreferrer">${i("link")}${previewStr}</a>${btns}${iframeWrapper}</span>${linejump}`
	let html = `<span class="${isMobile() ? "mobile-version" : ""} link-mdpreview-wrapper"><a href="${fullLink}" class="link-mdpreview" title="${fullLink}" target="_blank" rel="noreferrer">${i("link")}${previewStr}</a>${btns}${iframeWrapper}</span>${linejump}`
	if (isMobile()) html = `<span class="${isMobile() ? "mobile-version" : ""} link-mdpreview-wrapper"><span  class="link-action-more link-mdpreview" title="${fullLink}" rel="noreferrer">${i("link")}${previewStr}${btnsMobile}${iframeWrapper}</span>${linejump}`
	resEl.innerHTML = `${html}`;

	return resEl.outerHTML
}

export const linksPreviewMdCss = (userSettings: iUserSettingsApi) => {
// let urlPreviewZoom = 0.65
let urlPreviewZoom = parseFloat(userSettings.get("ui_editor_links_preview_zoom"))
let floatingWindow = userSettings.get("beta_floating_windows")
if (isNaN(urlPreviewZoom)) urlPreviewZoom = 1
if (isNaN(floatingWindow)) floatingWindow = false

return `
.link-fetch-preview-wrapper {
		background: grey;
}
// .preview-area-wrapper .link-mdpreview-wrapper,
// .preview-area .link-mdpreview-wrapper {
// 	display: inline-block;
// }

${floatingWindow ? ``:`.link-detach {display:none;}`}

.link-mdpreview-wrapper {
		position: relative;
}
.link-mdpreview-wrapper .link-action {
}
.link-deco {
		padding-right:2px;
}
.link-action-more {
		position: relative;
}
.link-action-wrapper {
		display:flex;
		position: absolute;
		right: -30px;
		top: -10px;
		opacity: 0;
		transition: 0.2s all;
		pointer-events: none;
		background: white;
		box-shadow: 0px 0px 5px rgba(0,0,0,0.1);
		padding: 7px;
		z-index: 10000;
}
.link-action-wrapper span {
	margin: 0px 2px;
}


// mobile version
.mobile-version .link-action-wrapper {
		box-shadow: 0px 0px 10px rgba(0,0,0,0.3);
	top: 50%;
  left: 50%;
  position: fixed;
  transform: translate(-50%,-50%);
  padding: 30px 50px;
  background: white;
  width: 170px;
  z-index:2;

}
.mobile-version .link-action {
		transform: scale(1.6);
		padding: 20px; 
}
.link-action-wrapper .link-action {
		padding-left:4px;
}

.link-action-more  {
		margin-right: 6px;
		opacity: 0.3;
}
.link-action-more .icon-more  {
		position:relative;
		top:1px;
}
.link-action-more .icon-more svg {
		transform: scale(0.7);
}
.link-action-more:hover  {
		opacity: 1;
}
.link-action-more:hover .link-action-wrapper {
		opacity: 1;
		pointer-events:all;
}

.link-action 		svg,
.link-action span,
.link-action div {
		pointer-events:none;
}

.link-action {
		opacity: 0.5;
		cursor: pointer;
}
.cm-hover-popup {
}
.cm-hover-popup .resource-link-ctag {
		border-radius: 7px;
		overflow:hidden;
		box-shadow: 0 0 4px rgba(0,0,0,0.3);
}

// height size iframe here
.cm-hover-popup .resource-link-ctag .iframe-view-wrapper.not-fullscreen {
	
	height: 400px!important;
}

.cm-hover-popup .resource-link-ctag .iframe-view-wrapper iframe {
		width: ${100/urlPreviewZoom}%!important;
		height: ${100/urlPreviewZoom}!important;
		max-height: ${100/urlPreviewZoom}%!important;
		transform-origin:top left;
		transform: scale(${urlPreviewZoom});
		margin-left: 15px;
}

.link-mdpreview-wrapper {

}
.link-mdpreview {
		opacity: 0.6;
		transition: 0.2s all;
		&:hover {
				opacity: 1;
		}
		line-height: 20px;
		text-decoration: none;
		color: ${cssVars.colors.main};
		// border: solid 2px ${cssVars.colors.main};
		padding: 0px 2px 0px 0px;
		cursor: pointer;
		border-radius: 5px;
		svg {
				color: ${cssVars.colors.main};
		}
}
`}