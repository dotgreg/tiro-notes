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
                <button value='submit' className="submit-button" onClick={e => {tts.current.goBack()}}> 
                    <Icon name= "faFastBackward" color="black"/>
                </button>
                <button value='submit' className="submit-button" onClick={e => {
                       !isPlaying ?   tts.current.play() : tts.current.pause()
                    }}> 
                    <Icon name= { !isPlaying ?  "faPlay" : "faPause"} color="black"/>
                </button>
                <button value='submit' className="submit-button" onClick={e => {tts.current.goForward()}}> 
                    <Icon name= "faFastForward" color="black"/>
                </button>
               

            </Popup>
        </StyledDiv>
    )
}

export const StyledDiv = styled.div`
    .popup-wrapper .popupContent {
        padding: 0px;
    }
    .table-wrapper {
        max-height: 50vh;
        overflow-y: auto;
        padding: 0px 20px 20px 20px;
        
        table {
            border-spacing: 0px;
            thead {
                tr {
                    th {
                        padding: 8px;
                    }
                }
            }
            tbody {
                text-align: left;
                tr {
                    cursor: pointer;
                    background: #f1f0f0;
                    &:nth-child(2n) {
                        background: none;
                    }
                    &: hover {
                        background: rgba(${cssVars.colors.mainRGB}, 0.2);
                    }
                    td {
                        padding: 8px;
                    }
                }
            }
        }
    }
`