import "@fontsource/open-sans/index.css"
import "@fontsource/open-sans/800.css"
import "@fontsource/open-sans/700.css"
import "@fontsource/open-sans/400.css"

import decoBgMap from '../../assets/deco-bg-map.png'
import fileIcon from '../../assets/file-solid.svg'
import diskIcon from '../../assets/compact-disc-solid.svg'
//import diskIcon from '../../assets/file-solid.svg'
import pdfIcon from '../../assets/file-pdf-solid.svg'
import wordIcon from '../../assets/file-word-solid.svg'
import bookIcon from '../../assets/book-solid.svg'
import excelIcon from '../../assets/file-excel-solid.svg'
import videoIcon from '../../assets/file-video-solid.svg'
import audioIcon from '../../assets/file-audio-solid.svg'
import archiveIcon from '../../assets/file-zipper-solid.svg'
import presIcon from '../../assets/file-powerpoint-solid.svg'

import linkIcon from '../../assets/link-solid.svg'
import worldIcon from '../../assets/globe-africa-solid.svg'
import searchIcon from '../../assets/search-solid.svg'

import { css } from "@emotion/react"

const colors = {
	// https://coolors.co/E86666
	main2: '#E86666', //red orange
	main: 'rgba(232,102,102,1)', //red orange
	mainRGB: '232,102,102', //red orange

	dev: ['#C3668B', '#A766A7', '#CE66E8', '#E4E866'],
	compl: ['#11abf8', '#3fd7a4'],
	pal1: ['#5c1a70', '#ffa67c', '#ffda77'],
	grey1: '#797979',
	grey2: '#615f5f',

	green: 'green',
	l1: {
		bg: '#e1e1e1',
		font: '#615f5f',

	},
	l2: {
		bg: '#eeecec',
		title: '#797979',
		text: '#615f5f',
		date: '#b3b2b2',

	},
	editor: {
		bg: '#ffffff',
		// font: '#959595' ,
		font: '#525252',
		interfaceGrey: '#d4d1d1',
		mobileToolbar: {
			bg: '#e1e1e1',
			font: '#747474'
		}
	},
	bg: {
		l1: '#e1e1e1',

		dark: 'rgb(39, 39, 39)',
		grey: 'rgb(221, 221, 221)',
		// light: '#fceeded6'
		light: '#FFFFFF',
		black: '#000000'
	},
	font: {
		light: '#FFFFFF',
		black: '#000000'
	}
}

let block = 15
const sizes = {
	desktop: {
		l: 37, l1: 37, l2: 63,
		r: 63
	},
	search: { h: 94, padding: 10 },
	gallery: {
		topH: 100
	},
	block: block,
	scrollbar: 17,
	l2: {
		fileLi: {
			height: 77,
			padding: 5,
			margin: 5,
			img: 67,
		}
	},
	editor: {
		padding: block * 3,
	},
	mobile: {
		bottomBarHeight: 50,
		editorBar: 40,
		editorTopWrapper: 100,
	}
}

const font = {
	main: `'Open sans', sans-serif`,
	editor: `Consolas, monaco, monospace`
}
const other = {
	radius: `border-radius: 5px;`,
}

const elsObjs = {
	submitButton: {
		marginTop: "10px",
		background: 'none',
		border: 'none',
		padding: '10px 20px',
	},
}
const els = {
	button: `
      background: none;
      border: none;
    `,
	images: `
      border-radius: 7px;
      box-shadow: 0px 0px 10px rgb(0 0 0 / 10%);
      max-width: 100%;
    `,
	imageInfos: `
      position: absolute;
      top: 0px;
      height: 55px;
      left: 0px;
      width: 100%;
      background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%);
      ul {
        margin-top: 5px;
        justify-content: flex-end;
      }
    `,
	redButton: `
      border: none;
      background: ${colors.main};
      &:hover {
          background: rgba(${colors.mainRGB},0.8);
      }
      color: white;
      border-radius: 5px;
      cursor: pointer;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    `,
}

const assets = {
	decoBgMap,
	linkIcon,
	worldIcon,

	fileIcon,
	diskIcon,
	pdfIcon,
	presIcon,
	audioIcon,
	videoIcon,
	excelIcon,
	wordIcon,
	bookIcon,
	archiveIcon,

	searchIcon
}

export const cssVars = {
	els,
	colors,
	elsObjs,
	font,
	sizes,
	other,
	assets
}


