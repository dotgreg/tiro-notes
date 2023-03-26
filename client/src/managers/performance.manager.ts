

//@ts-ignore
window.perfsDic = {}

let pDic = {}

export const pe1 = (id) => {
	if (!pDic[id]) pDic[id] = []
	pDic[id][0] = performance.now();
}
export const pe2 = (id) => {
	pDic[id][1] = performance.now();
	let a = pDic[id]
	let diff = a[1] - a[0]
	console.error(`[PERFORMANCE] ${id} = ${diff} ms`, a);
	// return performance.now();
}
