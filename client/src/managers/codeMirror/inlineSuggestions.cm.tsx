
import { inlineCopilot } from "codemirror-copilot";
import { getApi } from "../../hooks/api/api.hook";
import { debounce, throttle } from "lodash-es";


const cache:{[key:string]:string[]} = {
    lines: [],
    words: [],
    sentences: [],
    userDicStr: []
}

let debug = false


const throttleUpdateUserDic = throttle(() => {
    getApi(
        api => {
            api.file.getContent(".tiro/suggestions.md", content => {
                if (content !== "NO_FILE")  cache.userDicStr = ["\n"+content]
            })
        }
    )
}, 60 * 1000)

const throttleUpdateCache = throttle((prefix, suffix, currentSentenceLength) => {
    throttleUpdateUserDic()
    let prefixNoLastSentence = prefix
    if (currentSentenceLength > 0) prefixNoLastSentence = prefix.slice(0, -currentSentenceLength)
    let fullTextNoCurrentLine = prefixNoLastSentence + suffix + cache.userDicStr[0]
    // split by lines
    let lines = fullTextNoCurrentLine.split("\n")
    // lines unique
    lines = Array.from(new Set(lines))
    // sentences
    let sentencesStr = fullTextNoCurrentLine.split("\n").join("<END_SENTENCE>")
    // split by ? . !
    sentencesStr = sentencesStr.split(".").join("<END_SENTENCE>").split("?").join("<END_SENTENCE>").split("!").join("<END_SENTENCE>")
    let sentences = sentencesStr.split("<END_SENTENCE>")
    // remove if empty
    lines = lines.filter(line => line.trim() !== "")
    // split by words
    let fullTextInOneLine = lines.join(" ")
    let words = fullTextInOneLine.split(" ")
    // words unique
    words = Array.from(new Set(words))

    cache.lines = lines
    cache.words = words
    cache.sentences = sentences
    debug && console.log("inline suggestion cache updated: ", cache)
}, 6000)


export const inlineSuggestionCMExtention = inlineCopilot(async (prefix, suffix) => {
    // const res = await fetch("/api/autocomplete", {
    // 	method: "POST",
    // 	headers: {
    // 	"Content-Type": "application/json",
    // 	},
    // 	body: JSON.stringify({ prefix, suffix, language: "javascript" }),
    // });
    // const { prediction } = await res.json();
    const res = new Promise((resolve, reject) => {
        getApi(
            api => {


            }
        )
    })


    let currentline = prefix.split("\n").slice(-1)[0]
    // split currentSentence in . ? !
    let currentSentenceRaw = currentline.split(".").slice(-1)[0].split("?").slice(-1)[0].split("!").slice(-1)[0]
    // if currentSentence starts with a space, remove it
    let currentSentence = currentSentenceRaw
    if (currentSentence.startsWith(" ")) currentSentence = currentSentence.slice(1)
    let currentWord = currentline.split(" ").slice(-1)[0]
    // remove french d' l' etc
    if (currentWord.startsWith("d'") || currentWord.startsWith("l'")) currentWord = currentWord.slice(2)
    // remove currentSentence from the prefix
    let currentSentenceLength = currentSentenceRaw.length
    let prediction:string= ""

    throttleUpdateCache(prefix, suffix, currentSentenceLength)

    //
    // WORD PREDICTION
    //
    if (currentWord.length > 1) {
        // if current line starts like one of the lines, predict that line
        let potentialCandidates:string[] = []
        for (let word of cache.words) {
            if (word.startsWith(currentWord)) {
                potentialCandidates.push(word)
            }
        }
        // take the longuest one
        if (potentialCandidates.length > 0) {
            // prediction = potentialCandidates.sort((a, b) => a.length - b.length)[0]
            let sortedDic = potentialCandidates.sort((b, a) => a.length - b.length)
            // take one randomly of the 10 first
            let subDic = sortedDic.slice(0, 10)
            let randomIdx = Math.floor(Math.random() * subDic.length)
            debug && console.log({subDic}, randomIdx, subDic[randomIdx])

            prediction = subDic[randomIdx]
            // remove the current line from the prediction
            prediction = prediction.replace(currentWord, "")
        }
        // remove any punctuation . , ! ? 
        // prediction = prediction.replace(".", "").replace(",", "").replace("!", "").replace("?", "")
        // if prediction ends with space then .,!? like "hello world ?" transform it to "hello world"
        let islastCharPunctuation = [".", ",", "!", "?", "|"].includes(prediction.slice(-1))
        let isbeforeLastCharSpace = prediction.slice(-2, -1) === " "
        if (islastCharPunctuation && isbeforeLastCharSpace) prediction = prediction.slice(0, -2)
        if (islastCharPunctuation) prediction = prediction.slice(0, -1)

        // prediction = prediction + " "
    }

    //
    // SENTENCES PREDICTION
    //
    if (currentSentence.length > 2) {
        // if current line starts like one of the lines, predict that line
        let potentialCandidates:string[] = []
        for (let sentence of cache.sentences) {
            if (sentence.toLocaleLowerCase().startsWith(currentSentence.toLocaleLowerCase())) {
                potentialCandidates.push(sentence)
            }
        }
        // take the longest one
        if (potentialCandidates.length > 0) {
            prediction = potentialCandidates.sort((a, b) => b.length - a.length)[0]
            // remove the current line from the prediction
            let lengthToRemove = currentSentence.length
            prediction = prediction.slice(lengthToRemove)
        }
        console.log({potentialCandidates, currentSentence, currentWord, currentline})
    }



    // console.log({prefix, suffix}, "inlineCopilotCMExtention", res)

    return prediction;
}, 100)