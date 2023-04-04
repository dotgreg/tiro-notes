import { generateUUID } from "../../../shared/helpers/id.helper"
import { iFile } from "../../../shared/types.shared"
import { iContentChunk } from "../managers/renderNote.manager"
import { testsContentNoteContents } from "../managers/__tests__/contentChunks.test"

//////////////////////////////////////////////////////
// NOTE
const note = {

	severalScriptsTag: `
				=========
				[link|22a long long note in journal.md /other-data/data2/journal/]
				message d'outre tombe :

				innerTag est : {{innerTag}}

				js : 

				[[script]] 
				var res = Math.round(Math.random() * 100000)
				var test2 = res 
				return  test2
				[[script]]


				another js2 : 
				[[script]] 
				var res = '{{innerTag}}'
				var arr = res.split('\n')
				const nObj = {}
				for(var i = 0; i<arr.length; i++) {
						const item = arr[i].split(':')
						nObj[item[0]] = item[1]
				}
				return  JSON.stringify(nObj)
				[[script]]

				another js3 : 
				[[script]]
				return 'yeahmannn'  
				[[script]]
				# hello title

				![dfsafdasfdsa](fdsafdasdfsa.pdf)

				woop wopppppp  
				console.log('hellloooooooo')
				pre code {
						display: block;
						border-radius: 8px;
						background: #d2d2d2;
						padding: 2px 8px;
				}  

				test|sad|dasdsa
				-|-|-
				dfslkfj|fdslkjfds|fdslkjfds
				dfslkfj|fdslkjfds|fdslkjfds
				dfslkfj|fdslkjfds|fdslkjfds
				dfslkfj|fdslkjfds|fdslkjfds

				# Hello world2
				## Hello world 1
				## Hello world 2
				# 222222
				## 3333
				## 4444


				=========
	`,

	twoScriptClosedTag: `
hello world1
hello world1
hello world1
hello world1
hello world1

[[script]] 
var res = '{{innerTag}}'
var arr = res.split('\n')
const nObj = {}
for(var i = 0; i<arr.length; i++) {
		const item = arr[i].split(':')
		nObj[item[0]] = item[1]
}
return  JSON.stringify(nObj)
[[script]]

hello world12
hello world12
hello world12
hello world12
[[script]] 
// SCRIPT 2
var res = '{{innerTag}}'
var arr = res.split('\n')
const nObj = {}
for(var i = 0; i<arr.length; i++) {
		const item = arr[i].split(':')
		nObj[item[0]] = item[1]
}
return  JSON.stringify(nObj)
[[script]]
hello world123
hello world123
`,
	oneScriptNotClosedTag: `
hello world1
hello world1
hello world1
hello world1
hello world1

[[script]]
return woop wopp

hello world12
hello world12
hello world12
hello world12
hello world12
hello world12
`,
	...testsContentNoteContents
}

//////////////////////////////////////////////////////
// FILE
// const file: { [key: string]: iFile } = {
const file = {
	file1: {
		created: 1652125211949,
		extension: "md",
		folder: "/images2/",
		index: 20,
		modified: 1652219066707,
		name: "TEST CUSTOM TAG IFRAME 2.md",
		nature: "file",
		path: "/images2/TEST CUSTOM TAG IFRAME 2.md",
		realname: "TEST CUSTOM TAG IFRAME 2.md"
	} as iFile,
	fileTag1: {
		created: 1651154906303,
		extension: "md",
		folder: "/.tiro/tags/",
		index: 0,
		modified: 1651154906303,
		name: "Note 1 of 28 Apr 22.md",
		nature: "file",
		path: "/.tiro/tags/Note 1 of 28 Apr 22.md",
		realname: "Note 1 of 28 Apr 22.md",
	} as iFile
}

//////////////////////////////////////////////////////
// WINDOW
const window = {
	genId: () => generateUUID()
}


const contentChunk = {
	c1: {
		content: "\npart1: val1\npart2: val2\npart3: val3\npart4: val4\n",
		end: 1,
		start: 0,
		tagName: "woop",
		type: "tag"
	} as iContentChunk
}


export const testsContent = {
	note,
	file,
	contentChunk,
	window,
}

export const tc = testsContent

test('nothing', () => { expect(1).toEqual(1); });
