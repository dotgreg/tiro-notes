
export const secureTitleString = (title: string): string => {
	let res = title;
	res = res.replace(/[^\w\s\_\-\:]/gi, '');
	return res
}
