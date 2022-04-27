import {isNumber} from 'lodash'

export const increment = (nb: number | undefined): number => {
	let res = isNumber(nb) ? nb + 1 : 0
	return res
}
