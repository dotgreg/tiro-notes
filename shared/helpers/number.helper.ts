import {isNumber} from 'lodash'

export const increment = (nb: number | undefined): number => {
		if (!nb) nb = 0
	let res = isNumber(nb) ? nb + 1 : 0
	return res
}
