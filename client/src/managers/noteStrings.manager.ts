// config strings read INSIDE a note content (like "--table", "--disable-history--", "--latex")
export const noteString_reloadEvery = `--reload-every-`
export const noteString_disableHistory = `--disable-history--`

export const reloadEveryRegex = /--reload-every-(\d+)m/

// minutes to auto reload the note content from the server, null if "--reload-every-XXm" is not in the note
export const getNoteAutoReloadMinutes = (content: string): number | null => {
	const min = parseInt(content.match(reloadEveryRegex)?.[1] ?? "", 10)
	if (!Number.isFinite(min)) return null
	// clamp keeps setInterval under the 2^31-1 ms overflow trap (1440min = 86 400 000 ms)
	return Math.min(Math.max(min, 1), 1440)
}
