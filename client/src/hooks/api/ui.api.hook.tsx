import { iWindowsApi } from "../app/tabs.hook";
import { iLightboxApi } from "../app/useLightbox.hook";
import { iBrowserApi } from "./browser.api.hook";
import { iNoteApi } from "./note.api.hook";
import { iSearchUiApi } from "./search.hook.api";

export interface iUiApi2 {
	browser: iBrowserApi
	windows: iWindowsApi
	lightbox: iLightboxApi
	search: iSearchUiApi
	note: iNoteApi["ui"]
	// textToSpeechPopup: iTextToSpeechApi
}
