import { sharedConfig } from '../../../shared/shared.config'
import { getCustomMdTagRegex, regexs } from '../../../shared/helpers/regexs.helper';
import { replaceAll } from './string.manager';
import { getBackendUrl } from './sockets/socket.manager';
import { replaceRegexInMd } from './markdown.manager';
import { getLoginToken } from '../hooks/app/loginToken.hook';
import { iFile } from '../../../shared/types.shared';
import { findImagesFromContent } from './images.manager';

export const transformUrlInLinks = (bodyRaw: string): string => {
	const codeOpenPopup = `onclick="window.open('$1','$1','width=600,height=600');"`
	const subst = `<a class="external-link preview-link" href="#" ${codeOpenPopup}>$2</a>`;
	return bodyRaw.replace(regexs.url2transform, subst);
}

export const transformTitleSearchLinks = (
	windowId: string,
	bodyRaw: string
): string => {
	//const subst = `<a class="title-search-link preview-link" href="javascript:window.tiroCli.searchFileFromTitle.func('$1','$2');">$1</a>`;
	const subst = `<a class="title-search-link preview-link" data-file="$1" data-folder="$2" data-windowid="${windowId}">$1</a>`;
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

export const getUrlTokenParam = (): string => {
	return `?token=${getLoginToken()}`
}

//  @TODO
// add folderPath that ./.resources/image.jpg becomes localhost:8082/dir1/dir2/dir3/.resources/image.jpg
export const transformRessourcesInHTML = (currentFolderPath: string, bodyRaw: string): string => {

	// 1. check pdf links and open them as iframe by default

	// 	let res1 = replaceRegexInMd(bodyRaw, regexs.ressource, (input: string) => {
	// 		const link = input.split('](')[1].slice(0, -1);
	// 		const name = input.split('](')[0].replace('![', '');
	// 		let t1 = link.split('.');
	// 		let filetype = t1[t1.length - 1];
	// 		if (filetype === '7z') filetype = 'd7z';
	// 		const ressLink = `${absoluteLinkPathRoot(currentFolderPath)}/${link}${getUrlTokenParam()}`
	// 		const codeOpenPopup = `onclick="window.open('${ressLink}','popupdl','width=800,height=1000');"`
	// 		const subst = `
	// <div class="resource-link-wrapper">
	// <div class="resource-link-icon ${filetype}"></div>
	// <a class="resource-link preview-link" href="#" ${codeOpenPopup}>${name} (${filetype})</a>
	// </div>`;
	// 		return subst
	// 	});


	// 2. create rest
	let res2 = replaceRegexInMd(bodyRaw, regexs.ressource, (input: string) => {
		const link = input.split('](')[1].slice(0, -1);
		const name = input.split('](')[0].replace('![', '');
		let t1 = link.split('.');
		let filetype = t1[t1.length - 1];
		if (filetype === '7z') filetype = 'd7z';
		let htmlAdded = ''

		const ressLink = `${absoluteLinkPathRoot(currentFolderPath)}/${link}${getUrlTokenParam()}`

		const shouldBeOpen = name.includes('|open')
		let subst = ''

		if (shouldBeOpen) {
			subst =
				`
<div class="iframe-ressource-wrapper">
	<iframe src="${ressLink}" style="width: 100%; height:500px; border: none;"></iframe>
</div>
`
		} else {

			subst = `<div class="resource-link-wrapper">
	<div class="resource-link-icon ${filetype}"></div>
	<a class="resource-link preview-link"
		href="${ressLink}"
		download="wppp-${name}.${filetype}"
	>
		${name} (${filetype})
	</a>
</div>`;
		}


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
		// const name = input.split('](')[0].replace('![', '');
		const configCss = `
        width: $1px;
        max-width: 100%;
        // min-height: $1px;
        transform: rotate($2deg);
    `
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


