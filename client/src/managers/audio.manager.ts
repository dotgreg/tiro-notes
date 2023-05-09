import { getApi } from "../hooks/api/api.hook"

const audioCurr:any = {obj: null}

const playAudio = (mp3Path: string) => {
    getApi(api => {
        api.ressource.fetch(mp3Path, (content, localPath) => {
            audioCurr.obj = new Audio(localPath);
            audioCurr.obj.play();
        }, {returnsPathOnly: true})
    })
}

const stopAudio = () => {   
    if (audioCurr.obj) {
        audioCurr.obj.pause();
        audioCurr.obj.currentTime = 0;
    }
}

export const audioApi = {
    play: playAudio,
    stop: stopAudio
}

export type iAudioApi = typeof audioApi