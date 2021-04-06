import { Global, css } from '@emotion/react'

import { printCss } from "./print.style.manager";
import { cssVars } from "./vars.style.manager";

export const GlobalCssApp = css`
* {
  -webkit-print-color-adjust: exact !important; 
  color-adjust: exact !important;             
}
*:focus {
  outline: none;
}
body {
  margin: 0;
  padding: 0px;
  overflow: hidden;
  background: ${cssVars.colors.bg.light};
  font-size: 11px;
  font-family:${cssVars.font.main};
}
html, body {
  height: 100vh;
  overflow:hidden;
}

button,
input {
  font-family:${cssVars.font.main};
  font-weight: 700;
  color: ${cssVars.colors.l2.title};
}

@media print {
  ${printCss}
}

body {
  position: relative;
}



h3.subtitle {
  margin: 0px 0px ${cssVars.sizes.block}px 0px;
  font-family:${cssVars.font.main};
  text-transform: uppercase;
  font-size: 14px;
  font-weight: 800;
  font-style: italic;
  color: ${cssVars.colors.main};
}

.invisible-scrollbars {
  // invisible scrollbars
  height: 100vh;
  padding-right: 20px;
  width: 100%;
  box-sizing: content-box;
  overflow-y:scroll;
}

`