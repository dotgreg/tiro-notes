///////////////////////////////////
// URL LINK

import { isArray, random } from "lodash";
import React from "react";
import { renderToString } from "react-dom/server";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { Icon } from "../../components/Icon.component";
import { getApi } from "../../hooks/api/api.hook";
import { isMobile } from "../device.manager";
import { createSsrAction, ssrOnClick, ssrOpenIframe, ssrOpenPreview } from "../ssr.manager";
import { cssVars } from "../style/vars.style.manager";
import { genericReplacementPlugin } from "./replacements.cm";
import { memoize } from "lodash"

// export const linksPreviewPlugin = genericReplacementPlugin({
// 	pattern: regexs.externalLink3,
// 	// replacement: matchs => {
// 	// 	return generateHtmlLinkPreview(matchs)
// 	// }
// 	classWrap: "cm-underline"
// })

export const linksPreviewPlugin = genericReplacementPlugin({
	pattern: regexs.externalLink3,
	replacement: (matchs: any) => {
		if (isArray(matchs)) matchs = matchs[0]
		return generateHtmlLinkPreviewInt(matchs)
	}
})



// caching system
// cachedUrlLinks = () => {

// }

//
// HTML GENERATOR FUNC
//

export const generateHtmlLinkPreviewInt = (
	matchsOrUrl: string[] | string
) => {

	console.log(33333333, matchsOrUrl);

	let matchs: any[] = []
	if (!isArray(matchsOrUrl)) {
		matchs = [...matchsOrUrl.matchAll(regexs.externalLink3)][0]
	}
	else matchs = matchsOrUrl

	let resEl = document.createElement("span");
	if (matchs.length < 3) return resEl

	let fullLink = matchs[0].slice(0, -1) // removing last /
	let website = matchs[1].replace("www.", "")
	let firstSlash = matchs[3]
	let secondSlash = matchs[4]

	let linkId = `linkid${random(0, 10000000)}`
	let id = linkId
	// return resEl;

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

	let iconPre = `<span class="link-deco">${renderToString(<Icon name="faLink" color={cssVars.colors.main} />)}</span>`

	let iconMoreBtns = ``

	const audioClick = (el) => {
		console.log("hello audio ", el);
	}

	let openWindow = `<span title="Open link in detached window" class="link-action link-openwindow"  data-link="${fullLink}">${renderToString(<Icon name="faExternalLinkAlt" />)}</span>`
	let openPreview = `<span title="Preview link" class="link-openpreview link-action" data-id="${id}" data-link="${fullLink}">${renderToString(<Icon name="faEye" />)}</span>`
	let fetchArticle = `<span  title="Display url content" class="link-fetcharticle link-action" data-id="${id}" data-link="${fullLink}">${renderToString(<Icon name="faFont" />)}</span>`
	let audio = `<span onclick="${createSsrAction(this, audioClick)}" title="Text to speech url content" class="link-audio link-action" data-id="${id}" data-link="${fullLink}">${renderToString(<Icon name="faComment" />)}</span>`

	let btns = `<span class="link-action-more"><span class="icon-more">${renderToString(<Icon name="faEllipsisH" />)}</span><span class="link-action-wrapper">${fetchArticle} ${audio} ${openWindow} ${openPreview}</span></span>`


	let iframeWrapper = `<div class="${id} link-iframe-wrapper"></div>`
	let previewWrapper = `<div class="${id} link-fetch-preview-wrapper"></div>`
	let html = `<span class="${isMobile() ? "mobile-version" : ""} link-mdpreview-wrapper ${linkId}"><a href="${fullLink}" class="link-mdpreview" title="${fullLink}" target="_blank" rel="noreferrer">${iconPre}${previewStr}</a>${iconMoreBtns}${btns}${iframeWrapper}${previewWrapper}</span>`
	resEl.innerHTML = `${html}`;

	initSSRLogic(linkId)
	// setTimeout(() => { initSSRLogic() }, 1000)

	return resEl
}

export const generateHtmlLinkPreview = memoize(generateHtmlLinkPreviewInt)

//
// CLICK MANAGEMENT
//
const initSSRLogic = (id: string) => {
	console.log("init SSR button", id);

	const fetchArticle = (el: any, cb: Function) => {
		let link = el.dataset.link
		let id = el.dataset.id
		getApi(api => {
			api.ressource.fetchUrlArticle(link, r => {
				ssrOpenPreview(`.${id}.link-iframe-wrapper`, r.html)
				cb(r)
			})
		})
	}

	setTimeout(() => {
		ssrOnClick(`.${id} .link-openwindow`, el => {
			if (!el) return
			let link = el.dataset.link
			window.open(link, `popup-preview-link`, 'width=800,height=1000')
		})
		ssrOnClick(`.${id} .link-openpreview`, el => {
			if (!el) return
			let link = el.dataset.link
			let id = el.dataset.id
			ssrOpenIframe(`.${id}.link-iframe-wrapper`, link)
		})
		ssrOnClick(`.${id} .link-fetcharticle`, el => {
			if (!el) return
			fetchArticle(el, () => { })
		})
		// ssrOnClick(`.${id} .link-audio`, el => {
		// 	if (!el) return
		// 	fetchArticle(el, r => {
		// 		console.log(r.content);
		// 		if (!r.text) return;
		// 		getApi(api => {
		// 			api.ui.textToSpeechPopup.open(r.text)
		// 		})
		// 	})
		// })
	}, 100)
}

// OLD
// export const linkActionClick = (el: HTMLElement) => {
// 	// LINK
// 	if (el.classList.contains("link-openwindow")) {
// 		let link = el.dataset.link
// 		window.open(link, `popup-preview-link`, 'width=800,height=1000')
// 	}
// 	if (el.classList.contains("link-mdpreview")) {
// 		// @ts-ignore
// 		// let url = el.href
// 		// window.open(url, '_blank')?.focus();
// 	}
// }

// export const linksPreviewMdSimpleCss = () => `
export const linksPreviewMdCss = () => `
.link-fetch-preview-wrapper {
		background: grey;

}
.link-mdpreview-wrapper {
		position: relative;
}
.link-mdpreview-wrapper .link-action {
}
.link-fetch-preview-wrapper {
		display: none;
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
		display: none;
}
.link-iframe-wrapper.open {
		display: block;
		height: 330px!important;
}
.link-iframe-wrapper iframe {
		border-radius: 7px;
		overflow:hidden;
		box-shadow: 0 0 4px rgba(0,0,0,0.3);
		width: 150%!important;
		transform-origin:top left;
		transform: scale(0.65);
		height: 500px!important;
}
.link-iframe-wrapper.big{
		height: 600px!important;
}
.link-iframe-wrapper.big iframe{
		height: 900px!important;
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
