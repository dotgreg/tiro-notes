
export const secureTitleString = (title: string): string => {
	let res = title;
	// accept all A-Z, a-z, 0-9, _ and - and all emojis (\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])
	const regex = /[^A-Za-z0-9_\ \-\u00a9\u00ae\u2000-\u3300\ud83c\ud000-\udfff\ud83d\ud000-\udfff\ud83e\ud000-\udfff]/g;
	res = res.replace(regex, '');
	return res
}
