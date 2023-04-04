import { each } from "lodash"
import { getRessourceIdFromUrl } from "../../../shared/helpers/id.helper"
import { regexs } from "../../../shared/helpers/regexs.helper"
import { sharedConfig } from "../../../shared/shared.config"
import { getApi } from "../hooks/api/api.hook"
import { getBackendUrl } from "./sockets/socket.manager"

export type iUrlInfos = { [key: string]: string }
export const getUrlPreview = (url: string): Promise<iUrlInfos> => {

	return new Promise((resolve, rej) => {
		const getCachedRessourceFolder = () => `/.tiro/cache/preview-url/`
		getApi(api => {
			api.ressource.download(url, getCachedRessourceFolder(), res => {
				if (res.message) {
					const staticPath = `${getBackendUrl()}/${sharedConfig.path.staticResources}/${getCachedRessourceFolder()}${getRessourceIdFromUrl(url)}`

					fetch(staticPath).then(function (response) {
						return response.text();
					}).then(function (data) {
						// console.log(data);
						let rawHTML = data
						let titleRes = [...rawHTML.matchAll(regexs.titleHtml)]
						let metasRes = [...rawHTML.matchAll(regexs.metasHtml)]

						const res: iUrlInfos = {}
						each(metasRes, m => {
							if (!m[3] || !m[2]) return;
							res[m[2]] = m[3]
						})
						each(titleRes, m => {
							if (!m[1] || !m[2]) return;
							res[m[1]] = m[2]
						})
						resolve(res)

					}).catch(function (err) {
						console.warn('Something went wrong.', err);
					});
				}
			})
		})
	})
}
