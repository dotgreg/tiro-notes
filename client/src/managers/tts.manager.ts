import { OptionObj } from "../components/Input.component"
import { md2html } from "./markdown.manager"
import { regexs } from '../../../shared/helpers/regexs.helper';
import { each, debounce } from "lodash-es";
import { userSettingsSync } from "../hooks/useUserSettings.hook";

export const cleanText2Speech = (rawText: string) => {
	let text2read = rawText
	text2read = text2read.replace(regexs.ressource, '')
	text2read = text2read.replace(regexs.ref, '')
	text2read = text2read.replace(regexs.baliseHtml, '')
	text2read = text2read.replace(/<[^>]*>?/gm, ' '); // remove html tags
	text2read = text2read.replace(/((&lt;!--).+?(--&gt;))/gm, ' '); // remove html comments
	text2read = text2read.replace(/(<!--).+?(-->)/gm, ' '); // remove html comments
	text2read = text2read.replace(/(\r\n|\n|\r|\t)/gm, " "); // \n \r jumps
	text2read = text2read.replace(/(\r\n|\n|\r|\t)/gm, " "); // \n \r jumps
	// clean all special chars starting by \ 
	text2read = text2read.replace(/\\./gm, " "); 
	// replace double spaces by simple spaces 
	text2read = text2read.replace(/  +/g, ' ');
	// replace \t by space 
	text2read = text2read.trim()
	// replace ' by \'
	// text2read = text2read.replace(/'/g, "\\'");
	// replace ’'" by space
	text2read = text2read.replace(/[^a-zA-Z0-9’\-\_\—\\\/"àâäèéêëîïôœùûüÿçÀÂÄÈÉÊËÎÏÔŒÙÛÜŸÇ"'«»\s\.,;:!?]/g, ' ');
	text2read = text2read.replace(/’|"|'/g, "’");
	// remove everything not a-A-Z0-9 + accents + spaces + punctation to space
	
	return text2read
}

/** One TTS engine backend: name | maxWordsPerPart | command.
 *  maxWords = max words per audio part: the part is closed BEFORE the
 *  sentence that would exceed the cap (the cap is never exceeded). A single
 *  sentence longer than the cap is split by words. -1 → WHOLE text, one part.
 *  hasOwnMaxWords = true when the engine line defines its max words ("name | N | cmd")
 *  → the word cap is the ONLY part-size rule (tts_sentences_per_part is ignored).
 *  false = legacy single-command line using the global fallback. */
export interface TtsEngine {
	name: string
	maxWords: number
	hasOwnMaxWords: boolean
	command: string
}

/** Parse the `tts_custom_engine_command` setting: one engine per line
 *  `name | maxWordsPerPart (-1 = whole text) | command`. The command part
 *  may itself contain " | " (the parts are joined back). Lines without a
 *  " | " separator are a legacy single command → one engine, global max words. */
export const parseTtsEngines = (raw: string | undefined, fallbackMaxWords: number): TtsEngine[] => {
	const res: TtsEngine[] = []
	const lines = (raw || '').split('\n').map(l => l.trim()).filter(l => l.length > 0)
	for (let i = 0; i < lines.length; i++) {
		const parts = lines[i].split(' | ')
		if (parts.length >= 3) {
			const maxWords = parseInt(parts[1])
			res.push({
				name: parts[0].trim() || (res.length === 0 ? 'default' : `engine ${i + 1}`),
				maxWords: isNaN(maxWords) ? fallbackMaxWords : maxWords,
				hasOwnMaxWords: true,
				command: parts.slice(2).join(' | ').trim(),
			})
		} else {
			res.push({
				name: res.length === 0 ? 'default' : `engine ${i + 1}`,
				maxWords: fallbackMaxWords,
				hasOwnMaxWords: false,
				command: lines[i],
			})
		}
	}
	return res
}

export const removeTextLineJumps = (raw: string): string => {
	return raw.replace(/(\r\n\r\n|\n\n|\r\r|\n)/gm, ".");
}

export const getAvailableVoices = () => {
	let newvoices: OptionObj[] = []
	window.speechSynthesis.getVoices().forEach(function (voice, i) {
		const lang = voice.lang ? ` (${voice.lang})` : ''
		const label = `${voice.name}${lang}`
		newvoices.push({ key: i, label, obj: voice })
	});
	return newvoices
}

const normalizeText = (text: string): string => {
	// ambiguous characters like ' or ’ > ' 
	text = text.replace(/’/g, "'")
	text = text.replace(/“/g, '"')
	// remove all special characters except a-zA-Z0-9-_?!.,:;
	text = text.replace(/[^a-zA-Z0-9]/g, '')
	text = text.trim()
	return text
}

// search for the extract in the chunked text and return the index of the chunk
export const extractToChunkPos = (extract: string, chunkedText:string[], chunkLength:number): number => {

		let sentencesPerPart = userSettingsSync.curr.tts_sentences_per_part
		let extractChunks = chunkTextInSentences2(extract, sentencesPerPart)
		// let toSearch: string | null = null
		
		// let toSearchArr = extractChunks.filter(c => c.length > 50)
		// replace toSearchArr items where c.length < 50 with -------------
		let toSearchArr = extractChunks.map(c => {
			if (c.length < 50) {
				return '-_PLACEHOLDER_SEARCH_FOR_KEEPING_INDEX_LAKJFDSKJDLKSA_-'
			} else {
				return c
			}
		})
		// each(extractChunks, c => {
		// 	if (c.length > 50) {
		// 		toSearch = c
		// 		return false
		// 	}
		// })
		if (toSearchArr.length === 0 ) toSearchArr = [extract]

		let toSearchStr = toSearchArr.join(' ').substring(0, 150)
		console.log("trying finding extracts:", toSearchStr, chunkedText.length)
		let res = -1
		each(chunkedText, (chunk, i) => {
			each(toSearchArr, (toSearch, j) => {
				if (res == -1 && normalizeText(chunk).indexOf(normalizeText(toSearch as string)) !== -1) {
					// console.log(123333, chunk, toSearch)
					// if we find the 4th sentence match, come back to first to start tts
					// console.log(i, j, i-j)
					res = i - j + 1
					return false
				}
			})
		})
		return res
	}

export const chunkTextInSentences2 = (text2chunk: string, sentencesPerPart:number, partMaxWords: number = 70): string[] => {
	partMaxWords = parseInt(partMaxWords.toString())
	// word count that ignores the leading space sentences keep (split(" ") counts an empty token)
	const countWords = (s: string) => (s.match(/\S+/g) || []).length
	// 1 remove spaces
	text2chunk = removeTextLineJumps(text2chunk)
	// 2 split by sentences while keeping punctuation
	// let sentences = text2chunk.split(/[.!?]+/)
	let sentencesWithPunctuation = text2chunk.match(/[^.!?:]+[.!?:]+/g) as string[] || [];
	// for each sentence, if less than 2 words, merge with next sentence
	for (let i = 0; i < sentencesWithPunctuation.length; i++) {
		if (sentencesWithPunctuation[i].split(" ").length < 3) {
			sentencesWithPunctuation[i] += sentencesWithPunctuation[i + 1]
			sentencesWithPunctuation.splice(i + 1, 1)
		}
	}
	let sentences = sentencesWithPunctuation
	// remove sentences with lenfth = 0
	sentences = sentences.filter(s => s.length > 0)
	let currChunk = ""
	let chunks:string[] = []
	let sentencesInPart = 0

	for (let i = 0; i < sentences.length; i++) {
		// sentencesPerPart is a CAP: close the part once it holds that many sentences
		// (Infinity for engines with their own max words → word cap is the only rule)
		if (sentencesInPart >= sentencesPerPart) {
			chunks.push(currChunk)
			currChunk = ""
			sentencesInPart = 0
		}
		// max words: close the part BEFORE the sentence that would exceed the cap
		// (22 sentences = 440 words stays in, the 23rd → 460 starts a new part)
		if (currChunk && countWords(currChunk) + countWords(sentences[i]) > partMaxWords) {
			chunks.push(currChunk)
			currChunk = ""
			sentencesInPart = 0
		}
		currChunk += sentences[i]
		sentencesInPart++
	}
	if (currChunk) chunks.push(currChunk) // ponytail: leftover part was silently dropped (trailing sentences lost)

		// if current sentence is > 70, split it using commas
		// if (sentences[i].split(" ").length > partMaxWords) {
		// 	let subSentences = sentences[i].split(/[,;]+/)
		// 	for (let j = 0; j < subSentences.length; j++) {
		// 		chunks.push(subSentences[j])
		// 	}
		// }

	// console.log(1112, sentences.length)
	// for each chunk, if > partMaxWords, split in subsentences
	// for (let i = 0; i < chunks.length; i++) {
	// 	if (chunks[i].split(" ").length > partMaxWords) {
	// 		// if there are commas, or :/.
	// 		let subSentences = chunks[i].split(/[.:,;]+/)
	// 		for (let j = 0; j < subSentences.length; j++) {
	// 			chunks.push(subSentences[j])
	// 		}
	// 	}
	// }
	// if still partMaxWords, split in smaller chunks
	for (let i = 0; i < chunks.length; i++) {
		while (countWords(chunks[i]) > partMaxWords) {
			let subChunk = chunks[i].split(" ").slice(0, partMaxWords).join(" ")
			chunks[i] = chunks[i].split(" ").slice(partMaxWords).join(" ")
			chunks.splice(i, 0, subChunk)
		}
	}

	let chunksLength:number[] = []
	for (let i = 0; i < chunks.length; i++) {
		let wordsNb = chunks[i].split(" ").length
		chunksLength.push(wordsNb)
	}

	// remove chunks with less than 1 char
	chunks = chunks.filter(chunk => chunk.length > 1)
	// console.log(sentences.length, chunks.length, chunksLength, partMaxWords)
	return chunks
}

export const chunkTextInSentences = (text2chunk: string, maxChunkLength: number): string[] => {
		// 1 remove spaces
		text2chunk = removeTextLineJumps(text2chunk)

		// 2 split by sentences
		let sentences = text2chunk.split(/[.!?]+/)

		// 3 reduce again if sentences too long
		let chunks: string[] = []
		for (let i = 0; i < sentences.length; i++) {
			const sentence = sentences[i];
			if (sentence.length > maxChunkLength) {
				// subchunks from words
				let words = sentence.split(' ')
				let newSentence = ''
				for (let y = 0; y < words.length; y++) {
					newSentence += words[y] + ' '


					if (newSentence.length > maxChunkLength || y === words.length - 1) {
						// console.log( 'PUSH', newSentence);
						chunks.push(newSentence)
						newSentence = ''
					}
				}
			} else {
				chunks.push(sentence)
			}
		}
		// console.log(chunks);
		return chunks
	}

export class Text2SpeechManager {
	rawText: string
	voice: any
	text2read: string
	chunkedText: string[]

	chunkLength: number = 1000 // 160 if tts stops (bug)
	currChunkId: number = 0
	currSpeechObj: any
	speed: number = 1

	isLoaded: boolean = false
	shouldStop: boolean = false

	constructor(p: {
		text: string
	}) {
		this.rawText = p.text
		this.text2read = cleanText2Speech(p.text)
		this.chunkedText = this.chunkText(this.text2read, this.chunkLength)
		console.log(`[TTS] init new manager `, { p, text: this.chunkedText, length: this.chunkedText.length });
	}

	chunkText = chunkTextInSentences

	loadVoice = (voice) => {
		console.log(`[TTS] LOAD VOICE`, voice);
		this.voice = voice
		this.pause()
		this.play()
	}

	updateSpeed = (speed: number) => {
		this.speed = speed
		this.pause()
		this.play()
	}

	play = () => {

		if (!this.isLoaded) {

			if (this.currChunkId > this.chunkedText.length - 1) return console.log(`[TTS] finished played`)

			this.isLoaded = true
			this.currSpeechObj = new SpeechSynthesisUtterance();
			this.currSpeechObj.text = this.chunkedText[this.currChunkId]
			this.currSpeechObj.rate = this.speed
			if (this.voice) this.currSpeechObj.voice = this.voice

			// apparently important to keep that console.log...

			setTimeout(() => {
				window.speechSynthesis.speak(this.currSpeechObj);
			}, 0);

			this.currSpeechObj.addEventListener('end', () => {
				this.isLoaded = false
				// console.log(`[TTS] END play chunk ${this.currChunkId}`);
				if (!this.shouldStop) {
					// window.speechSynthesis.cancel();
					this.currChunkId += 1
					this.play()
				} else {
					this.shouldStop = false
				}
			})

		} else {
			// console.log(`[TTS] RESUME play chunk ${this.currChunkId}`);
			window.speechSynthesis.resume();
		}
	}

	isPlaying = (): boolean => {
		let res = window.speechSynthesis.speaking
		if (res) res = !window.speechSynthesis.paused
		return res;
	}

	pause = () => {
		// console.log('[TTS] pause');
		// window.speechSynthesis.pause();
		this.stop()
	}

	stop = () => {
		// console.log('[TTS] stop');
		this.shouldStop = true
		this.isLoaded = false
		this.debounceReinitStop()
		window.speechSynthesis.cancel();
	}

	// needed for edge to not stop after first sentence after a restart/gotochunk
	debounceReinitStop = debounce(() => {
		this.shouldStop = false
	}, 1000)

	goToChunk = (chunkNb: number) => {
		// console.log('[TTS] goToChunk', chunkNb);
		if (chunkNb <= 0 || chunkNb > this.chunkedText.length - 1) return
		this.currChunkId = chunkNb

		// IF PLAYING => stop and play one asked
		if (this.isPlaying()) {
			this.debounceRestart()
		}
	}

	extractToChunkPos = extractToChunkPos

	getCurrentChunkText = (): string | null => {
		let res: string | null = null
		res = this.chunkedText[this.currChunkId]
		return res
	}



	debounceRestart = debounce(() => {
		// console.log('DEBOUNCE RESTART');
		this.stop()
		// this.shouldStop = false
		this.play()
	}, 500)

	goBack = () => {
		// console.log('[TTS] goBack', this.currChunkId);
		this.goToChunk(this.currChunkId - 1)
	}
	goForward = () => {
		// console.log('[TTS] goForward', this.currChunkId);
		this.goToChunk(this.currChunkId + 1)
	}

}


