const plugin_infos = {
  versions: [
    {version: "0.1.0", date: "15/05/26", comment: "initial version with viewerjs"},
  ]
}

let isDev = false
let baseUrl = "http://dev111111111111.websocial.cc:8088/"
if (!isDev) baseUrl = "https://raw.githubusercontent.com/dotgreg/tiro-notes/master/plugins/"

return [
  {
    name: "slideshow",
    type: "tag",
    code: `
      [[script]]
      api.utils.canScrollIframe(true);
      return api.utils.loadCustomTag(
        "${baseUrl}slideshow/slideshow.tag.js",
        \`{{innerTag}}\`,
        {size: "90%", padding: false}
      )
      [[script]]
    `,
    plugin_infos,
  },
]