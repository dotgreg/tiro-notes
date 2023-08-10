//@ts-nocheck
// file source : tiro/client/src/components/settingsView/generatePluginsMarketplaceHtml.js
const h = "[MARKETPLACE-HTML] generatePluginsMarketplaceHtml"

//
// HTML
//
function generatePluginsMarketplaceHtml(p) {
    let onPluginClick = p.onPluginClick ? p.onPluginClick : (plugin) => {console.log(h, "on plugin click", plugin)}
    let onSettingChange = p.onSettingChange ? p.onSettingChange : (p2) => {console.log(h, "on setting change", p2)}
    let pluginsDescriptions = p.pluginsDescriptions ? p.pluginsDescriptions : []
    let  isFullDisplayMode = p.fullDisplayMode

    // pluginsDescriptions = [...pluginsDescriptions,...pluginsDescriptions,...pluginsDescriptions]
    // pluginsDescriptions = [...pluginsDescriptions,...pluginsDescriptions,...pluginsDescriptions]

    console.log(h, {pluginsDescriptions});
    let html = `<div class="plugins-marketplace-wrapper">`
    html += `<div class="plugins-list-wrapper">`
    const isMobile = deviceType() === "mobile"

    const setD = (id, value) => document.getElementById("detail-"+id).innerHTML = value
    
    
    //
    // HTML LIST 
    //
    each(pluginsDescriptions, plugin => {
        const imagePlaceholder = ""
        let icon = plugin.icon
        if (!icon) icon = (plugin.images && plugin.images[0]) ? plugin.images[0] : imagePlaceholder
        const onClickAction = ssrFn(`plugin-click-id-${plugin.name}`, () => {
            onPluginClick(plugin)
            openDetailPanel(plugin)
        })
        
        const overviewLimitChars = 100
        let overview = plugin.description.substr(0, overviewLimitChars)
        if (plugin.description.length > overviewLimitChars) overview += "..."

        html += `
            <div class="plugin-item-wrapper">
                <div class="plugin-item-content" onClick="${onClickAction}">
                    <div class="plugin-item-title"> ${plugin.name} </div>
                    <div class="plugin-item-description"> ${overview} </div>
                </div>
                <div class="plugin-item-icon" style="background-image: url('${icon}')">
                </div>
            </div>
        `.trim()
    })  

    //
    // DETAIL POPUP LOGIC
    //
    const openDetailPanel = (plugin) => {
        document.getElementById("plugin-detail-wrapper").classList.add("show")
        setD("title", plugin.name)
        setD("description", plugin.description)

        const genSettingsField = (type, id, defaultVal) => {
            let resHtml = ""
            const onChangeAction = ssrFn(`setting-onchange-id-${id}`, (e) => {
                let nval = type === "checkbox" ? e.checked : e.value
                onSettingChange({plugin, type,id, value: nval})
            })
            if (type === "checkbox") {
                let checked = defaultVal === true ? "checked='checked'" : ""
                resHtml += `<input type="checkbox" ${checked} onChange="${onChangeAction}" />`
            } else if  (type === "text") {
                resHtml += `<input type="text" value="${defaultVal}"  onkeyup="${onChangeAction}" />`
            }
            return resHtml
        }

        if (isFullDisplayMode && plugin.configuration.length > 0) {
            let settingsHtml = `<h3>Settings</h3><table>`
            settingsHtml += `<thead><tr>`
                settingsHtml += `<th>Id</th>`
                settingsHtml += `<th>Field</th>`
                settingsHtml += `<th>Description</th>`
            settingsHtml += `</tr><thead>`
            settingsHtml += `</thead>`
            settingsHtml += `<tbody>`
            plugin.configuration.map(cnf => {
                settingsHtml += `<tr>
                    <td>${cnf.id}</td>
                    <td>${genSettingsField(cnf.type, cnf.id, "woop")}</td>
                    <td>${cnf.description}</td>
                </tr>`
            })
            settingsHtml += `</tbody></table>`
            setD("settings", settingsHtml)
        } else {
            setD("settings", "")
        }


        let versionHtml = `<h3>Install</h3><table>`
        versionHtml += `<thead><tr>`
            versionHtml += `<th>Version</th>`
            versionHtml += `<th>Date</th>`
            versionHtml += `<th>Description</th>`
            versionHtml += `<th>Install</th>`
        versionHtml += `</tr><thead>`
        versionHtml += `</thead>`
        versionHtml += `<tbody>`
        plugin.versions.map(version => {
            versionHtml += `<tr>
                <td>${version.version}</td>
                <td>${version.date}</td>
                <td>${version.comment}</td>
                <td><button ${isFullDisplayMode ? "" : "disabled"}>Install</button></td>
            </tr>`
        })
        versionHtml += `</tbody></table>`
        setD("versions", versionHtml)

        

        if(plugin.icon) setD("icon", `<img class="plugin-images" src="${plugin.icon}" />`)
        let imgsHtml = `<table>`
        plugin.images.map(imgSrc => {
            imgsHtml += `<img class="plugin-images" src="${imgSrc}" />`
            // imgsHtml += `<img class="plugin-images" src="${imgSrc}" />`
            // imgsHtml += `<img class="plugin-images" src="${imgSrc}" />`
            // imgsHtml += `<img class="plugin-images" src="${imgSrc}" />`
            // imgsHtml += `<img class="plugin-images" src="${imgSrc}" />`
            // imgsHtml += `<img class="plugin-images" src="${imgSrc}" />`
            // imgsHtml += `<img class="plugin-images" src="${imgSrc}" />`
        })
        setD("images", imgsHtml)
    }
    const closeDetailPanel = () => {
        document.getElementById("plugin-detail-wrapper").classList.remove("show")
    }

    const onClickClose = ssrFn(`plugin-click-close`, () => {
        closeDetailPanel()
    })

    //
    // HTML DETAILS 
    //
    html += `</div>`
    html += `<div id="plugin-detail-wrapper">`  
        html += `<div id="detail-close" onClick="${onClickClose}">x</div>`  
        html += `<div id="detail-left">`  
            html += `<h1 id="detail-title"></h1>`  
            html += `<div id="detail-description"></div>`  
            // html += `<h2 id="detail-versions-title">Versions:</h2>`  
            html += `<div id="detail-versions"></div>`  
            html += `<div id="detail-settings"></div>`  
        html += `</div>`
        html += `<div id="detail-right">`  
            html += `<div id="detail-icon"></div>`  
            html += `<div id="detail-images"></div>`  
        html += `</div>`
        html += `</div>`
        html += `<div id="detail-configuration"></div>`  
    html += `</div>`
    html += `</div>`
    html += `</div>`
    return html + generateStyle(isMobile)
}

