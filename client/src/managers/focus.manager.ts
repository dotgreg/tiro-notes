export const defocusMouse = (e, idtarget) => {
	// refocus on parent
	let el = document.getElementById(idtarget)
	if (el) {
		// @ts-ignore
		el.focus({ preventScroll: true})
	}

}
