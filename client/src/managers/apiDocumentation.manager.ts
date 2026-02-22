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
        let smallRootPathObj = `${fullRootPathObj.split('.').slice(-2).join('.')}`
        let searchUrl = `https://github.com/search?q=repo%3Adotgreg%2Ftiro-notes%20${smallRootPathObj}&type=code`

        let methodRes = `
DOCUMENTATION FOR API METHOD: ${fullRootPathObj}
======
Signature: ${res}
- For more details on the structure/type of each parameter, please check the source code url below
=======
Source code url 
${finalUrl}
=======
Method usage and examples:
${searchUrl}
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

