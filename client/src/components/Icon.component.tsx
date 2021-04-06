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
    color?: string
    size?: IconSizeProp
}, {}> {
    render() {
      return (
        <FontAwesomeIcon 
          icon={fa[this.props.name]} 
          color={this.props.color || 'black'}
          size={this.props.size || '1x'}
        />
      );
    }
  } 