//
// CSS
//
const generateStyle = (isMobile) => {
    const widthSqrt = isMobile ? "50%" : "25%"
    let styleStr = `
        html, body {
            font-family: arial, sans-serif;
        }

        /*
          Version table CSS
        */
        table {
            border-spacing: 0px;
            width: 100%;
        }
        thead tr th{
            padding: 8px;
        }
        tbody {
            text-align: left;
        }
        tbody tr {
            cursor: pointer;
            background: #f1f0f0;
        }
        tbody tr:nth-child(2n) {
            background: none;
        }
        tbody td {
            padding: 8px;
        }

        /*
          DETAILS CSS
        */

        #plugin-detail-wrapper {
            overflow: hidden;
            overflow-y: ${isMobile ? "auto" : "hidden"};
            display:none;
            width: calc(100% - 40px);
            height: calc(100% - 70px);
            z-index: 3;
            position: absolute;
            top: 30px;
            left: 0px;
            background: white;
            padding: 20px;
            border-radius: 7px;
        }
        #plugin-detail-wrapper.show {
            display:${isMobile ? "block" : "flex"};
        }
        #detail-close {
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 13px;
            background: white;
            padding: 3px 7px;
            border-radius: 100;
            box-shadow: 0px 0px 5px #0006;
            cursor: pointer;
            border-radius: 110px;
            z-index: 3;
        }
        
        #detail-left {
            width: ${isMobile ? "100" : "70"}%;
            overflow-y: auto;
        }
            #detail-title {
                font-size: 31px;
                margin-bottom: 20px;
                font-weight: bold;
                margin-top: 0px;
            }
            #detail-description {
                margin: 0px;
                margin-bottom: 30px;
                
            }
            #detail-versions {
            }

        #detail-right {
            width: ${isMobile ? "100" : "30"}%;
           
            position: relative;
        }
            #detail-icon {
                position: absolute;
                left: -50px;
            }
            #detail-icon img{ 
                width: 30px;
            }
            #detail-images {
                margin-top: ${isMobile ? "30" : "0"}px;
                display: block;
                height: 100%;
                overflow: hidden;
                overflow-y: auto;
            }
            #detail-images img {
                max-width: calc(100% - 20px);
                border-radius: 8px;
                box-shadow: 0px 0px 5px #0006;
                margin: 7px;
            }


        /*
        // LIST CSS
        */

        .plugins-list-wrapper {
            display: flex;
            flex-wrap: wrap;
            // width: 400px;
            overflow:auto;
        }

        .plugins-list-wrapper .plugin-item-wrapper {
            cursor: pointer;
            // display:inline-block;
            width: calc(${widthSqrt} - 40px);
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
        .plugin-item-icon {
            width: 40%;
            height: 100%;
            width: 40%;
            height: 100%;
            background-size: 30px;
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

const deviceType = () => {
	let deviceWidth = window.innerWidth
	let res = 'desktop'
	if (isPhysicalDesktop()) {
		if (deviceWidth < 500) res = 'mobile'
	} else {
		if (deviceWidth < 1000) res = 'tablet'
		if (deviceWidth < 500) res = 'mobile'
	}
	return res
}
const isPhysicalDesktop = () => !isPhysicalMobileAndTablet()
const isPhysicalMobileAndTablet = () => {
	let check = false;
	//@ts-ignore
	(function(a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
	return check;
}


//
// FINAL EXPORT
//  
if (typeof window !== 'undefined') {
    window._tiro_generatePluginsMarketplaceHtml = generatePluginsMarketplaceHtml
}
