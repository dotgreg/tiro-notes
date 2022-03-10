import { replaceCustomMdTags } from "./markdown.manager";

export const transformMarkdownScripts = (bodyRaw: string): string => {

	let res = replaceCustomMdTags(bodyRaw, '[[script]]', (input: string) => {
		const func = `
const toeval = function () {
${input};
}
toeval();`;
		//console.log('wooop', input, func);
		return eval(func);
	});

	return res;
};
