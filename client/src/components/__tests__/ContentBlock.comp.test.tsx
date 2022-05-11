import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ContentBlockTagView } from '../ContentBlock.component'
import { tc } from '../../__tests__/testsContent'

const h = `[CONTENT BLOCK]`
jest.mock('../../../__mocks__/react-monaco-editor.js')

test(`${h} ContentBlockTagView : testing working`, async () => {

	render(<ContentBlockTagView
		noteTagContent={tc.note.oneScriptTag}
		windowId={tc.window.genId()}
		block={tc.contentChunk.c1}
		file={tc.file.file1}
	/>
	)


	// fireEvent.click(screen.getByText('Load Greeting'))




	await waitFor(() => screen.getByRole('heading'))

	// expect(screen.getByRole('heading')).toHaveTextContent('hello there')
	// expect(screen.getByRole('button')).toBeDisabled()
})


