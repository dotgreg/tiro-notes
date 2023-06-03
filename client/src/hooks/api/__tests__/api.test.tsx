import React from 'react';
import { getApi } from "../api.hook";
import { render } from '@testing-library/react';
import { App } from "../../../App"

test('api.file.getContent + saveContent working', (done) => {
	const { getByText } = render(<App />);
	getApi(api => {
		api.file.saveContent("test1.md", "test1")
		setTimeout(() => {
			api.file.getContent("test1.md", txt => {
				expect(txt).toEqual("test1");
				done()
			})
		}, 200)

	})
});

// test('API:CACHE:get/set', (done) => {
// 	const { getByText } = render(<App />);
// 	getApi(api => {
// 		api.cache.set("cacheId1", "test1")
// 		setTimeout(() => {
// 			api.cache.get("cacheId1", txt => {
// 				expect(txt).toEqual("test1");
// 				done()
// 			})
// 		}, 100)
// 	})
// });
// export { }
