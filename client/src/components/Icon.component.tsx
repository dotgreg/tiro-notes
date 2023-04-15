import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as fa from '@fortawesome/free-solid-svg-icons'
import { ssrIcon } from '../managers/ssr.manager';


export const Icon2 = (p:{name: string}) => {
	return <div className="icon-2-wrapper"
		dangerouslySetInnerHTML={{
			__html: ssrIcon(p.name)
		}}
	></div>
}

// fa.faCheckDouble 
export type IconSizeProp =
	| "xs"
	| "lg"
	| "sm"
	| "1x"
	| "2x"
	| "3x"
	| "4x"
	| "5x"
	| "6x"
	| "7x"
	| "8x"
	| "9x"
	| "10x";


class IconInt extends React.Component<{
	name: string
	color?: string
	size?: number
}, {}> {
	size = this.props.size ? this.props.size : 1
	isLocal = this.props.name.startsWith('fa') ? false : true
	render() {
		return (
			<span style={{
				transform: `scale(${this.size})`,
				display: 'inline-block'
			}}>

				{!this.isLocal &&
					// <i className={`fa-solid fa-${this.props.name}`} ></i>
					<FontAwesomeIcon
						icon={fa[this.props.name]}
						color={this.props.color || 'black'}
						size={'1x'}
					/>
				}
				{this.isLocal &&
					<span style={{
						transform: `scale(${this.size})`,
						display: 'inline-block',
						width: '20px',
						height: '20px',
						background: `url('${this.props.name}')`,
						backgroundSize: 'contain',
						backgroundRepeat: 'no-repeat',
					}}></span>
				}
			</span>
		);
	}
}

export const Icon = React.memo(IconInt, (np, pp) => {
	if (JSON.stringify(np) !== JSON.stringify(pp)) return false
	return true
})
