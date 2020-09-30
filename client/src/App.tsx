import React from 'react';
import styled from '@emotion/styled'
import { Global, css } from '@emotion/core'

import { iSocketEventsParams, socketEvents } from '../../shared/sockets/sockets.events';
import { clientSocket, initSocketConnection } from './managers/sockets/socket.manager';
import { bindEventManagerToSocketEvents, socketEventsManager } from './managers/sockets/eventsListener.sockets';
import { iFile } from '../../shared/types.shared';


class App extends React.Component<{}, {files:iFile[]}> {

  constructor(props:any) {
      super(props)
      this.state = {
        files: []
      }
  }
  listenerIds:number[] = []

  componentDidMount() {
    initSocketConnection().then(() => {
      bindEventManagerToSocketEvents()
      
      let params:iSocketEventsParams.askForFolder = {}
      clientSocket.emit(socketEvents.askForFolder, params)  

      this.listenerIds[0] = socketEventsManager.on(
        socketEvents.getFolderFiles, 
        (data:iSocketEventsParams.getFolderFiles) => {  
          this.setState({files: data.files})
      })
    })
  }

  componentWillUnmount(){
    this.listenerIds.forEach((id) => {
      socketEventsManager.off(id)
    })
  }

  render() {
    return (
      <Wrapper>
        {
          this.state.files.map((file,i) => 
            <Item 
              key={i}
              bgImg={file.image || 'dd'}
              >
              <div className="background"></div>
              <a href={file.link} about="_BLANK">{file.name}</a>
            </Item>
          )
        }
        <Global
          styles={css`
            body {
              margin: 0;
            }
          `}
        />
      </Wrapper>
      // <div>
      //   <div>dfssdsdffsd</div>
      //   <div>dfssdsdffsd</div>
      //   <div>dfssdsdffsd</div>
      //   <div>dfssdsdffsd</div>
      //   <div>dfssdsdffsd</div>
      // </div>
    );
  }
}


export default App; //dd

const Wrapper  = styled.div`
  //width: 100vw;
  //min-height: 100vh;
  background: rgba(0,0,0,0.9);
  display: flex;
  flex-wrap: wrap;
  justify-content:center;
`

const d = {
  w: 200,
  h: 150
}
const Item  = styled.div<{bgImg?:string},{}>`
  display: block;
  position: relative;
  background-color: rgba(255,255,255,0.05);
  margin: 10px 10px 10px 0px;
  a {
    margin: 20px 10px 10px 10px;
    font-family: sans-serif;
    display: block;
    font-size: 16px;
    text-align: center;
    text-decoration: none;
    line-height: -3px;
    color: white;
    max-width: ${d.w-20}px;
  }
  .background {
    width: ${d.w}px;
    height: ${d.h}px;
    background-size: contain;
    background-repeat: no-repeat;
    
    background-position: center;
    background-image: url("${props => props.bgImg}");
  }
  
  
`