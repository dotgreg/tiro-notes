import React from 'react';
import { configClient } from "../../../config";
import { getApi } from "../api.hook";
import { fireEvent, render } from '@testing-library/react';
import { App } from "../../../App"


test('nothing', (done) => {
	// getApi(api => {
	// 	console.log(12, api)
	// 	expect(1).toEqual(1);
	// 	done()
	// })
	const { getByText } = render(<App/>);
	getApi(api => {
		console.log(222, api)
	})
	expect(1).toEqual(1);
	done()
});
export { }
