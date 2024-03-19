import { getApi } from "../hooks/api/api.hook"

const audioCurr:any = {obj: null}

const playAudio = (mp3Path: string, opts?:{
    cache?:boolean,
    start?:number
    time?:number
}) => {
    getApi(api => {
        let cache = opts?.cache ?? true
        let start = opts?.start  ?? 0
        let time = opts?.time ?? -1
        // start = start * 1000
        // time = time * 1000
        api.ressource.fetch(mp3Path, (content, localPath) => {
            audioCurr.obj = new Audio(localPath);
            audioCurr.obj.load();
            // if (time > 0) {
            //     audioCurr.obj.onprogress = function() {
            //         if (audioCurr.obj.currentTime >= time) {
            //           stopAudio()
            //         }
            //     }
            // }
            audioCurr.obj.play();
            // if (start) {
            //     // console.log('start', start)
            //     // audioCurr.obj.currentTime = start 
                
            // }

            // NOT WORKING!
            audioCurr.obj.onprogress = () => {
                // if (start) {
                //     if (audioCurr.obj.currentTime == 0) {
                //         audioCurr.obj.currentTime = start;
                //     }
                // }
                // if (time > 0) {
                //     if ((audioCurr.obj.currentTime + start) >= time) {
                //         stopAudio()
                //     }
                // }
              }
            console.log('[AUDIO] Playing:', localPath, "audio object in window.__tiro_audio_obj_curr__")
            // @ts-ignore
            window.__tiro_audio_obj_curr__ = audioCurr
        }, {returnsPathOnly: true, disableCache: !cache})
    })
}

const stopAudio = () => {   
    // if (audioCurr.obj) {
    audioCurr.obj.pause();
    audioCurr.obj.currentTime = 0;
    // }
}

export const audioApi = {
    play: playAudio,
    stop: stopAudio
}

export type iAudioApi = typeof audioApi