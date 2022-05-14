import React, { useEffect, useRef, useState } from "react";
import { iApiDictionary } from "../../../../shared/apiDictionary.type";
import { iFileImage } from "../../../../shared/types.shared";
import { clientSocket2 } from "../../managers/sockets/socket.manager";
import { getLoginToken } from "./loginToken.hook";

export type onImagesReceivedFn = (images: iFileImage[]) => void

// export 

export const useImagesList = (
	onImagesReceivedCallback: onImagesReceivedFn
) => {

	// DATA STORAGE
	const [images, setImages] = useState<iFileImage[]>([])

	// SOCKET INTERACTIONS
	const listenerId = useRef<number>(0)
	useEffect(() => {
		console.log(`[IMAGES LIST] init socket listener`);
		listenerId.current = clientSocket2.on('getImages', data => {
			onImagesReceived(data)
		})
		return () => {
			console.log(`[IMAGES LIST] clean socket listener`);
			clientSocket2.off(listenerId.current)
		}
	}, [])

	const askForFolderImages = (folderPath: string) => {
		clientSocket2.emit('askForImages', { folderPath: folderPath, token: getLoginToken() })
	}




	// DATA PROCESSING FUNCTIONS
	const onImagesReceived = (data: iApiDictionary['getImages']) => {
		// sort them
		// console.log(`[SORT] sorting received files with sort mode ${sortMode} : ${SortModes[sortMode]}`);
		// filesRef.current = sortFiles(filesRef.current, sortMode)

		setImages(data.images)

		onImagesReceivedCallback(data.images)

	}

	return {
		images, setImages,
		askForFolderImages,
		onImagesReceivedCallback
	}
}
