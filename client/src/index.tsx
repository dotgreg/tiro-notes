import React from "react";
import { App } from './App';
import { renderReactComponent } from './managers/reactRenderer.manager';

renderReactComponent(<App />, document.getElementById('root'))
