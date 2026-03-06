/*
```js
*/
const plugin_infos = {
  versions: [
    
  ]
}

 
let dev = 1
let bgInterval = dev ? 0.1 : 11 
let disableCache = dev === 1 ? true : false

let sourcesRaw = `
[ev|/_demos/notes
` 

let baseUrl = "https://devd11111111111-3019-priv.websocial.cc/"
if (dev === 0) baseUrl = "https://raw.githubusercontent.com/dotgreg/tiro-notes/dev/plugins/"
console.log(123,baseUrl) 
let libUrl = `${baseUrl}/calendar/calendar.lib.js`

return [
{
  name: "calendar",
  type: "tag",
  code: `
    [[script]]
    window.disableCache = ${disableCache};
    return api.utils.loadCustomTag(
      "${baseUrl}/calendar/calendar.tag.js",
      \`{{innerTag}}\`,
       {size:"80%", padding: false, sourcesStr: \`${sourcesRaw}\`}
     )
    [[script]]
  `,
  plugin_infos,
},
{
  name: "calendar_bg",
  type: "background",
  code: `
      tiroApi.ressource.fetchEval(
        "${baseUrl}calendar/calendar.bg.js", 
        {tiroApi, bgState, config: {sourcesStr: \`${sourcesRaw}\`, libUrl:"${libUrl}", disableCache:${disableCache}}}, 
        {disableCache:${disableCache}}
      )
    `,
  plugin_infos,
  options: {
      background_exec_interval_in_min: bgInterval,
    }
}
]














