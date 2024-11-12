
import { inlineCopilot, clearLocalCache } from "codemirror-copilot";
import { getApi } from "../../hooks/api/api.hook";
import { debounce, throttle } from "lodash-es";


const cache:{[key:string]:string[]} = {
    lines: [],
    words: [],
    sentences: [],
    userDicStr: [],
}

const hist = {
    lastLinePos: -1
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
    // how many \n in prefix
    let currentLinePos = prefix.split("\n").length - 1
    // if currentSentence starts with a space, remove it
    let currentSentence = currentSentenceRaw
    if (currentSentence.startsWith(" ")) currentSentence = currentSentence.slice(1)
    let currentWord = currentline.split(" ").slice(-1)[0]
    let beforeCurrentWord = currentline.split(" ").slice(-2, -1)[0]
    let lastChar = currentline.slice(-1)
    let fullText = prefix + suffix
    // remove french d' l' etc
    if (currentWord.startsWith("d'") || currentWord.startsWith("l'")) currentWord = currentWord.slice(2)
    // remove currentSentence from the prefix
    let currentSentenceLength = currentSentenceRaw.length
    let prediction:string= ""

    throttleUpdateCache(prefix, suffix, currentSentenceLength)


    let proceedLine = true
    let proceedWord = true
    let predictionWordSimple = ""
    let predictionWordBetter = ""
    let predictionLine = ""
    let wordBetterOnly = false



    //
    // WORD PREDICTION
    //
    let triggerWordPrediction = currentWord.length > 1
    // if lastChar is a space and beforeCurrentWord is not empty, triggerWordPrediction = true
    if (lastChar === " " && beforeCurrentWord && beforeCurrentWord.length > 0) {
        triggerWordPrediction = true
        wordBetterOnly = true
    }
    
    // triggerWordPrediction = true
    if (triggerWordPrediction) {
        // if current line starts like one of the lines, predict that line
        let potentialCandidatesSimple:string[] = []
        let potentialCandidatesBetter:string[] = []

        for (let word of cache.words) {
            if (word.startsWith(currentWord)) {
                potentialCandidatesSimple.push(word)
                // for each word, does `${beforeCurrentWord} ${word}` exists in the text, if yes push in potentialCandidates2
                if (beforeCurrentWord && beforeCurrentWord.length > 0) {
                    let combination = beforeCurrentWord + " " + word
                    // for each time fullText includes combination, push word in potentialCandidatesBetter
                    let idx = fullText.indexOf(combination)
                    while (idx !== -1 && word !== "") {
                        potentialCandidatesBetter.push(word)
                        idx = fullText.indexOf(combination, idx + 1)
                    }
                }
            }
        }


        // if potentialCandidatesBetter is not empty, get the most occuring work in it
        if (potentialCandidatesBetter.length > 0) {
            let mostOccuringWord = ""
            let mostOccuringWordCount = 0
            for (let word of potentialCandidatesBetter) {
                let count = potentialCandidatesBetter.filter(w => w === word).length
                if (count > mostOccuringWordCount) {
                    mostOccuringWord = word
                    mostOccuringWordCount = count
                }
            }
            // console.log({mostOccuringWord, mostOccuringWordCount, potentialCandidatesBetter})
            potentialCandidatesBetter = [mostOccuringWord]
        }

        // if potentialCandidatesBetter is not empty, take it
        let potentialCandidates =  potentialCandidatesBetter.length > 0 ? potentialCandidatesBetter : potentialCandidatesSimple
        if (wordBetterOnly) potentialCandidates = potentialCandidatesBetter


        let predictionWordInt = ""
        // take the longuest one
        if (potentialCandidates.length > 0) {
            // console.log({potentialCandidates})
            // prediction = potentialCandidates.sort((a, b) => a.length - b.length)[0]
            let sortedDic = potentialCandidates.sort((b, a) => a.length - b.length)
            // take one randomly of the 10 first
            let subDic = sortedDic.slice(0, 10)
            let randomIdx = Math.floor(Math.random() * subDic.length)
            debug && console.log({subDic}, randomIdx, subDic[randomIdx])

            predictionWordInt = subDic[randomIdx]
            // remove the current line from the prediction
            predictionWordInt = predictionWordInt.replace(currentWord, "")
        }
        // remove any punctuation . , ! ? 
        // predictionWordInt = predictionWordInt.replace(".", "").replace(",", "").replace("!", "").replace("?", "")
        // if predictionWordInt ends with space then .,!? like "hello world ?" transform it to "hello world"
        let islastCharPunctuation = [".", ",", "!", "?", "|"].includes(predictionWordInt.slice(-1))
        let isbeforeLastCharSpace = predictionWordInt.slice(-2, -1) === " "
        if (islastCharPunctuation && isbeforeLastCharSpace) predictionWordInt = predictionWordInt.slice(0, -2)
        if (islastCharPunctuation) predictionWordInt = predictionWordInt.slice(0, -1)
        // console.log({predictionWordInt})

        // prediction = prediction + " "
        if (potentialCandidatesBetter.length > 0) predictionWordBetter = predictionWordInt
        else predictionWordSimple = predictionWordInt
    }

    //
    // SENTENCES PREDICTION => only if predictionWordBetter is empty
    //
    if (currentSentence.length > 4 && predictionWordBetter === "") {
        predictionLine = ""
        // if current sentence ends with [ ] or [x]  or " " do nothign
        let currentSentenceTrim = currentSentence.trim()
        if (currentSentenceTrim.endsWith("[ ]") || currentSentenceTrim.endsWith("[x]")) proceedLine = false
        if (currentSentence.endsWith(" ")) proceedLine = false


        // if current line starts like one of the lines, predict that line
        let potentialCandidates:string[] = []
        for (let sentence of cache.sentences) {
            if (sentence.toLocaleLowerCase().startsWith(currentSentence.toLocaleLowerCase())) {
                potentialCandidates.push(sentence)
            }
        }
        // take the longest one
        if (potentialCandidates.length > 0) {
            predictionLine = potentialCandidates.sort((a, b) => b.length - a.length)[0]
            // remove the current line from the predictionLine
            let lengthToRemove = currentSentence.length
            predictionLine = predictionLine.slice(lengthToRemove)
        }
        // console.log({potentialCandidates, currentSentence, currentWord, currentline})

        if (proceedLine) prediction = predictionLine
    }

    // if line is not the same, disable suggestion
    let canPredict = true
    if (hist.lastLinePos !== currentLinePos) canPredict = false
    // console.log("222", {lastLinePos: hist.lastLinePos, currentLinePos, predictionLine, predictionWordBetter, predictionWordSimple, canPredict})
    hist.lastLinePos = currentLinePos
    clearLocalCache()

    prediction = predictionWordBetter || predictionWordSimple || prediction
    if (!canPredict) prediction = ""

    return prediction;
}, 100)