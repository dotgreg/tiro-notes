import { isString } from "util";

const addZero = (nb: number) => {
	return ('0' + nb).slice(-2);
}
const readDateStringInput = (dateString?: string | number): Date => {
	let d = new Date()
	if (!dateString || dateString === "" || dateString === "undefined") {
		d = new Date()
		// if datestring is in a customformat, parse it
	} else if (typeof dateString === "string") {
		let ndateString = dateString
		if (dateString.startsWith("f")) {
			ndateString = dateString.replace("f", "").replace("h", ":").replace("m", ":").replace("-", "/").replace("_", " ")
		} else if (dateString.startsWith("d")) {
			let arr = dateString.replace("d", "").split("-")
			ndateString = `${arr[1]}/${arr[0]}/${arr[2]}`
		} else if (dateString.startsWith("w")) {
			let arr = dateString.replace("w", "").split("-")
			let days = addZero((parseInt(arr[0])) * 7)
			ndateString = `${arr[1]}/${days}/${arr[2]}`
		}
		d = new Date(ndateString)
	} else {
		d = new Date(dateString)
	}
	return d
}

export const getDateObj = (dateString?: string | number) => {
	let d = readDateStringInput(dateString)
	let year = d.getFullYear()
	let month = d.getMonth() + 1
	let day = d.getDate()
	let syear = year.toString()
	let smonth = addZero((month));
	let sday = addZero(day);
	let hour = addZero(d.getHours());
	let min = addZero(d.getMinutes());
	let full = `${smonth}/${sday}/${syear} ${hour}:${min}`
	let full_file = `${smonth}-${sday}-${syear}_${hour}h${min}m`
	let date = `${smonth}/${sday}/${syear}`

	let num = {
		year, month, day, hour: d.getHours(), min: d.getMinutes(), timestamp: d.getTime(),
	}

	let raw = d

	//
	// functions
	//
	let getWeekNb = () => Math.ceil(day / 7);
	const getCustomFormat = (format: "full" | "day" | "week") => {
		let dateString = `f${full_file}`
		if (format === "day") dateString = `d${day}-${smonth}-${year}`
		if (format === "week") dateString = `w${getWeekNb()}-${smonth}-${year}`
		return `${dateString}`
	}


	return {
		year: syear, month: smonth, day: sday, hour, min,
		full, num, date, raw, full_file,
		getWeekNb, getCustomFormat
	}
}
