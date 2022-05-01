import React, { ReactElement, useState } from 'react';
import { css, cx } from '@emotion/css'
import { cssVars } from '../managers/style/vars.style.manager';
import { Icon } from './Icon.component';

export const ButtonsToolbar = (p: {
	class?: string
	colors?: [string, string]
	size?: number
	buttons: iToolbarButton[]
	design?: 'horizontal' | 'vertical'
}) => {
	let { design, colors, size } = { ...p }
	if (!design) design = 'horizontal'
	// let currColors = []
	// if (!p.colors) {
	//   currColors = []
	// } else {
	//   currColors = p.colors
	// }

	const customCss = css`
				button.toolbar-button {
						position: relative; 
						&.active {
								svg {
										color: ${colors ? colors[1] : cssVars.colors.main};
								}
						}
						svg {
								transform: scale(${size ? size : 1.3});
								color: ${colors ? colors[0] : cssVars.colors.editor.interfaceGrey};
								&:hover {
										color: ${colors ? colors[1] : cssVars.colors.main};
								}
						}
				}
    `

	return <div className={customCss}>
		<ul className={`buttons-toolbar-component ${p.class} ${design}`}>
			{
				p.buttons.map((button, key) =>
					button.action &&
					<li title={button.title} key={key}>
						<ToolbarButton {...button} />
					</li>
				)
			}
		</ul>
	</div>
}


export interface iToolbarButton {
	icon?: string
	title?: string
	class?: string
	customHtml?: ReactElement
	action?: Function
	active?: boolean
}

export const ToolbarButton = (p: iToolbarButton) => {
	let insideHtml = <></>
	if (p.title) insideHtml = <>{p.title}</>
	if (p.icon) insideHtml = <Icon name={p.icon} />
	if (p.customHtml) insideHtml = p.customHtml
	const classes = `toolbar-button ${p.class && p.class} ${p.active && 'active'}`

	return (
		<button
			className={classes}
			onClick={e => { p.action && p.action(e) }}
		>
			<div className="inside-html-wrapper">
				{insideHtml}
			</div>
			<div className="button-hover-popup">
				{p.title}
			</div>
		</button>
	)
}


export const ButtonsToolbarCss = `
    ul.buttons-toolbar-component {
        list-style: none;
        padding: 0px;
        margin: 0px;
        button.toolbar-button {
            ${cssVars.els.button};
            cursor: pointer;
        }
				&.vertical {
						.toolbar-button {
								display: flex;
								&:hover {
										.inside-html-wrapper {
												svg {
														color:${cssVars.colors.main};
												}
										}
										.button-hover-popup {
												color:${cssVars.colors.main};
										}
								}
								.inside-html-wrapper {
										width: 15px;
										span {
										}
								}
								.button-hover-popup {
										margin-left: 15px;
										font-weight: 400;
										font-size: 11px;
								}
						}
				}
				&.horizontal {
						display: flex;
						li {
						button {
								&:hover .button-hover-popup {
										display: block;
								}
								.button-hover-popup {
										//display: none;
										opacity: 0.2;
										position: absolute;
										bottom: 22px;
										background: ${cssVars.colors.editor.interfaceGrey};
										color: black;
										padding: 5px;
										left: 50%;
										width: max-content;
										font-size: 8px;
										border-radius: 5px;
										transform: translateX(-50%);
								}
						}
				}
    }
}
`;
