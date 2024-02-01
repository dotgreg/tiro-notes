import React from 'react';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// import * as fa from '@fortawesome/free-solid-svg-icons'
import { ssrIcon } from '../managers/ssr.manager';

 
export const Icon2 = (p:{name: string, label?:string, size?: number, color?:string}) => {
	// if name starts with fa, remove it and lowercase name
	let name = p.name
	// if ends width .svg, .png, .jpg, it is local
	let isLocal = name.endsWith('.svg') || name.endsWith('.png') || name.endsWith('.jpg')
	
	let size = p.size ? p.size : 1
	size -= 0.2
	// if (name.startsWith('fa')) size += 0.2

	if (name.startsWith('fa')) name = name.substr(2)
	// if first letter is uppercase, lowercase it
	if (name[0] === name[0].toUpperCase()) name = name[0].toLowerCase() + name.substr(1)
	
	// if uppercases letters exists, replace it with - and lowercase
	name = name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
	

	return  <span style={{
				transform: `scale(${size})`,
				display: 'inline-block'
			}}>
		{
			!isLocal &&
			<span className="icon-2-wrapper icon-wrapper"
				title={p.label}
				dangerouslySetInnerHTML={{
					__html: ssrIcon(name)
				}}
				style={{ color: p.color || "#797979"}}
			></span>
		}
		
		{
			isLocal &&
			<span style={{
				transform: `scale(${p.size})`,
				display: 'inline-block',
				width: '20px',
				height: '20px',
				background: `url('${p.name}')`,
				backgroundSize: 'contain',
				backgroundRepeat: 'no-repeat',
			}}></span>
		}
	</span>
}

export const IconCss = () => `
	.icon-wrapper{
		display: inline-block;
	}
`

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


// class IconInt extends React.Component<{
// 	name: string
// 	color?: string
// 	size?: number
// }, {}> {
// 	size = this.props.size ? this.props.size : 1
// 	isLocal = this.props.name.startsWith('fa') ? false : true
// 	render() {
// 		return (
// 			<span style={{
// 				transform: `scale(${this.size})`,
// 				display: 'inline-block'
// 			}}>

// 				{!this.isLocal &&
// 					// <i className={`fa-solid fa-${this.props.name}`} ></i>
// 					<FontAwesomeIcon
// 						icon={fa[this.props.name]}
// 						color={this.props.color || 'black'}
// 						size={'1x'}
// 					/>
// 				}
// 				{this.isLocal &&
// 					<span style={{
// 						transform: `scale(${this.size})`,
// 						display: 'inline-block',
// 						width: '20px',
// 						height: '20px',
// 						background: `url('${this.props.name}')`,
// 						backgroundSize: 'contain',
// 						backgroundRepeat: 'no-repeat',
// 					}}></span>
// 				}
// 			</span>
// 		);
// 	}
// }

export const Icon = React.memo(Icon2, (np, pp) => {
	if (JSON.stringify(np) !== JSON.stringify(pp)) return false
	return true
})
