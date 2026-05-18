const plugin_infos = {
    versions: [
        { version: "0.1.0", date: "18/05/26", comment: "Initial release", hash: "..." }
    ],
    description: "A custom tag plugin to create image slideshows from a list of URLs",
    images: [],
    icon: null,
    configuration: []
}

return [
    {
        name: "slideshow",
        type: "tag",
        code: `[[script]] window.disableCache=true; return api.utils.loadCustomTag("plugins/slideshow/slideshow.ctag.js", \`{{innerTag}}\`, {size:"100%", padding:false}) [[script]]`,
        plugin_infos
    }
]