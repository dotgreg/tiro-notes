var fs = require('fs');
var path = require('path');

import { each } from "lodash"
const h = "[MARKETPLACE GEN]"

const paths = {
    pluginsFolder: "../../plugins",
    finalJsonPath: "../marketplace.json"
}

type iPluginPresentation = {
    name: string,
}

const generateMarketplaceJson = (): void => {
    console.log(h, '========== START ============ ');
    let folderPathToScan: string = paths.pluginsFolder
    const marketplaceArray: any[] = [];

    const scanFolder = (folderPath: string, parent:string): void => {
        const files = fs.readdirSync(folderPath);
        
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                scanFolder(filePath, folderPath); // Recursively scan subfolders
            } else if (file.endsWith('.plugin.js')) {
                let pluginName = file.split(".plugin.js").join("")
                let pluginPresentation = {
                    name: pluginName,
                    pluginPath: path.join(folderPath, file).split(paths.pluginsFolder).join(""),
                    description: `Description of ${pluginName}`,
                    versions : [],
                    images: [],
                    icon: null,
                    configuration: []
                }
                console.log(h, 'plugin file found! =>', file);
                const pluginContent = fs.readFileSync(filePath, 'utf-8');
                const pluginArray = new Function(pluginContent)() 
                each(pluginArray, subPlugin => {
                    // console.log(subPlugin)
                    if (subPlugin.plugin_infos){
                        let inf = subPlugin.plugin_infos
                        if (inf.name) pluginPresentation.name = inf.name
                        if (inf.description) pluginPresentation.description = inf.description
                        if (inf.versions) pluginPresentation.versions = inf.versions
                        if (inf.images) pluginPresentation.images = inf.images
                        if (inf.icon) pluginPresentation.icon = inf.icon
                        if (inf.configuration) pluginPresentation.configuration = inf.configuration
                    }
                })
                marketplaceArray.push(pluginPresentation);
            }
        }
    };

    scanFolder(folderPathToScan, "");
    console.log(JSON.stringify(marketplaceArray))

    const jsonContent = JSON.stringify(marketplaceArray, null, 2);
    fs.writeFileSync(paths.finalJsonPath, jsonContent);

    console.log(h, 'Marketplace JSON file generated successfully.');
    console.log(h, '========== ENDS ============ ');
};

generateMarketplaceJson()