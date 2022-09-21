import React from 'react';
// import ReactDOM from 'react-dom';
import { App } from './App';
import { Test } from './Test';

import { createRoot } from 'react-dom/client';
const container = document.getElementById('root');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<App />);
// root.render(<Test />);

// ReactDOM.render(
// 	<App />,
// 	document.getElementById('root')
// );

