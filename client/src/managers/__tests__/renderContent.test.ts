import { tu } from '../../__tests__/testsUtils'
import { tc } from '../../__tests__/testsContent'
import { noteApi } from '../renderNote.manager';
import { isBoolean } from 'lodash';


const h = `[RENDER CONTENT]`
const raw = tc.note.twoScriptClosedTag
const windowId = tc.window.genId()
const file = tc.file.file1
const r1 = noteApi.render({
	raw,
	windowId,
	file: file
})

test(`${h} : should not transform md>html inside [[script]] tags`, () => {
	// should not include transformed chars html inside script
	let res: any = true
	if (
		!r1.includes('var res = &#039;{{innerTag}}&#039;')
	) res = "script is not escaped"

	if (
		!r1.includes('var arr =')
	) res = "script disappeared"

	if (!isBoolean(res)) console.log(r1);
	// console.log(r1);
	expect(res).toEqual(true);
});
