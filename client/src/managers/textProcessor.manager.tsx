import React from 'react';
import { sharedConfig } from '../../../shared/shared.config'
import { regexs } from '../../../shared/helpers/regexs.helper';
import { replaceAll } from './string.manager';
import { getBackendUrl } from './sockets/socket.manager';
import { replaceRegexInMd } from './markdown.manager';
import { getUrlTokenParam } from '../hooks/app/loginToken.hook';
import { iFile } from '../../../shared/types.shared';
import { findImagesFromContent } from './images.manager';
import { RessourcePreview } from '../components/RessourcePreview.component';
import { renderToString } from 'react-dom/server';
import { generateNoteLink } from './codeMirror/noteLink.plugin.cm';
import { each } from 'lodash';
import { generateHtmlLinkPreview } from './codeMirror/urlLink.plugin.cm';
import { mem } from './reactRenderer.manager';

export const transformUrlInLinks = (bodyRaw: string): string => {
	// return bodyRaw
	return replaceRegexInMd(bodyRaw, regexs.externalLink3, found => {
		return generateHtmlLinkPreview(found)
		// return "woop"
	});
}


export const transformTitleSearchLinks = (
	windowId: string,
	bodyRaw: string
): string => {
	const subst = generateNoteLink("$1", "$2", windowId)
	return bodyRaw.replace(regexs.linklink, subst);
}





export const transformSearchLinks = (bodyRaw: string): string => {
	const subst = `<a class="search-link preview-link" href="javascript:window.tiroCli.triggerSearch.func('$1$2');">$1</a>`;
	let body = bodyRaw.replace(regexs.searchlink, subst);
	body = replaceAll(body, [
		['>[__id_', '>['],
		['>[__tags_', '>['],
		['>[__tag_', '>['],
		[' ]</a>', ']</a>'],
	])
	return body
}

export const absoluteLinkPathRoot = (currentFolderPath: string) => {
	const cleanedPath = currentFolderPath.replace(`${getBackendUrl()}/${sharedConfig.path.staticResources}/`, '')
	const internalUrl = `${getBackendUrl()}/${sharedConfig.path.staticResources}/${cleanedPath}`
	const res = currentFolderPath.startsWith('http') ? currentFolderPath : internalUrl
	return res
}



let ressCompoHtml = mem((input, file) => {
	return renderToString(<RessourcePreview markdownTag={input} file={file} />)
})
export const transformRessourcesInHTML = (file: iFile, bodyRaw: string): string => {
	let i = 0
	let res2 = replaceRegexInMd(bodyRaw, regexs.ressource, (input: string) => {
		i++;
		let idEl = `${input}-${i}`

		// console.log(444444444, compoHtml);

		let subst = `${ressCompoHtml(input, file)} `;
		return subst
	});
	return res2;
};

export const transformImagesInHTML = (file: iFile, bodyRaw: string): string => {
	let counterIndex = 0
	const imgs = findImagesFromContent(bodyRaw, file)
	if (imgs.length === 0) return bodyRaw
	const imgsArr = encodeURIComponent(JSON.stringify(imgs))
	return replaceRegexInMd(bodyRaw, regexs.image, (input: string) => {
		const link = input.split('](')[1].slice(0, -1);
		let widthRaw = input.match(/w_([0-9]+)/)
		let rotateRaw = input.match(/r_([0-9]+)/)
		let width = widthRaw ? `width: ${widthRaw[1]}px;` : ''
		let rotate = rotateRaw ? `transform:rotate(${rotateRaw[1]}deg);` : ''
		const configCss = `max-width: 100%; ${width} ${rotate} `
		// console.log(407, input, link, name);
		const subst = `<div class="content-image" data-images=${imgsArr} data-index="${counterIndex}"><img class="content-image-img"  style="${configCss}" src="${absoluteLinkPathRoot(file.folder)}/${link}${getUrlTokenParam()}"  /></div>`;
		counterIndex++
		return subst
	});
}


export const escapeHtml = (rawString: string): string => {
	return rawString
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}


export const unescapeHtml = (rawString: string): string => {
	return rawString
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#039;/g, "'");
}


const getLongestString = (str: string): string => {
	// let res = str.replaceAll("-", "")
	let r1 = str.split(`'`)
	let r2: string[] = []
	each(r1, r => {
		let rt = r.split(`"`)
		each(rt, rt1 => {
			r2.push(rt1)
		})
	})

	let longest = ""
	each(r2, rt2 => {
		if (rt2.length >= longest.length) longest = rt2
	})

	return longest

}

export const cleanSearchString = (inp: string): string => {
	let res = inp
	res = res.replaceAll("#", "")
	res = res.replaceAll("-", "")

	// res = res.replaceAll(`"`, `\\"`)
	// res = res.replaceAll(`"`, `"`)

	res = res.trim()


	res = getLongestString(res)
	// split from " and ' and take the longest string
	// res.split("'")

	return res
}
