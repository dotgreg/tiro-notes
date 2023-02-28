export const defocusMouse = e => {
	// refocus on parent
	let el = document.getElementsByClassName("refocus-input")[0]
	if (el) {
		// @ts-ignore
		el.focus()
	}

}
