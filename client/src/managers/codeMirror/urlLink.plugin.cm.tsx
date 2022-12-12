///////////////////////////////////
// URL LINK

import { random } from "lodash";
import React from "react";
import { renderToString } from "react-dom/server";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { Icon } from "../../components/Icon.component";
import { LinkPreviewCss } from "../../components/LinkPreview.component";
import { ssrOnClick, ssrOpenIframe } from "../ssr.manager";
import { safeString, textToId } from "../string.manager";
import { cssVars } from "../style/vars.style.manager";
import { genericReplacementPlugin } from "./replacements.cm";

let inc = 0

export const linksPreviewPlugin = genericReplacementPlugin({
	pattern: regexs.externalLink3,
	replacement: matchs => {
		let resEl = document.createElement("span");
		let linkId = `linkid${random(0, 10000000)}`


		let fullLink = matchs[0].slice(0, -1) // removing last /
		let website = matchs[1].replace("www.", "")
		let firstSlash = matchs[3]
		let secondSlash = matchs[4]
		// let id = safeString(fullLink).substring(0, 30) + "" + fullLink.length + "" + inc
		let id = linkId

		// return resEl;
		resEl.classList.add('link-mdpreview-wrapper')
		resEl.classList.add('link-wrapper')

		let limitChar = 20
		if (website.length > limitChar) website = website.substring(website.length - limitChar)
		let artTitle = firstSlash
		if (artTitle === "" || !artTitle) artTitle = secondSlash
		if (artTitle.length > limitChar) artTitle = artTitle.substring(0, limitChar) + ""

		artTitle = (artTitle.length !== 0) ? `${artTitle}` : ``

		let previewStr = `${website}${artTitle}`
		let iconPre = `${renderToString(<Icon name="faLink" color={cssVars.colors.main} />)}`
		let openWindow = `<span class="link-action link-openwindow"  data-link="${fullLink}">${renderToString(<Icon name="faExternalLinkAlt" />)}</span>`
		let openPreview = `<span class="link-openpreview link-action" data-id="${id}" data-link="${fullLink}">${renderToString(<Icon name="faEye" />)}</span>`
		let iframeWrapper = `<div class="${id} link-iframe-wrapper"></div>`
		let html = `<span class="link-mdpreview-wrapper ${linkId}"><a href="${fullLink}" class="link-mdpreview" title="${fullLink}" target="_blank" rel="noreferrer">${iconPre} ${previewStr}</a> ${openWindow} ${openPreview} ${iframeWrapper}</span>`
		resEl.innerHTML = `${html}`;

		initSSRLogic(linkId)
		// setTimeout(() => { initSSRLogic() }, 1000)

		return resEl
	}
})


//
// CLICK MANAGEMENT
//
const initSSRLogic = (id: string) => {
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

export const linksPreviewMdCss = () => `
.link-mdpreview-wrapper {
		position: relative;
		&:hover {
				.link-action,
				.links-infos {
						opacity: 1;
						pointer-events: all;
				}
				.link-action {
						opacity: 0.1
				}
		}

		.link-action {
				cursor: pointer;
				position: relative;
				right: 6px;
				top: 0px;
				opacity: 0;
				transition: 0.2s all;
				pointer-events: none;
				svg, span, div {
						pointer-events:none;
				}
		}

		.links-infos {
				transition: 0.2s all;
				transition-delay: 1s;
				position: absolute;
				bottom: -50px;
				opacity: 0;
				pointer-events: none;
				background: white;
				border-radius: 5px;
				padding: 8px;
				box-shadow: 0 0 5px rgba(0,0,0,0.4);
				${LinkPreviewCss()}
				font-size: 8px;


		}
		.link-iframe-wrapper.open {
				height: 330px!important;
				// background: red;
		}
.link-iframe-wrapper iframe {
				border-radius: 7px;
				overflow:hidden;
				box-shadow: 0 0 4px rgba(0,0,0,0.3);
				width: 150%!important;
				transform-origin:top left;
				transform: scale(0.65);
				height: 500px!important;
				// background: orange;
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
				padding: 0px 6px;
				cursor: pointer;
				border-radius: 5px;
				svg {
						color: ${cssVars.colors.main};
				}
		}
}
`


