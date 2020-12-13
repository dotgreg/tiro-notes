import React from 'react';
import styled from '@emotion/styled'
import { clientSocket } from '../managers/sockets/socket.manager';
import { iUploadedFile } from '../managers/editor.manager';
// const marked = require('marked');
var siofu = require("socketio-file-upload");




export class UploadZone extends React.Component<{}, {
    uploadedFiles:iUploadedFile[]
}> {

    zoneEl:any
    constructor(props:any) {
        super(props)
        this.state = {
            uploadedFiles:[]
        }
        this.zoneEl = React.createRef()
    }

    componentDidMount () {
        var instance = new siofu(clientSocket);
        console.log({instance});
        console.log(this.zoneEl);
        instance.listenOnInput(this.zoneEl.current);
        instance.listenOnDrop(this.zoneEl.current);
    }

    render() {
      return (
        <StyledWrapper>
          <div ref={this.zoneEl} className="upload-wrapper">
              UPLOAD DRAG DROP HERE
              <ul>
                  {
                    this.state.uploadedFiles.map(file => 
                        <li><input type="text" value={`[${file.name}](${file.path})`} /></li>    
                    )
                  }
              </ul>
        </div>
        </StyledWrapper>
      ); 
    }
  }
  
  const StyledWrapper  = styled.div`
  
    .upload-wrapper {
        width: 100%;
        height: 200px;
        background: rgba(0,0,0,0.1);
    }
  `