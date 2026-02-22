import * as ts from 'typescript';


//
// MANUAL JS METHODE
//
export const tsInterfaceToString = (interfaceObj: any): string => {
  let result = 'export interface {\n';

  for (const [key, value] of Object.entries(interfaceObj)) {
    if (typeof value === 'function') {
      // Get function signature
      const funcString = value.toString();
      const signature = funcString
        .replace(/^function\s*/, '')
        .replace(/\s*{[\s\S]*}/, '')
        .trim();

      result += `  ${key}: ${signature};\n`;
    }
  }

  result += '}';
  return result;
}




//
// TS COMPILER METHOD
//
export function getInterfaceDeclaration(node: ts.Node, sourceFile: ts.SourceFile): string {
  if (ts.isInterfaceDeclaration(node)) {
    return node.getText(sourceFile);
  }
  return '';
}


export const extractDocumentation = (obj: any, rootPathObj:string, url:string): any => {
    const methodStrings:any = {}
    
    function getFunctionSignature(name:string, func: Function): string {
        const str = func.toString();
        let res =  str.replace(/^function\s*\(/, '(')
                .replace(/\{[\s\S]*$/, '')
                .trim();

        let urlRootPath = `https://github.com/dotgreg/tiro-notes/tree/master/`
        let finalUrl = `${urlRootPath}${url}`
        let fullRootPathObj = `${rootPathObj}.${name}`
        // api.ai.search becomes api.call("ai.search", [...]) in the code, so we look for the last 2 parts of the path to find the related code
        let ctagApiCall = fullRootPathObj.replaceAll("api.", "api.call('") + "', [...])"
        let smallRootPathObj = `${fullRootPathObj.split('.').slice(-2).join('.')}`
        let searchUrlRootPath = `https://github.com/search?q=repo%3Adotgreg%2Ftiro-notes%20`
        let filtersSearch = `+language%3AJavaScript+OR+language%3ATypescript&type=code`
        filtersSearch = `+path%3A*.js+OR+path%3A*.tsx++OR+path%3A*.ts&type=code`
        let searchUrl = `${searchUrlRootPath}${smallRootPathObj}${filtersSearch}`
        // look for emit(HERE_IS_THE_SERVER_COMMAND_NAME, ...) to find the related server command name
        let relatedServerCommand:any = str.match(/emit\('([^']+)'\s*,\s*\{/);
        if (relatedServerCommand) { relatedServerCommand = relatedServerCommand[1]; }
        let searchUrlServer = `${searchUrlRootPath}${relatedServerCommand}+path%3Aserver%2Fsrc%2Froutes.ts+${filtersSearch}`
        let relatedServerStr = relatedServerCommand ? `
---
Related server command: ${relatedServerCommand}
- That frontend api method seems to be related to the server command "${relatedServerCommand}". You can find more information about it by following the link below.
${searchUrlServer}
        ` : '';



        let methodRes = `
DOCUMENTATION FOR API METHOD: ${fullRootPathObj}
======
Signature: ${res}
- For more details on the structure/type of each parameter, please check the source code url below
=======
Source code url 
${finalUrl}${relatedServerStr}
=======
Method usage and examples:
${searchUrl}
- USAGE:
  - for custom tag plugins (like [[test]]) or user_functions.md, you need to call it like this: ${ctagApiCall}
  - for bar/background/other custom code/plugins, you can directly call it ${fullRootPathObj}(args)
=======
Method code:
${str}
        `;
        methodStrings[name] = methodRes;
        return res
    }
    const interfaceString = JSON.stringify(obj, (key, value) => {
        if (typeof value === 'function') {
            return getFunctionSignature(key, value);
        }
        return value;
    }, 2);
    return {list: interfaceString, methods: methodStrings, m: methodStrings};
}

