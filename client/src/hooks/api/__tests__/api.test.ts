// JEST IMPORT to avoid textEncode error

// @ts-ignore
// if there are reorder error, that okay
import { configClient } from "../../../config";
import { getApi } from "../api.hook";

// import { getApi } from "../api.hook";
// import 'text-encoding';


test('nothing', (done) => {
	// getApi(api => {
	// 	console.log(12, api)
	// 	expect(1).toEqual(1);
	// 	done()
	// })
	console.log(111, configClient)
	getApi(api => {
		console.log(222, api)
		expect(1).toEqual(1);
		done()
	})
});
export { }
