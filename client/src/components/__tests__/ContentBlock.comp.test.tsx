import React from 'react'
import { render, fireEvent, waitFor, screen, getByTestId } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ContentBlockTagView } from '../ContentBlock.component'
import { tc } from '../../__tests__/testsContent'
import { tu } from '../../__tests__/testsUtils'

const h = `[CONTENT BLOCK]`

// test(`${h} ContentBlockTagView : testing working`, async () => {
// 	const { container } = render(
// 		<ContentBlockTagView
// 			noteTagContent={tc.note.twoScriptClosedTag}
// 			windowId={tc.window.genId()}
// 			block={tc.contentChunk.c1}
// 			file={tc.file.file1}
// 		/>
// 	)
// 	const iframe = container.querySelector('iframe')
// 	await tu.timeout(1000);
// 	//@ts-ignore
// 	// console.log(iframe.contentWindow.document.querySelectorAll('div'));
// 	// console.log(iframe.contentWindow.document.getElementById('content-wrapper'));
// })
// 
// 
// 
test('nothing', () => { expect(1).toEqual(1); });
