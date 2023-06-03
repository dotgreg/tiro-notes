// import { getApi } from "../api.hook";

import { configClient } from "../../../config";
import { getApi } from "../api.hook";

test('nothing', (done) => {
	// getApi(api => {
	// 	console.log(12, api)
	// 	expect(1).toEqual(1);
	// 	done()
	// })
	console.log(111, configClient)
	console.log(getApi)
	expect(1).toEqual(1);
	done()
});
export { }
