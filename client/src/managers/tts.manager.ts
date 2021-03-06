import { OptionObj } from "../components/Input.component"
import { md2html } from "./markdown.manager"
import { regexs } from '../../../shared/helpers/regexs.helper';

export const cleanText2Speech = (rawText: string) => {
	let text2read = rawText
	text2read = text2read.replace(regexs.ressource, '')
	text2read = text2read.replace(regexs.ref, '')
	text2read = md2html(text2read)
	console.log('222', text2read);
	text2read = text2read.replace(regexs.baliseHtml, '')
	console.log('cleanText2Speech', text2read);
	return text2read
}

export const removeTextLineJumps = (raw: string): string => {
	return raw.replace(/(\r\n\r\n|\n\n|\r\r|\n)/gm, ".");
}

export const getAvailableVoices = () => {
	let newvoices: OptionObj[] = []
	window.speechSynthesis.getVoices().forEach(function(voice, i) {
		console.log(voice);
		const lang = voice.lang ? ` (${voice.lang})` : ''
		const label = `${voice.name}${lang}`
		newvoices.push({ key: i, label, obj: voice })
	});
	return newvoices
}

export class Text2SpeechManager {
	rawText: string
	voice: any
	text2read: string
	chunkedText: string[]

	chunkLength: number = 160
	currChunkId: number = 0
	currSpeechObj: any

	isLoaded: boolean = false
	shouldStop: boolean = false

	constructor(p: {
		text: string
	}) {
		this.rawText = p.text
		this.text2read = cleanText2Speech(p.text)
		this.chunkedText = this.chunkText(this.text2read)
		console.log(`[TTS] init new manager `, { p, text: this.chunkedText, length: this.chunkedText.length });
	}

	chunkText = (text2chunk: string): string[] => {
		// 1 remove spaces
		text2chunk = removeTextLineJumps(text2chunk)

		// 2 split by sentences
		let sentences = text2chunk.split(/[.!?]+/)

		// 3 reduce again if sentences too long
		let chunks: string[] = []
		for (let i = 0; i < sentences.length; i++) {
			const sentence = sentences[i];
			if (sentence.length > this.chunkLength) {
				// subchunks from words
				let words = sentence.split(' ')
				let newSentence = ''
				for (let y = 0; y < words.length; y++) {
					newSentence += words[y] + ' '


					if (newSentence.length > this.chunkLength || y === words.length - 1) {
						// console.log( 'PUSH', newSentence);
						chunks.push(newSentence)
						newSentence = ''
					}
				}
				// let substrs:any = sentence.match(new RegExp(`.{1,${this.chunkLength}}`,'g'))
				// if (substrs) {
				//     for (let y = 0; y < substrs.length; y++) {
				//         chunks.push(substrs[y])
				//     }
				// }
			} else {
				chunks.push(sentence)
			}
		}
		console.log(chunks);

		return chunks
		// let pattRegex = new RegExp('^[\\s\\S]{' + Math.floor(this.chunkLength / 2) + ',' + this.chunkLength + '}[.!?,]{1}|^[\\s\\S]{1,' + this.chunkLength + '}$|^[\\s\\S]{1,' + this.chunkLength + '} ', 'gm');
		// return text2chunk.match(pattRegex) || [];
	}

	loadVoice = (voice) => {
		console.log(`[TTS] LOAD VOICE`, voice);
		this.voice = voice
	}

	play = () => {

		if (!this.isLoaded) {

			if (this.currChunkId > this.chunkedText.length - 1) return console.log(`[TTS] finished played`)

			this.isLoaded = true
			console.log(`[TTS] START play chunk ${this.currChunkId}`, { txt: this.chunkedText[this.currChunkId] });
			this.currSpeechObj = new SpeechSynthesisUtterance();
			this.currSpeechObj.text = this.chunkedText[this.currChunkId]
			if (this.voice) this.currSpeechObj.voice = this.voice

			// apparently important to keep that console.log...
			console.log(this.currSpeechObj);

			setTimeout(() => {
				window.speechSynthesis.speak(this.currSpeechObj);
			}, 0);

			this.currSpeechObj.addEventListener('end', () => {
				this.isLoaded = false
				console.log(`[TTS] END play chunk ${this.currChunkId}`);
				if (!this.shouldStop) {
					this.currChunkId += 1
					this.play()
				} else {
					this.shouldStop = false
				}
			})

		} else {

			console.log(`[TTS] RESUME play chunk ${this.currChunkId}`);
			window.speechSynthesis.resume();

		}

	}

	isPlaying = (): boolean => {
		let res = window.speechSynthesis.speaking
		if (res) res = !window.speechSynthesis.paused
		return res;
	}

	pause = () => {
		console.log('[TTS] pause');
		window.speechSynthesis.pause();
	}

	stop = () => {
		console.log('[TTS] stop');
		this.shouldStop = true
		this.isLoaded = false
		window.speechSynthesis.cancel();
	}

	goToChunk = (chunkNb: number) => {
		console.log('[TTS] goToChunk', chunkNb);
		if (chunkNb <= 0 || chunkNb > this.chunkedText.length - 1) return
		this.stop()
		this.currChunkId = chunkNb
		this.play()
	}

	goBack = () => {
		console.log('[TTS] goBack', this.currChunkId);
		this.goToChunk(this.currChunkId - 1)
	}
	goForward = () => {
		console.log('[TTS] goForward', this.currChunkId);
		this.goToChunk(this.currChunkId + 1)
	}

}


