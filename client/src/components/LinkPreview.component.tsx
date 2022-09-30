import { each } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { getUrlTokenParam } from '../hooks/app/loginToken.hook';
import { getUrlPreview } from '../managers/previewUrl.manager';
import { cssVars } from '../managers/style/vars.style.manager';
import { absoluteLinkPathRoot } from '../managers/textProcessor.manager';
import { ButtonsToolbar, iToolbarButton } from './ButtonsToolbar.component';

export const LinkPreview = (p: {
	url: string
}) => {
	//
	// TOOLBAR BUTTONS
	//
	let buttons: iToolbarButton[] = [
		{
			title: 'Download',
			icon: 'faDownload',
			action: () => { }
		},
	]

	const [loadInfos, setLoadInfos] = useState(false)
	const [infos, setInfos] = useState<any>({})
	useEffect(() => {
		// console.log(5555);
		if (loadInfos) {
			// console.log(55556);
			getUrlPreview(p.url).then(infos => {
				// console.log(333, infos);
				setInfos(infos)
			})
		}
	}, [loadInfos])

	let wrapperRef = useRef<any>()
	// @ts-ignore
	window.wr = wrapperRef

	return (
		<div
			className="links-infos"
			ref={wrapperRef}
			// style={{ height: "100px" }}
			// style={{ height: wrapperRef.current?.clientHeight }}
			onMouseOver={e => { setLoadInfos(true) }}
		// className="link-preview-wrapper">
		>
			{p.url}
			{infos.title}
			{infos.description}
			{infos["og:image"]}
		</div >
	)
}

export const LinkPreviewCss = () => `

`
