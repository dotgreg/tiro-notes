import { sharedConfig } from "../../../shared/shared.config";

const h = `[PWA]`
const log = sharedConfig.client.log.verbose

export const initPWA = () => {

	log && console.log(h, ' init');

	/* Only register a service worker if it's supported */
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('/service-worker.js');
	}

	window.addEventListener('beforeinstallprompt', (event) => {
		// Prevent the mini-infobar from appearing on mobile.
		event.preventDefault();
		log && console.log(h, ' beforeinstallprompt WORKING=>', event);
		// Stash the event so it can be triggered later.
		// @ts-ignore
		window.deferredPrompt = event;
		// Remove the 'hidden' class from the install button container.
		// divInstall.classList.toggle('hidden', false);
	});
}
