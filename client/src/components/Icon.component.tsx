import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as fa from '@fortawesome/free-solid-svg-icons'
import React from 'react'; 

// fa.faCheckDouble

export class Icon extends React.Component<{
    name: string
}, {}> {
    render() {
      return (
        <FontAwesomeIcon icon={fa[this.props.name]} />
      );
    }
  } 