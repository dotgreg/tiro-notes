import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as fa from '@fortawesome/free-solid-svg-icons'

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

export class Icon extends React.Component<{
	name: string
	isLocal?: boolean
	color?: string
	size?: number
}, {}> {
	size = this.props.size ? this.props.size : 1
	localUrl = (this.props.isLocal) ? this.props.name : ''
	render() {
		return (
			<span style={{
				transform: `scale(${this.size})`,
				display: 'inline-block'
			}}>
				{!this.props.isLocal &&
					<FontAwesomeIcon
						icon={fa[this.props.name]}
						color={this.props.color || 'black'}
						size={'1x'}
					/>
				}
				{this.props.isLocal &&
					<span style={{
						transform: `scale(${this.size})`,
						display: 'inline-block',
						width: '20px',
						height: '20px',
						background: `url('${this.localUrl}')`,
						backgroundSize: 'contain',
						backgroundRepeat: 'no-repeat',
					}}></span>
				}
			</span>
		);
	}
} 
