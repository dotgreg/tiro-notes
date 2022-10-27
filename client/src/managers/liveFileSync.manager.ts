import { createEventBus } from "./eventBus.manager"
import { filterMetaFromFileContent } from "./headerMetas.manager"
import { clientSocket2 } from "./sockets/socket.manager"
export {}

// export const onLiveFileSyncUpdate = (
// 	cb: (
// 		filePath: string,
// 		updatedFileContent: string
// 	) => void
// ) => {

// }

//
// CODE STARTUP
//

// interface i {
// 	action: iIframeActions
// 	data: any
// }
// const { notify, subscribe, unsubscribe } = createEventBus<iIframeMessage>({
// 	headerLog: h
// })

// export const startLiveFileSyncWatcher = () => {
// 	clientSocket2.on('onFileUpdate', data => {
// 		if (data.error) {
// 			// p.eventBus.notify(data.idReq, { error: data.error })
// 		} else {
// 			let filterRes = filterMetaFromFileContent(data.fileContent)
// 			// p.eventBus.notify(data.idReq, { content: filterRes.content })
// 		}
// 	})
// }


