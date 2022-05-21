import { z } from "zod";

// override Function type to be compatible with zod infered ts 

export const obj = z.object
export const string = z.string()
export const number = z.number()
export const boolean = z.boolean()
export const fn = z.function()
export type Function = z.infer<typeof fn>

// export const func = (args, res) => {
// 	return z.function()
// 		.args(...args)
// 		.returns(res)
// }

// export const getType = (T) => z.infer < typeof T >



// exporting z
export default z  
