import { isString } from "lodash";
import { strings } from "./strings.manager";

const monthNames = ["January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December"
];
const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "June",
	"July", "Aug", "Sept", "Oct", "Nov", "Dec"
];

export const formatDateEditor = (d: Date): string => {
	var datestring = d.getDate() + "  " + monthNames[d.getMonth()] + " " + d.getFullYear() + " at " +
		d.getHours() + "h" + d.getMinutes();
	return datestring
}

export const formatDateList = (d: Date): string => {

	let diff = (new Date().getTime() - d.getTime()) / 1000
	let anHour = 3600
	let aDay = 86400
	let aWeek = 604800
	let datestring = ''

	// if < 1h, "x min ago"
	if (diff <= anHour) {
		datestring = `${Math.ceil(diff / 60)} ${strings.minsAgo}`
	}
	// if < 1d, "x hours ago"
	else if (diff > anHour && diff <= aDay) {
		datestring = `${Math.ceil(diff / (60 * 60))} ${strings.hoursAgo}`
	}
	// if < 7d, "x days ago"
	else if (diff > aDay && diff <= aWeek) {
		datestring = `${Math.ceil(diff / (60 * 60 * 24))} ${strings.daysAgo}`
	}
	// if > 7d, "22 March 2021"
	else if (diff > aWeek) {
		let day = ('0' + d.getDate()).slice(-2);
		let month = strings.months[d.getMonth()];
		let year = d.getFullYear().toString()
		datestring = `${day} ${month} ${year}`
	}

	return datestring
}

//
// SUPPORT FUNCTION 
export type iADate = [number, number, number]
export const tsToIADate = (timestamp?: number): iADate => {
	if (!timestamp) timestamp = new Date().getTime()
	let d = new Date(timestamp)
	let res: iADate = [d.getFullYear(), d.getMonth() + 1, d.getDate()]
	return res
}

export const getTsFromString = (str: "lastMonth"): number => {
	let res = new Date().getTime()
	let now = res
	if (str === "lastMonth") {
		res = now - (1000 * 60 * 24 * 30) // arbitrarily take 30 days as last month timestamp
	}
	return res
}
