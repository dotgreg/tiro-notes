import { Global, css } from '@emotion/react'

import { printCss } from "./print.style.manager";
import { cssVars } from "./vars.style.manager";

export const GlobalCssApp = () => css`
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
//   overflow: hidden;
  background: ${cssVars.colors.bg.light};
  font-size: 11px;
  font-family:${cssVars.font.main};
}
html, body {
  height: 100vh;
  overflow:hidden;
background: ${cssVars.colors.bgInterface};
}

button,
input {
  font-family:${cssVars.font.main};
  font-weight: 700;
  color: ${cssVars.colors.l2.title};
}


${printCss}


body {
  position: relative;
}

`
