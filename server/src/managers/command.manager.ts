import execa from "execa"
export {}

// export const execCmd = () => {
// 	const commandStream = execa(backConfig.rgPath, searchParams)
// 	const resArr: string[] = []
// 	commandStream.stdout.on('data', async dataChunk => {

// 		})
// 	})
// 	commandStream.stdout.on('close', dataChunk => {
// 		p.onSearchEnded(resArr)
// 	})
// }
    // const ripGrepStream = execa(backConfig.rgPath, searchParams)
	// const resArr: string[] = []
	// ripGrepStream.stdout.on('data', async dataChunk => {
	// 	// console.log("========", dataChunk);
	// 	const rawChunk = dataChunk.toString()
	// 	const rawLines = rawChunk.split('\n')
	// 	each(rawLines, line => {
	// 		let lineRaw = line
	// 		// "path/to/file:whole line with : inside" 
	// 		// search "found word:10"
	// 		lineRaw = line.split(':')
	// 		if (!lineRaw[0] || lineRaw[0] === '') return
	// 		let found = lineRaw.slice(1).join(":")
	// 		const processedLine = p.processRawLine({
	// 			file: processRawPathToFile({ rawPath: lineRaw[0], folder: p.folder }),
	// 			raw: line,
	// 			path: lineRaw[0],
	// 			found,
	// 		})
	// 		if (processedLine) resArr.push(processedLine)
	// 	})
	// })
	// ripGrepStream.stdout.on('close', dataChunk => {
	// 	p.onSearchEnded(resArr)
	// 	end()
	// 	// p.options.debug && console.log(`============== END`);
	// })
