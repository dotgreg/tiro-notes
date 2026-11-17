import { css } from '@emotion/css'
import { omnibarPopupCss } from '../OmniBar.component'

const h = `[omnibar option actions]`

// deviceType() reads window.innerWidth, so the test only changes the width
const setWidth = (w: number) => {
	Object.defineProperty(window, 'innerWidth', { value: w, configurable: true, writable: true })
}

// css() runs the css string through emotion (stylis): this is the css the browser really gets.
// only the tags this call injects, so one test never reads another test's rules.
const compiledCss = (raw: string): string => {
	const before = document.querySelectorAll('style').length
	css(raw)
	const tags: HTMLElement[] = Array.from(document.querySelectorAll('style'))
	return tags.slice(before).map(t => t.textContent || '').join('\n')
}

test(`${h}: mobile keeps both actions visible (opacity 1) and much bigger (font-size 30px)`, () => {
	setWidth(400)
	const out = compiledCss(omnibarPopupCss())
	expect(out).toContain(".path-option-wrapper.device-mobile .actions .action{opacity:1;padding:5px 8px;}")
	expect(out).toContain(".path-option-wrapper.device-mobile .actions .action .icon-2-wrapper{font-size:30px;}")
})

test(`${h}: desktop keeps the hover-only behaviour (opacity 0 until hover)`, () => {
	setWidth(1200)
	const out = compiledCss(omnibarPopupCss())
	expect(out).toContain(".path-option-wrapper.device-desktop .actions{-webkit-transition:all 0.2s;transition:all 0.2s;opacity:0;}")
	expect(out).toContain(".path-option-wrapper.device-desktop:hover .actions{opacity:1;}")
})
