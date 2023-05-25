import { createTheme } from "@uiw/codemirror-themes";
import { styleTags, Tag, tags as t } from "@lezer/highlight";
import { MarkdownConfig } from "@lezer/markdown";
import { cssVars } from "../style/vars.style.manager";
import { MdCustomTags } from "./markdownPreviewPlugin.cm";

export const getCustomTheme = () => createTheme({
	theme: "light",
	// tokenTable: {

	// },
	settings: {
		background: "#ffffff",
		foreground: "#4D4D4C",
		caret: "#AEAFAD",
		selection: "#D6D6D6",
		selectionMatch: "#D6D6D6",
		gutterBackground: "#FFFFFF",
		gutterForeground: "#4D4D4C",
		gutterBorder: "#ddd",
		lineHighlight: "#fff",
	},
	styles: [
		{ tag: t.comment, color: "#787b80" },
		{ tag: t.definition(t.typeName), color: "#194a7b" },
		{ tag: t.typeName, color: "#194a7b" },
		{ tag: t.tagName, color: "#008a02" },
		{ tag: t.variableName, color: "#1a00db" },
		{ tag: t.heading, color: cssVars.colors.main },

		{ tag: customTags.Image, color: "red", class: "tiro-image" },
		{ tag: MdCustomTags.LatexMdEl, class: "cm-mdpreview-latex-code mdpreview-source" },
		{
			tag: t.heading1,
			class: "actionable-title h1"
		},
		{
			tag: t.heading2,
			class: "actionable-title h2"
		},
		{
			tag: t.heading3,
			class: "actionable-title h3"
		},
		{ tag: t.heading4, class: "actionable-title h4" },
		{ tag: t.heading5, class: "actionable-title h5" },
		{ tag: t.heading6, class: "actionable-title h6" },
		{ tag: t.quote, class: "test333" },
		{ tag: t.monospace, class: "test3334" },
		{ tag: t.separator, class: "t1" },
		{ tag: t.operator, class: "t2" },
		{ tag: t.punctuation, class: "t3" },
		{ tag: t.paren, class: "t4" },
		{ tag: t.brace, class: "t5" },
		{ tag: t.contentSeparator, class: "t6" },
		{ tag: t.annotation, class: "t7" },
		// { tag: t.special, class: "t8" },

		{ tag: t.content, fontSize: "10px" }
	]
});

// V6
export const realCustomTags = {
	ImageTwo: Tag.define(),
	// Imag: Tag.define(),
};
const ImageTwoDelim = { resolve: "ImageTwo" };
export const ImageTwo = {
	defineNodes: ["ImageTwo"],
	parseInline: [{
		name: "ImageTwo",
		parse(cx, next, pos) {
			// if (next != 126 /* '~' */ || cx.char(pos + 1) != 126) {
			//https://software.hixie.ch/utilities/cgi/unicode-decoder/character-identifier?characters=%24
			// if (next != 33 /* '![' */ || cx.char(pos + 1) != 91) {
			// 	return -1;
			// }
			// return cx.addDelimiter(ImageTwoDelim, pos, pos + 2, true, true);


			// ![
			// if (cx.char(pos + 1) === 33) {
			// if (cx.char(pos + 1) === 33 && cx.char(pos + 2) === 91) {
			if (next === 33 && cx.char(pos + 1) === 91) {
				let isBegin = false
				if (!cx.char(pos - 1)) isBegin = true
				// console.log(next, cx.char(pos + 1), pos, isBegin, cx);
				return cx.addDelimiter(ImageTwoDelim, pos, pos + 2, true, false);
				// return cx.addDelimiter(ImageTwoDelim, pos, pos + 2, true, true);
			}
			else if (next === 41) {
				// return cx.addDelimiter(ImageTwoDelim, pos, pos + 2, true, false);
				return cx.addDelimiter(ImageTwoDelim, pos, pos + 1, false, true);
			}
			// )
			// else if (next === 40) {
			// 	return cx.addDelimiter(ImageTwoDelim, pos, pos, false, true);
			// }
			else {
				return -1
			}
		},
		after: "Emphasis"
	}],
	props: [
		styleTags({
			ImageTwo: realCustomTags.ImageTwo,
			// ImageTwoMark: realCustomTags.ImageTwoMark,
			// ImageTwoMark: t.processingInstruction,
			'Strikethrough/...': realCustomTags.ImageTwo
		})
	]
}

// v4 : with what we already have as tags
export const customTags = {
	ListItem: Tag.define(),
	headingMark: Tag.define(),
	LinkReference: Tag.define(),
	Image: Tag.define(),
	LinkTitle: Tag.define(),
	LinkLabel: Tag.define(),
	Link: Tag.define(),
	LinkMark: Tag.define(),
	BulletList: Tag.define(),
};
const MarkStylingExtension: MarkdownConfig = {
	props: [
		styleTags({
			LinkReference: customTags.LinkReference,
			ListItem: customTags.ListItem,
			Link: customTags.Link,
			Image: customTags.Image,
			LinkTitle: customTags.LinkTitle,
			LinkLabel: customTags.LinkLabel,
			LinkMark: customTags.LinkMark,
			BulletList: customTags.BulletList,
		}),
	],
};
