import { generateUUID } from "../../../shared/helpers/id.helper"
import { iFile } from "../../../shared/types.shared"
import { iContentChunk } from "../managers/renderNote.manager"

//////////////////////////////////////////////////////
// NOTE
const note = {
	oneScriptTag: `
hello world1
hello world1
hello world1
hello world1
hello world1

[[script]]
return woop wopp
[[script]]

hello world12
hello world12
hello world12
hello world12
hello world12
hello world12
`
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
	window
}

export const tc = testsContent

test('nothing', () => { expect(1).toEqual(1); });
