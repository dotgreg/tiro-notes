const commanderApp = (innerTagStr, opts) => {
		const {div, updateContent} = api.utils.createDiv()

		
		let cmd = `ls -lsia`
		api.call("command.exec", [cmd], res => {
				updateContent(`${cmd} => ${res}`)
		});

		return div
}

window.initCustomTag = commanderApp

