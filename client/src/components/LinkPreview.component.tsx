import React, { useEffect, useRef, useState } from 'react';
import { getUrlPreview } from '../managers/previewUrl.manager';
import { iToolbarButton } from './ButtonsToolbar.component';

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
		if (loadInfos) {
			getUrlPreview(p.url).then(infos => {
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
			onMouseOver={e => { setLoadInfos(true) }}
		>
			{p.url}
			{infos.title}
		dlddl
			{infos.description}
			{infos["og:image"]}
		</div >
	)
}

export const LinkPreviewCss = () => `

`
