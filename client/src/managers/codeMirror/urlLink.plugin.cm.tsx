///////////////////////////////////
// URL LINK

import { isArray, random } from "lodash";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { getApi } from "../../hooks/api/api.hook";
import { isMobile } from "../device.manager";
import { ssrFn, ssrIcon  } from "../ssr.manager";
import { cssVars } from "../style/vars.style.manager";
import { genericReplacementPlugin } from "./replacements.cm";
import { mem } from "../reactRenderer.manager";
import { ssrGenCtag, ssrToggleCtag } from "../ssr/ctag.ssr";

export const generateHtmlLinkPreview = mem((matchs) => generateHtmlLinkPreviewInt(matchs))

export const linksPreviewPlugin = genericReplacementPlugin({
	pattern: regexs.externalLink3,
	replacement: (matchs: any) => {
		let resEl = document.createElement("span");
		resEl.innerHTML = generateHtmlLinkPreview(matchs)
		return resEl
		// return "woop"
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
	matchsOrUrl: string[] | string
): string => {
	// console.log("11111 gen link init");
	let matchs: any[] = []
	if (!isArray(matchsOrUrl)) {
		matchs = [...matchsOrUrl.matchAll(regexs.externalLink3)][0]
	}
	else matchs = matchsOrUrl

	let resEl = document.createElement("span");
	let fullLink = matchs[0].slice(0, -1) // removing last /
	let website = matchs[1].replace("www.", "")
	let firstSlash = matchs[3]
	let secondSlash = matchs[4]
	resEl.classList.add('link-mdpreview-wrapper')
	resEl.classList.add('link-wrapper')
	let limitChar = 17
	if (website.length > limitChar) website = website.substring(website.length - limitChar)
	let artTitle = firstSlash
	if (artTitle === "" || !artTitle) artTitle = secondSlash
	if (artTitle.length > limitChar) artTitle = artTitle.substring(0, limitChar) + ""
	artTitle = (artTitle.length !== 0) ? `${artTitle}` : ``
	let previewStr = `${website}${artTitle}`
	if (previewStr.length > limitChar) previewStr = previewStr.substring(0, limitChar)


	//
	// JS
	//
	// support
	const getIframeEl = (el) => el.parentNode.parentNode.parentNode.querySelector(".link-iframe-wrapper")

	const fetchArticle = (el: any, cb: Function) => {
		let link = el.dataset.link
		getApi(api => {
			api.ressource.fetchUrlArticle(link, r => {
				// ssrOpenIframeEl(getIframeEl(el), encodeURIComponent(r.html))
				ssrToggleCtag(getIframeEl(el), ssrGenCtag("iframe", r.html))
				cb(r)
			})
		})
	}

	// function button
	const previewFn = (el) => {
		if (!el) return
		let link = el.dataset.link
		// ssrOpenIframeEl2(getIframeEl(el), link)
		ssrToggleCtag(el, ssrGenCtag("iframe",link))
	}
	const openWinFn = (el) => {
		if (!el) return
		let link = el.dataset.link
		window.open(link, `popup-preview-link`, 'width=800,height=1000')
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
				api.ui.textToSpeechPopup.open(r.text)
			})
		})
	}

	// HTML
	let i = ssrIcon
	let openWindow = `<span title="Open link in detached window"
onclick="${ssrFn("open-win-link", openWinFn)}"
class="link-action link-openwindow"  data-link="${fullLink}">${i('up-right-from-square')}</span>`
	let openPreview = `<span
onclick="${ssrFn("preview-link", previewFn)}"
title="Preview link" class="link-openpreview link-action" data-link="${fullLink}">${i('eye')}</span>`
	let fetch = `<span
onclick="${ssrFn("fetch-link", fetchFn)}"
title="Display url content" class="link-fetcharticle link-action"  data-link="${fullLink}">${i('file-lines')}</span>`
	let audio = `<span
onclick="${ssrFn("audio-link", audioFn)}"
title="Text to speech url content" class="link-audio link-action"  data-link="${fullLink}">${i("volume-high")}</span>`
	let btns = `<span class="link-action-more"><span class="icon-more">${i("ellipsis")}</span><span class="link-action-wrapper">${fetch} ${audio} ${openWindow} ${openPreview}</span></span>`

	let iframeWrapper = `<span class="link-iframe-wrapper"></span>`
	let html = `<span class="${isMobile() ? "mobile-version" : ""} link-mdpreview-wrapper"><a href="${fullLink}" class="link-mdpreview" title="${fullLink}" target="_blank" rel="noreferrer">${i("link")}${previewStr}</a>${btns}${iframeWrapper}</span>`
	resEl.innerHTML = `${html}`;

	return resEl.outerHTML
}

export const linksPreviewMdCss = () => `
.link-fetch-preview-wrapper {
		background: grey;
}
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
		right: 10px ;
}
.mobile-version .link-action {
		transform: scale(1.3);
		padding: 7px; 
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
.link-iframe-wrapper {
}
.link-iframe-wrapper .resource-link-ctag {
		border-radius: 7px;
		overflow:hidden;
		box-shadow: 0 0 4px rgba(0,0,0,0.3);
}


.link-iframe-wrapper .resource-link-ctag iframe {
		width: 150%!important;
		height: 590px!important;
		transform-origin:top left;
			transform: scale(0.65);
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
`
