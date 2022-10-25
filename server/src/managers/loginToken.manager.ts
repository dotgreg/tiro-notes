import { each } from "lodash"
import { sharedConfig } from "../../../shared/shared.config"
import { backConfig } from "../config.back"
import { makeRandomString } from "../helpers/string.helper"
import { log } from "./log.manager"
import { verifyPassword } from "./password.manager"

// CURR
// if user/passwd OK => get current token (OR GEN IT)
// NEXT
// if user/passwd OK => return token from checkUserPassword
// client token got (he doest know its role) => send to backend token
// BACKEND on each request => hasRights(token, "editor")

//
// USER/PASSWORD CHECK SYSTEM
//
export const checkUserPassword = async (user: string, password: string): Promise<boolean> => {
	if (user === "viewer") {
		const isUserGood = backConfig.jsonConfig.users_viewer_user_enable === "true"
		const isPasswordGood = backConfig.jsonConfig.users_viewer_user_password === password
		return isPasswordGood && isUserGood
	} else {
		const isUserGood = user === backConfig.jsonConfig.user
		const isPasswordGood = await verifyPassword(password, backConfig.jsonConfig.password)
		return isPasswordGood && isUserGood
	}
}


//
// TOKEN MANAGEMENT SYSTEM
//
let memoryTokens: { [userName: string]: string } = {}
export const getUserToken = (user: string): string => memoryTokens[user]
export const generateNewToken = () => {
	let newToken = makeRandomString(60)
	log(`[LOGIN TOKEN] generate new token ${newToken}`);
	return newToken
}
export const regenerateTokensInMemory = () => {
	let userName = backConfig.jsonConfig.user
	let hasViewerUser = backConfig.jsonConfig.users_viewer_user_enable === "true"
	memoryTokens[userName] = generateNewToken()
	if (hasViewerUser) memoryTokens["viewer"] = generateNewToken()
}
export const getUserFromToken = (clientToken: string): iUser | false => {
	let res: iUser | false = false
	each(memoryTokens, (tok, userName) => {
		let user = getUser(userName)
		if (tok === clientToken && user) res = user
	})
	return res
}


//
// ROUGH AND BASIC ROLE MANAGEMENT 
//
export type iRole = "editor" | "viewer"
interface iUser {
	name: string
	roles: iRole[]
}
const getUser = (userName: string): iUser | false => {
	if (userName === backConfig.jsonConfig.user) {
		return { name: userName, roles: ["editor", "viewer"] }
	}
	else if (userName === "viewer") {
		return { name: "viewer", roles: ["viewer"] }
	}
	else return false
}




//
// INIT TOKEN INTERVAL LOGIC
//
const startIntervalTokenResfresh = (hours: number) => {
	log(`[LOGIN TOKEN] startIntervalTokenResfresh every ${hours} hours = ${1000 * 60 * 60 * hours} seconds`);

	setInterval(() => {
		regenerateTokensInMemory()
	}, 1000 * 60 * 60 * hours)
}
const startTokenAppBackend = () => {
	// refreshing token every x hours
	regenerateTokensInMemory()
	startIntervalTokenResfresh(sharedConfig.tokenRefreshInHours)
}
startTokenAppBackend()
