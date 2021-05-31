import styled from '@emotion/styled';
import React, { useEffect, useRef, useState } from 'react';
import { useInterval } from '../hooks/interval.hook';
import { useLocalStorage } from '../hooks/useLocalStorage.hook';
import { strings } from "../managers/strings.manager";
import { cssVars } from "../managers/style/vars.style.manager";
import { getAvailableVoices, Text2SpeechManager } from '../managers/tts.manager';
import { Icon } from './Icon.component';
import { Input, OptionObj } from './Input.component';
import { Popup } from './Popup.component';

export const TtsPopup = (p:{
    fileContent: string
    onClose: Function
}) => {
    
    const [isPlaying, setIsPlaying] = useState(false)
    const [selectedVoiceId, setSelectedVoiceId] = useLocalStorage<number>('tts-selected-voice', 0)
    const [currChunk, setCurrChunk] = useState(0)
    const [totChunks, setTotChunks] = useState(0)

    const tts = useRef<any>()

    useEffect(() => {
        setTimeout(() => {
            if (getAvailableVoices()[selectedVoiceId]) {
                console.log('2voice loaded', selectedVoiceId);
                tts.current.loadVoice(getAvailableVoices()[selectedVoiceId].obj)
            }
        })
        tts.current = new Text2SpeechManager({text: p.fileContent})
    }, [])
    
    useEffect(() => {
        if (getAvailableVoices()[selectedVoiceId]) {
            console.log('voice loaded', selectedVoiceId);
            tts.current.loadVoice(getAvailableVoices()[selectedVoiceId].obj)
        }
    }, [selectedVoiceId])

    useInterval(() => {
        setIsPlaying(tts.current.isPlaying())
        setCurrChunk(tts.current.currChunkId)
        setTotChunks(tts.current.chunkedText.length)
      }, 500)

    return (
        <StyledDiv>
            <Popup
                title={`${strings.ttsPopup.title}`}
                onClose={() => {
                   tts.current.stop()
                    p.onClose()
                }}
            >
                <Input
                    value={selectedVoiceId}
                    type='select'
                    list={getAvailableVoices()}
                    label={strings.ttsPopup.voice}
                    onSelectChange={id => {
                        setSelectedVoiceId(parseInt(id))
                    }}
                />
                {currChunk} / {totChunks}
                <br/>

                <input type="range" defaultValue={currChunk} min="0" max={totChunks} 
                    onChange={e => {
                        console.log(e.target.value);
                        tts.current.goToChunk(parseInt(e.target.value))
                    }}>
                </input>
                <input type="number" defaultValue={currChunk} min="0" max={totChunks} 
                    onChange={e => {
                        console.log(e.target.value);
                        tts.current.goToChunk(parseInt(e.target.value))
                    }}>
                </input>
                <br/>
                
                <div className="buttons">
                    <button onClick={e => {tts.current.goBack()}}> 
                        <Icon name= "faFastBackward" color="black"/>
                    </button>
                    <button onClick={e => {
                        !isPlaying ?   tts.current.play() : tts.current.pause()
                        }}> 
                        <Icon name= { !isPlaying ?  "faPlay" : "faPause"} color="black"/>
                    </button>
                    <button onClick={e => {tts.current.goForward()}}> 
                        <Icon name= "faFastForward" color="black"/>
                    </button>
                </div>
               

            </Popup>
        </StyledDiv>
    )
}

export const StyledDiv = styled.div`
    .popup-wrapper .popupContent {
        padding: 20px;
    }
    .buttons {
        display: flex;
        padding: 20px 0px 0px 0px;
        button {
            width: 30%;
            padding: 10px;
        }
    }
`