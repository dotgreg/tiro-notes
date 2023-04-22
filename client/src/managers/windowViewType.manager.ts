import { each } from "lodash";
import { iViewType } from "../../../shared/types.shared";
import { getApi } from "../hooks/api/api.hook";

export const getContentViewTag = (content: string): iViewType | false => {
	let res: iViewType | false = false
	let viewTypes: iViewType[] = ['editor', 'editor-with-map', 'both', 'preview']

	each(viewTypes, v => {
		if (content.includes(`--view-${v}`)) { res = v }
	})


	return res
}

const cacheId = `notes-view-type`
export const getNoteView = (notePath: string): Promise<iViewType | false> => {
	return new Promise((res, rej) => {
		getApi(api => {
			api.cache.get(cacheId, content => {
				if (!content) return
				let r = content[notePath]
				if (r) res(r as iViewType)
				else res(false)
			})
		})
	})
}

export const setNoteView = (notePath: string, viewType: iViewType) => {
	getApi(api => {
		api.cache.get(cacheId, content => {
			if (!content) content = {}
			content[notePath] = viewType
			api.cache.set(cacheId, content, -1)
		})
	})
}
