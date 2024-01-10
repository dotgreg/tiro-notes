import React from "react";
import { App } from './App';
import { renderReactComponent } from './managers/reactRenderer.manager';
import { PublicApp } from "./PublicApp";

// if /public_site detected in url, render PublicApp.
if (window.location.pathname.startsWith('/public_site')) {
    renderReactComponent(<PublicApp />, document.getElementById('root'))
} else {
    renderReactComponent(<App />, document.getElementById('root'))
}

