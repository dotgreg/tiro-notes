import React, { ReactElement, useEffect, useMemo, useState } from "react"
import { cssVars } from "../managers/style/vars.style.manager"
import { Icon } from "./Icon.component"

interface iDropdownP {
	hover?: boolean
	children?: JSX.Element
	footer?: ReactElement
	dir?: 'left' | 'right'
	maxHeight?: number
}

export const Dropdown = (p: iDropdownP) => {
	// const DropdownInt = (p: iDropdownP) => {
	const dir = p.dir ? p.dir : 'left'
	const maxHeight = p.maxHeight ? p.maxHeight : 50

	console.log(22222222222);

	return (
		<div className={`dropdown-wrapper ${dir} ${p.hover ? 'hover-active' : ''}`}>
			<span
				onMouseEnter={() => {
				}}
				onClick={() => {
				}}
				className="context-menu-wrapper" >
				<div className="dropdown-icon">
					<Icon name="faEllipsisH" color={cssVars.colors.l1.font} />
				</div>
				<div className="context-menu" style={{ maxHeight }}>
					{p.children}
				</div>
			</span>
		</div>
	)
}

//seems working fine
// export const Dropdown = (p: iDropdownP) => {
// 	return useMemo(() => {
// 		return <DropdownInt {...p} />
// 	}, [
// 	])
// }

export const dropdownCss = () => `
.dropdown-wrapper {
		
		position: relative;
		&.hover-active:hover {
				.context-menu {
						opacity: 1;
						pointer-events: all;
				}
				.dropdown-icon {
						svg {
								color: ${cssVars.colors.main};
						}
				}
		}

		.dropdown-icon {
				position: absolute;
				padding: 10px;
				top: -10px;
				svg {
						color: #d4d1d1;
				}
		}

		.context-menu {
				overflow-y: scroll;
				z-index: 100;
				right: 10px;
				top: 20px;
				pointer-events: none;


				transition: 0.2s all;
				transition-delay: 0.2s, 0s;
				position: absolute;
				opacity: 0;

				min-width: 140px;
				padding: 10px;
				border-radius: 5px;
				background: white;
				box-shadow: 0px 0px 5px rgba(0,0,0,.2);
		}	

		&.right {
				.dropdown-icon {
						right: 0px;
				}
		}
}
`//css
