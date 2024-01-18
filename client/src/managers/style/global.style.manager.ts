import { Global, css } from '@emotion/react'

import { printCss } from "./print.style.manager";
import { cssVars } from "./vars.style.manager";
import { getUserSettingsSync } from '../../hooks/useUserSettings.hook';
import { getFontSize } from '../font.manager';

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
  background: ${cssVars.colors.bg.light};
  font-size: ${getFontSize(+1)}px;
  font-family:${cssVars.font.main};
}
html, body {
  // height: 100vh;
  height: 100vh;
  overflow:hidden;
background: ${cssVars.colors.bgInterface};
}

// pushing height 100% down
#root {
  height: 100%
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
