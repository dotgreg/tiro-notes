import { isString } from "util";

const addZero = (nb: number) => {
	return ('0' + nb).slice(-2);
}

// @ts-ignore
if (!String.prototype.replaceAll) {
	// @ts-ignore
	String.prototype.replaceAll = function(str, newStr){
		// If a regex pattern
		if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
			return this.replace(str, newStr);
		}
		// If a string
		return this.replace(new RegExp(str, 'g'), newStr);
	};
}

const readDateStringInput = (dateString?: string | number): Date => {
	let d = new Date()
	if (!dateString || dateString === "" || dateString === "undefined") {
		d = new Date()
		// if datestring is in a customformat, parse it
	} else if (typeof dateString === "string") {
		let ndateString = dateString
		let ndateString2 = dateString
		if (dateString.startsWith("f")) {
			// @ts-ignore
			ndateString = dateString.replaceAll("f", "").replaceAll("h", ":").replaceAll("m", ":00").replaceAll("-", "/").replaceAll("_", " ")
			let arr = ndateString.split("/")
			ndateString = `${arr[1]}/${arr[0]}/${arr[2]}` //arr2 = 2021 21:13:00
			ndateString2 = `${arr[0]}/${arr[1]}/${arr[2]}` // legacy format
		} else if (dateString.startsWith("d")) {
			// @ts-ignore
			let arr = dateString.replaceAll("d", "").split("_")[0].split("-") 
			// month/day/year
			ndateString = `${arr[1]}/${arr[0]}/${arr[2]}`
		} else if (dateString.startsWith("w")) {
			// @ts-ignore
			let arr = dateString.replaceAll("w", "").split("-")
			let days = addZero((parseInt(arr[0])) * 7)
			ndateString = `${arr[1]}/${days}/${arr[2]}`
		} else if (dateString.startsWith("h")) {
			// replace first h
			// @ts-ignore
			ndateString = dateString.replace("h", "").replaceAll("h", ":00:00").replaceAll("-", "/").replaceAll("_", " ")
			let arr = ndateString.split("/")
			ndateString = `${arr[1]}/${arr[0]}/${arr[2]}` //arr2 = 2021 21:13:00
		}
		let isFirstStringInvalid = Number.isNaN(new Date(ndateString).getDate())
		// console.log(dateString, ndateString, new Date(ndateString).getDate(),  isFirstStringInvalid, ndateString2, new Date(ndateString2).getDate())
		d = new Date(ndateString)
		// legacy full format
		if (isFirstStringInvalid) d = new Date(ndateString2)

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
	let full_fr = `${sday}/${smonth}/${syear} ${hour}:${min}`
	let full_file = `${smonth}-${sday}-${syear}_${hour}h${min}m`
	let full_file_fr = `${sday}-${smonth}-${syear}_${hour}h${min}m`
	let date = `${smonth}/${sday}/${syear}`
	let date_fr = `${sday}/${smonth}/${syear}`

	let num = {
		year, month, day, hour: d.getHours(), min: d.getMinutes(), timestamp: d.getTime(),
	}

	let raw = d

	//
	// functions
	//
	let getWeekNb = () => Math.ceil(day / 7);
	const getCustomFormat = (format: "full" | "hour" | "day" | "week") => {
		let dateString = `f${full_file_fr}`
		if (format === "day") dateString = `d${sday}-${smonth}-${year}`
		if (format === "week") dateString = `w${getWeekNb()}-${smonth}-${year}`
		if (format === "hour") dateString = `h${sday}-${smonth}-${year}_${hour}h`
		return `${dateString}`
	}


	return {
		year: syear, month: smonth, day: sday, hour, min,
		full, num, date, raw, full_file, full_file_fr,
		full_fr, date_fr,
		getWeekNb, getCustomFormat
	}
}
