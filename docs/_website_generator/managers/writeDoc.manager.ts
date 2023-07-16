export const updateDocFile = (nContent: string) => {
	const fs = require('fs')
	fs.writeFile('../client-api.md', nContent, err => {
		if (err) {
			console.error(err)
			return
		}
	})
}
