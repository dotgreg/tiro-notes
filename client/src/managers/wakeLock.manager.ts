const h = `[SCREEN WAKE LOCK]`
let wakeLock: any = null;

export const startScreenWakeLock = async () => {
	// create an async function to request a wake lock
	try {
		//@ts-ignore
		wakeLock = await navigator.wakeLock.request('screen');
		console.log(h, "ACTIVE");
	} catch (err: any) {
		// The Wake Lock request has failed - usually system related, such as battery.
		console.log(h, `Error : ${err.name}, ${err.message}`);
	}

}
export const stopScreenWakeLock = () => {
	if (!wakeLock) return
	wakeLock.release()
		.then(() => {
			wakeLock = null;
			console.log(h, "DISABLED");
		});
}
