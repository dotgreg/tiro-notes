//@ts-nocheck
const h = "[MARKETPLACE-HTML] generatePluginsMarketplaceHtml"

//
// HTML
//
function generatePluginsMarketplaceHtml(p) {
    let onPluginClick = p.onPluginClick ? p.onPluginClick : (plugin) => {console.log(h, "on plugin click", plugin)}
    let pluginsDescriptions = p.pluginsDescriptions ? p.pluginsDescriptions : []

    console.log(h, {pluginsDescriptions});
    let html = `<div class="plugins-list-wrapper">`
    
    each(pluginsDescriptions, plugin => {
        const imagePlaceholder = ""
        const firstImage = (plugin.images && plugin.images[0]) ? plugin.images[0] : imagePlaceholder
        const onClickAction = ssrFn(`plugin-click-id-${plugin.name}`, () => {onPluginClick(plugin)})
        html += `
            <div class="plugin-item-wrapper">
                <div class="plugin-item-content" onClick="${onClickAction}">
                    <div class="plugin-item-title"> ${plugin.name} </div>
                    <div class="plugin-item-description"> ${plugin.name} </div>
                </div>
                <div class="plugin-item-image" style="background-image: url('${firstImage}')">
                </div>
            </div>
        `.trim()
    })  

    html += `</div>`
    return html + generateStyle()
}

//
// CSS
//
const generateStyle = () => {
    let styleStr = `
        html, body {
            font-family: arial, sans-serif;
        }
        .plugins-list-wrapper {
            display: flex;
            flex-wrap: wrap;
            // width: 400px;
            overflow:auto;
        }

        .plugins-list-wrapper .plugin-item-wrapper {
            cursor: pointer;
            // display:inline-block;
            width: calc(25% - 40px);
            padding: 10px;
            margin: 5px;
            background: #ededed;
            border-radius: 10px;
            display: flex;
            height: 80px;
        }

        .plugins-list-wrapper .plugin-item-wrapper	.plugin-item-content {
            width: 60%;
        }
        .plugin-item-content .plugin-item-title {
            font-size: 11px;
            font-weight: bold;
        }
        .plugin-item-content .plugin-item-description {
            font-size: 10px;
        }
        .plugin-item-image {
            width: 40%;
            height: 100%;
            width: 40%;
            height: 100%;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
    `
    return `<style>${styleStr}</style`
}

//
// SUPPORT FUNCS
//
const each = (itera, cb) => {
    if (itera.constructor === Array) {
      for (let i = 0; i < itera.length; ++i) {
        cb(itera[i])
      }
    } else {
      for (const property in itera) {
        cb(itera[property], property)
      }
    }
  }
   

//
// SSR ACTIONS
//@ts-ignore
window.ssrActionsPluginsMarketDic = {}

const ssrFn = (id , action) => {
	let onclickString = `window.ssrActionsPluginsMarketDic['${id}'](this)`
	//@ts-ignore
	let dic = window.ssrActionsPluginsMarketDic
	if (!dic[id]) {
		// console.log("SSR ACTION INIT", id, action);
		dic[id] = (el) => {
			action(el)
		}
	}
	return onclickString
}


//
// FINAL EXPORT
//  
if (typeof window !== 'undefined') {
    window._tiro_generatePluginsMarketplaceHtml = generatePluginsMarketplaceHtml
}
