import { css, Global } from '@emotion/react';
import React, { useEffect, useRef, useState } from 'react';
import { getApi, useClientApi } from './hooks/api/api.hook';
import { startFrontendBackgroundPluginsCron } from './managers/plugin.manager';
import { random } from 'lodash';
import { initPWA } from './managers/pwa.manager';
import { deviceType } from './managers/device.manager';
import { initSocketConnexion } from './managers/sockets/socket.manager';
import { useStatusApi } from './hooks/api/status.api.hook';
import { useConnectionIndicator } from './hooks/app/connectionIndicator.hook';
import { useDynamicResponsive } from './hooks/app/dynamicResponsive.hook';
import { useNoteHistoryApi } from './hooks/api/history.api.hook';
import { useNotePreviewPopupApi } from './hooks/api/notePreviewPopup.api.hook';
import { usePromptPopup } from './hooks/app/usePromptPopup.hook';
import { useTabs } from './hooks/app/tabs.hook';
import { useLightbox } from './hooks/app/useLightbox.hook';
import { useTtsPopup } from './hooks/app/useTtsPopup.hook';
import { useLastFilesHistory } from './hooks/app/lastFilesHistory.hook';
import { useFileMove } from './hooks/app/fileMove.hook';
import { useMobileView } from './hooks/app/mobileView.hook';
import { useLoginToken } from './hooks/app/loginToken.hook';
export const PublicApp = () => {
	//
	// STARTUP PHASE, code should be added after login phase, not here
	//
	useEffect(() => {
		initPWA()
		console.log(`========= [APP PUBLIC] MOUNTED on a ${deviceType()}`);

		initSocketConnexion().then(serverSocketConfig => {
			getApi(api => { 
				api.status.ipsServer.set(serverSocketConfig.ipsServer)
				api.ui.browser.folders.refreshFromBackend() 
			})
		})

	}, [])

	//
	// LOGIN to PUBLIC 
	//
	// const { LoginPopupComponent } = useLoginToken({
	// 	onLoginAsked: () => {
	// 	},
	// 	onLoginSuccess: () => {
	// 		refreshTabsFromBackend();
	// 		refreshPinStatus();
	// 		refreshFilesHistoryFromBackend();
	// 		getApi(api => {
	// 			api.userSettings.refreshUserSettingsFromBackend()
	// 			api.ui.floatingPanel.refreshFromBackend()
	// 		})
			

	// 		getApi(api => {
	// 			api.ui.browser.folders.refreshFromBackend()
	// 		})

	// 		// seems blocking the initial loading of a few seconds, so starts it 10s after
	// 		askForFolderScan(['/'])

	// 		// Temporary => after tabs and other backend states are loaded
	// 		onStartupAfterDataBootstrap()
	// 	}
	// })

	//
	// CLIENT API 
	//
	const {
		isConnected,
		connectionStatusComponent,
		toggleSocketConnection
	} = useConnectionIndicator()
	// DYNAMIC RESPONSIVE RERENDER (ON DEBOUNCEe
	const { forceResponsiveRender, responsiveRefreshCounter, setResponsiveRefresh } = useDynamicResponsive()
	const statusApi = useStatusApi({
		isConnected,
		refresh: {
			get: responsiveRefreshCounter,
			set: setResponsiveRefresh,
		}
	})
	const {
		tabs, updateTab,
		refreshTabsFromBackend,
		updateActiveTabGrid,
		refreshWindowGrid,
		tabsApi,
		windowsApi
	} = useTabs();
	// PROMPT AND CONFIRM POPUPAPI
	const { lightboxApi, lightboxImages, lightboxIndex } = useLightbox();
	const { PromptPopupComponent, popupApi } = usePromptPopup({})
	const historyApi = useNoteHistoryApi()
	// TTS SYSTEM
	const { ttsApi, ttsPos, ttsPopup, setTtsPopup, ttsPopupContent, ttsPopupId, syncTtsStatus } = useTtsPopup();

	const {
		notePreviewPopupApi, notePreviewPopup
	} = useNotePreviewPopupApi()
	//
	// CLIENT API
	//
	const clientApi = useClientApi({
		popupApi,
		tabsApi,
		windowsApi,
		statusApi,
		historyApi,
		notePreviewPopupApi,
		lightboxApi,
		ttsApi
	})


	// shortcuts
	const api = clientApi
	const filesUiApi = api.ui.browser.files
	const foldersUiApi = api.ui.browser.folders
	const askForFolderScan = foldersUiApi.scan
	const cleanFolderHierarchy = foldersUiApi.clean
	const folderBasePath = foldersUiApi.base

	// last Note + files history array
	const {
		filesHistory,
		filesHistoryRef,
		cleanLastFilesHistory,
		refreshFilesHistoryFromBackend,
		lastFilesHistoryApi
	} = useLastFilesHistory(filesUiApi.active.get)
	api.lastNotesApi = lastFilesHistoryApi

	const cleanFileDetails = () => {
		filesUiApi.active.set(-1)
	}
	const cleanFilesList = () => {
		clientApi.ui.browser.files.set([])
		// api.popup.confirm()
	}

	// fileMove logic
	const {
		askForMoveFile,
		promptAndMoveFolder,
		promptAndBatchMoveFiles
	} = useFileMove(
		cleanFileDetails,
		cleanFilesList,
		cleanFolderHierarchy,
		askForFolderScan
	)

	// Mobile view
	const {
		mobileView,
		setMobileView,
		MobileToolbarComponent
	} = useMobileView()

	//@ts-ignore
	window.api = api

	return (
		<div>
			hello world public app
			{window.location.pathname}
		</div >
	)
}

