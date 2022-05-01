import React, { ReactElement, useState } from "react"
import { cssVars } from "../managers/style/vars.style.manager"
import { Icon } from "./Icon.component"

export const Dropdown = (p: {
	hover?: boolean
	children?: JSX.Element
	footer?: ReactElement
	dir?: 'left' | 'right'
}) => {
	const [isMenuOpened, setIsMenuOpened] = useState(false)
	const dir = p.dir ? p.dir : 'left'

	return (
		<div className={`dropdown-wrapper ${dir} ${p.hover ? 'hover-active' : ''}`}>
			<span
				onMouseEnter={() => {
				}}
				onClick={() => {
					setIsMenuOpened(!isMenuOpened)
				}}
				className="context-menu-wrapper">
				<div className="dropdown-icon">
					<Icon name="faEllipsisH" color={cssVars.colors.l1.font} />
				</div>
				<div className="context-menu">
					{p.children}
				</div>
			</span>
		</div>
	)
}

export const dropdownCss = `
		.dropdown-wrapper {
				position: relative;
				&.hover-active:hover {
						.context-menu {
								display: block
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
						z-index: 100;
						right: 0px;
						top: 20px;


						position: absolute;
						//display: none;
						min-width: 180px;
						padding: 10px;
						border-radius: 5px;
						background: white;
						box-shadow: 0px 0px 5px rgba(0,0,0,.2);
				}	

				&.right {
						.dropdown-icon {
								right: -10px;
						}
				}
		}
`
