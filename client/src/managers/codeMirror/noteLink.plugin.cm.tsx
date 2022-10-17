import { regexs } from "../../../../shared/helpers/regexs.helper";
import { genericReplacementPlugin } from "./replacements.cm";

export const noteLinkPreviewPlugin = genericReplacementPlugin({
	pattern: regexs.linklink,
	replacement: matchs => {
		let resEl = document.createElement("span");
		resEl.classList.add('note-link-mdpreview-wrapper')
		resEl.classList.add('note-link-wrapper')

		console.log(4444444444, matchs);

		// let limitChar = 20
		// let fullLink = matchs[0]
		// let website = matchs[1].replace("www.", "")
		// if (website.length > limitChar) website = website.substring(website.length - limitChar)
		// let artTitle = matchs[3]
		// if (artTitle === "" || !artTitle) artTitle = matchs[2]
		// if (artTitle.length > limitChar) artTitle = artTitle.substring(0, limitChar) + ""

		// let previewStr = ` ${website}:${artTitle}`

		// let idW = ""
		// let iconPre = `${renderToString(<Icon name="faLink" color={cssVars.colors.main} />)}`
		// let openWindow = `<span class="link-openwindow" data-link="${fullLink}">${renderToString(<Icon name="faExternalLinkAlt" />)}</span>`
		// let html = `<a href="${fullLink}" class="link-mdpreview" title="${fullLink}" target="_blank" rel="noreferrer">${iconPre} ${previewStr}</a> ${openWindow}`
		// resEl.innerHTML = `${html}`;
		resEl.innerHTML = `hello world`;
		return resEl
	}
})

export const noteLinkActionClick = (el: HTMLElement) => {
	// LINK
	if (el.classList.contains("link-openwindow")) {
		let link = el.dataset.link
		window.open(link, `popup-preview-link`, 'width=800,height=1000')
	}
	if (el.classList.contains("link-mdpreview")) {
		// @ts-ignore
		// let url = el.href
		// window.open(url, '_blank')?.focus();
	}
}

export const noteLinkPreviewMdCss = () => `
.note-link-mdpreview-wrapper {
}
`
