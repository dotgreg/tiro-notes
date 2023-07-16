var fs = require('fs');
var path = require('path');

import { each } from "lodash"
const h = "[MARKETPLACE GEN]"

const paths = {
    pluginsFolder: "../../plugins",
    finalJsonPath: "../marketplace.json"
}
    
const generateMarketplaceJson = (): void => {
    let folderPathToScan: string = paths.pluginsFolder
    const marketplaceArray: any[] = [];

    const scanFolder = (folderPath: string): void => {
        const files = fs.readdirSync(folderPath);

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                scanFolder(filePath); // Recursively scan subfolders
            } else if (file.endsWith('.plugin.js')) {
                console.log(h, 'plugin file found! =>', file);
                const pluginContent = fs.readFileSync(filePath, 'utf-8');
                const pluginArray = new Function(pluginContent)() 
                marketplaceArray.push(...pluginArray);
            }
        }
    };

    scanFolder(folderPathToScan);

    const jsonContent = JSON.stringify(marketplaceArray, null, 2);
    fs.writeFileSync(paths.finalJsonPath, jsonContent);

    console.log(h, 'Marketplace JSON file generated successfully.');
};

generateMarketplaceJson()