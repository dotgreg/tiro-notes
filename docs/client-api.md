
# CLIENT API
 


 ## Api.utils
 

#### <span class="render-code-wrapper">utils.canScrollIframe</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. status: <span class="render-code-wrapper">boolean</span>
    - Result: <span class="render-code-wrapper">void</span> 

 - Example: 
 <div class="render-code-wrapper">api.utils.canScrollIframe(<span class="render-code-wrapper">boolean</span> )</div>
 

#### <span class="render-code-wrapper">utils.createDiv</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Result: <span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;div: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;updateContent: <span class="render-code-wrapper">(nContent: <span class="render-code-wrapper">any</span>) => <span class="render-code-wrapper">void</span></span><br/>}</span> 

 - Example: 
 <div class="render-code-wrapper">api.utils.createDiv( )</div>
 

#### <span class="render-code-wrapper">utils.fullscreenIframe</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Result: <span class="render-code-wrapper">void</span> 

 - Example: 
 <div class="render-code-wrapper">api.utils.fullscreenIframe( )</div>
 

#### <span class="render-code-wrapper">utils.getCachedRessourceUrl</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. url: <span class="render-code-wrapper">string</span>
    - Result: <span class="render-code-wrapper">string</span> 

 - Example: 
 <div class="render-code-wrapper">api.utils.getCachedRessourceUrl(<span class="render-code-wrapper">string</span> )</div>
 

#### <span class="render-code-wrapper">utils.getInfos</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Result: <span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;backendUrl: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;file: <span class="render-code-wrapper">"null" | "undefined"</span>, <br/>&nbsp;&nbsp;&nbsp;frameId: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;innerTag: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;loginToken: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;reloadCounter: <span class="render-code-wrapper">number</span>, <br/>&nbsp;&nbsp;&nbsp;tagContent: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;tagName: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;windowId: <span class="render-code-wrapper">string</span><br/>}</span> 

 - Example: 
 <div class="render-code-wrapper">api.utils.getInfos( )</div>
 

#### <span class="render-code-wrapper">utils.loadCachedRessources</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. ressources: <span class="render-code-wrapper">string[]</span>
       1. cb: <span class="render-code-wrapper"><a href="#client-api?id=function">Function</a></span>
    - Result: <span class="render-code-wrapper">void</span> 

 - Example: 
 <div class="render-code-wrapper">api.utils.loadCachedRessources(<span class="render-code-wrapper">string[]</span>, <span class="render-code-wrapper"><a href="#client-api?id=function">Function</a></span> )</div>
 

#### <span class="render-code-wrapper">utils.loadCustomTag</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. url: <span class="render-code-wrapper">string</span>
       1. innerTag: <span class="render-code-wrapper">string</span>
       1. opts: <span class="render-code-wrapper">any</span>
    - Result: <span class="render-code-wrapper">string</span> 

 - Example: 
 <div class="render-code-wrapper">api.utils.loadCustomTag(<span class="render-code-wrapper">string</span>, <span class="render-code-wrapper">string</span>, <span class="render-code-wrapper">any</span> )</div>
 

#### <span class="render-code-wrapper">utils.loadRessources</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. ressources: <span class="render-code-wrapper">string[]</span>
       1. cb: <span class="render-code-wrapper"><a href="#client-api?id=function">Function</a></span>
    - Result: <span class="render-code-wrapper">void</span> 

 - Example: 
 <div class="render-code-wrapper">api.utils.loadRessources(<span class="render-code-wrapper">string[]</span>, <span class="render-code-wrapper"><a href="#client-api?id=function">Function</a></span> )</div>
 

#### <span class="render-code-wrapper">utils.loadScripts</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. scripts: <span class="render-code-wrapper">string[]</span>
       1. cb: <span class="render-code-wrapper"><a href="#client-api?id=function">Function</a></span>
    - Result: <span class="render-code-wrapper">void</span> 

 - Example: 
 <div class="render-code-wrapper">api.utils.loadScripts(<span class="render-code-wrapper">string[]</span>, <span class="render-code-wrapper"><a href="#client-api?id=function">Function</a></span> )</div>
 

#### <span class="render-code-wrapper">utils.loadScriptsNoCache</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. scripts: <span class="render-code-wrapper">string[]</span>
       1. cb: <span class="render-code-wrapper"><a href="#client-api?id=function">Function</a></span>
    - Result: <span class="render-code-wrapper">void</span> 

 - Example: 
 <div class="render-code-wrapper">api.utils.loadScriptsNoCache(<span class="render-code-wrapper">string[]</span>, <span class="render-code-wrapper"><a href="#client-api?id=function">Function</a></span> )</div>
 

#### <span class="render-code-wrapper">utils.resizeIframe</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. height: <span class="render-code-wrapper">number</span>
    - Result: <span class="render-code-wrapper">void</span> 

 - Example: 
 <div class="render-code-wrapper">api.utils.resizeIframe(<span class="render-code-wrapper">number</span> )</div>

 


 ## Api.call : analytics
 

#### <span class="render-code-wrapper">analytics.log</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. logId: <span class="render-code-wrapper">string</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"analytics.log",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span> ]<br/>)</div>
 

#### <span class="render-code-wrapper">analytics.report</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. opt: <span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;end: <span class="render-code-wrapper"><a href="#client-api?id=iadate">iADate</a></span>, <br/>&nbsp;&nbsp;&nbsp;start: <span class="render-code-wrapper"><a href="#client-api?id=iadate">iADate</a></span><br/>}</span>
    - Result: <span class="render-code-wrapper">(o: <span class="render-code-wrapper"><a href="#client-api?id=ianalyticsobj">iAnalyticsObj</a></span>) => <span class="render-code-wrapper">void</span></span>

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"analytics.report",<br/>&nbsp;&nbsp;&nbsp; [, <span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;end: <span class="render-code-wrapper"><a href="#client-api?id=iadate">iADate</a></span>, <br/>&nbsp;&nbsp;&nbsp;start: <span class="render-code-wrapper"><a href="#client-api?id=iadate">iADate</a></span><br/>}</span>], <br/>&nbsp;&nbsp;&nbsp;<span class="render-code-wrapper">(o: <span class="render-code-wrapper"><a href="#client-api?id=ianalyticsobj">iAnalyticsObj</a></span>) => <span class="render-code-wrapper">void</span></span><br/>)</div>
 


 ## Api.call : cache
 

#### <span class="render-code-wrapper">cache.get</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. cacheId: <span class="render-code-wrapper">string</span>
    - Result: <span class="render-code-wrapper">(cacheContent: <span class="render-code-wrapper">any</span>) => <span class="render-code-wrapper">void</span></span>

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"cache.get",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>], <br/>&nbsp;&nbsp;&nbsp;<span class="render-code-wrapper">(cacheContent: <span class="render-code-wrapper">any</span>) => <span class="render-code-wrapper">void</span></span><br/>)</div>
 

#### <span class="render-code-wrapper">cache.set</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. cacheId: <span class="render-code-wrapper">string</span>
       1. contentToCache: <span class="render-code-wrapper">any</span>
       1. cachedMin: <span class="render-code-wrapper">number</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"cache.set",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>, <span class="render-code-wrapper">any</span>, <span class="render-code-wrapper">number</span> ]<br/>)</div>
 


 ## Api.call : command
 

#### <span class="render-code-wrapper">command.exec</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. commandString: <span class="render-code-wrapper">string</span>
    - Result: <span class="render-code-wrapper">(resCmd: <span class="render-code-wrapper">string</span>) => <span class="render-code-wrapper">void</span></span>

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"command.exec",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>], <br/>&nbsp;&nbsp;&nbsp;<span class="render-code-wrapper">(resCmd: <span class="render-code-wrapper">string</span>) => <span class="render-code-wrapper">void</span></span><br/>)</div>
 


 ## Api.call : file
 

#### <span class="render-code-wrapper">file.move</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. initPath: <span class="render-code-wrapper">string</span>
       1. endPath: <span class="render-code-wrapper">string</span>
    - Result: <span class="render-code-wrapper">(files: <span class="render-code-wrapper"><span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span>[]</span>) => <span class="render-code-wrapper">void</span></span>

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"file.move",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>, <span class="render-code-wrapper">string</span>], <br/>&nbsp;&nbsp;&nbsp;<span class="render-code-wrapper">(files: <span class="render-code-wrapper"><span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span>[]</span>) => <span class="render-code-wrapper">void</span></span><br/>)</div>
 

#### <span class="render-code-wrapper">file.create</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. folderPath: <span class="render-code-wrapper">string</span>
    - Result: <span class="render-code-wrapper"><a href="#client-api?id=igetfilescb">iGetFilesCb</a></span>

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"file.create",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>], <br/>&nbsp;&nbsp;&nbsp;<span class="render-code-wrapper"><a href="#client-api?id=igetfilescb">iGetFilesCb</a></span><br/>)</div>
 

#### <span class="render-code-wrapper">file.delete</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. file: <span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span>
    - Result: <span class="render-code-wrapper"><a href="#client-api?id=igetfilescb">iGetFilesCb</a></span>

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"file.delete",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span>], <br/>&nbsp;&nbsp;&nbsp;<span class="render-code-wrapper"><a href="#client-api?id=igetfilescb">iGetFilesCb</a></span><br/>)</div>
 

#### <span class="render-code-wrapper">file.getContent</span>
 - Description: 
Fetch the content of a note from its absolute link
noteLink should be relative from tiro folder

 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. noteLink: <span class="render-code-wrapper">string</span>
       1. options: <span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;onError?: <span class="render-code-wrapper">Function</span><br/>}</span>
    - Result: <span class="render-code-wrapper">(noteContent: <span class="render-code-wrapper">string</span>) => <span class="render-code-wrapper">void</span></span>

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"file.getContent",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>, <span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;onError?: <span class="render-code-wrapper">Function</span><br/>}</span>], <br/>&nbsp;&nbsp;&nbsp;<span class="render-code-wrapper">(noteContent: <span class="render-code-wrapper">string</span>) => <span class="render-code-wrapper">void</span></span><br/>)</div>
 

#### <span class="render-code-wrapper">file.saveContent</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. noteLink: <span class="render-code-wrapper">string</span>
       1. content: <span class="render-code-wrapper">string</span>
       1. options: <span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;history?: <span class="render-code-wrapper">boolean</span>, <br/>&nbsp;&nbsp;&nbsp;withMetas?: <span class="render-code-wrapper">boolean</span><br/>}</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"file.saveContent",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>, <span class="render-code-wrapper">string</span>, <span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;history?: <span class="render-code-wrapper">boolean</span>, <br/>&nbsp;&nbsp;&nbsp;withMetas?: <span class="render-code-wrapper">boolean</span><br/>}</span> ]<br/>)</div>
 


 ## Api.call : files
 

#### <span class="render-code-wrapper">files.search</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. term: <span class="render-code-wrapper">string</span>
    - Result: <span class="render-code-wrapper">(nFiles: <span class="render-code-wrapper"><span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span>[]</span>, contentSearchPreview: <span class="render-code-wrapper">string[]</span>) => <span class="render-code-wrapper">void</span></span>

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"files.search",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>], <br/>&nbsp;&nbsp;&nbsp;<span class="render-code-wrapper">(nFiles: <span class="render-code-wrapper"><span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span>[]</span>, contentSearchPreview: <span class="render-code-wrapper">string[]</span>) => <span class="render-code-wrapper">void</span></span><br/>)</div>
 

#### <span class="render-code-wrapper">files.get</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. folderPath: <span class="render-code-wrapper">string</span>
    - Result: <span class="render-code-wrapper">(files: <span class="render-code-wrapper"><span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span>[]</span>, folderPath: <span class="render-code-wrapper">string</span>) => <span class="render-code-wrapper">void</span></span>

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"files.get",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>], <br/>&nbsp;&nbsp;&nbsp;<span class="render-code-wrapper">(files: <span class="render-code-wrapper"><span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span>[]</span>, folderPath: <span class="render-code-wrapper">string</span>) => <span class="render-code-wrapper">void</span></span><br/>)</div>
 

#### <span class="render-code-wrapper">files.getPreviews</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. filesPath: <span class="render-code-wrapper">string[]</span>
    - Result: <span class="render-code-wrapper">(previews: <span class="render-code-wrapper"><span class="render-code-wrapper"><a href="#client-api?id=ifilepreview">iFilePreview</a></span>[]</span>) => <span class="render-code-wrapper">void</span></span>

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"files.getPreviews",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string[]</span>], <br/>&nbsp;&nbsp;&nbsp;<span class="render-code-wrapper">(previews: <span class="render-code-wrapper"><span class="render-code-wrapper"><a href="#client-api?id=ifilepreview">iFilePreview</a></span>[]</span>) => <span class="render-code-wrapper">void</span></span><br/>)</div>
 


 ## Api.call : history
 

#### <span class="render-code-wrapper">history.intervalSave</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. filePath: <span class="render-code-wrapper">string</span>
       1. content: <span class="render-code-wrapper">string</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"history.intervalSave",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>, <span class="render-code-wrapper">string</span> ]<br/>)</div>
 

#### <span class="render-code-wrapper">history.save</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. filePath: <span class="render-code-wrapper">string</span>
       1. content: <span class="render-code-wrapper">string</span>
       1. type: <span class="render-code-wrapper">"int" | "enter"</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"history.save",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>, <span class="render-code-wrapper">string</span>, <span class="render-code-wrapper">"int" | "enter"</span> ]<br/>)</div>
 


 ## Api.call : popup
 

#### <span class="render-code-wrapper">popup.confirm</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. text: <span class="render-code-wrapper">string</span>
       1. onRefuse: <span class="render-code-wrapper"><a href="#client-api?id=function">Function</a></span>
    - Result: <span class="render-code-wrapper"><a href="#client-api?id=function">Function</a></span>

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"popup.confirm",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>, <span class="render-code-wrapper"><a href="#client-api?id=function">Function</a></span>], <br/>&nbsp;&nbsp;&nbsp;<span class="render-code-wrapper"><a href="#client-api?id=function">Function</a></span><br/>)</div>
 

#### <span class="render-code-wrapper">popup.prompt</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. p: <span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;text: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;onAccept?: <span class="render-code-wrapper">Function</span>, <br/>&nbsp;&nbsp;&nbsp;onRefuse?: <span class="render-code-wrapper">Function</span>, <br/>&nbsp;&nbsp;&nbsp;title?: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;userInput?: <span class="render-code-wrapper">boolean</span><br/>}</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"popup.prompt",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;text: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;onAccept?: <span class="render-code-wrapper">Function</span>, <br/>&nbsp;&nbsp;&nbsp;onRefuse?: <span class="render-code-wrapper">Function</span>, <br/>&nbsp;&nbsp;&nbsp;title?: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;userInput?: <span class="render-code-wrapper">boolean</span><br/>}</span> ]<br/>)</div>
 

#### <span class="render-code-wrapper">popup.show</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. text: <span class="render-code-wrapper">string</span>
       1. title: <span class="render-code-wrapper">string</span>
    - Result: <span class="render-code-wrapper"><a href="#client-api?id=function">Function</a></span>

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"popup.show",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>, <span class="render-code-wrapper">string</span>], <br/>&nbsp;&nbsp;&nbsp;<span class="render-code-wrapper"><a href="#client-api?id=function">Function</a></span><br/>)</div>
 


 ## Api.call : ressource
 

#### <span class="render-code-wrapper">ressource.delete</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. filePath: <span class="render-code-wrapper">string</span>
    - Result: <span class="render-code-wrapper">(answer: <span class="render-code-wrapper">any</span>) => <span class="render-code-wrapper">void</span></span>

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"ressource.delete",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>], <br/>&nbsp;&nbsp;&nbsp;<span class="render-code-wrapper">(answer: <span class="render-code-wrapper">any</span>) => <span class="render-code-wrapper">void</span></span><br/>)</div>
 

#### <span class="render-code-wrapper">ressource.download</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. url: <span class="render-code-wrapper">string</span>
       1. folder: <span class="render-code-wrapper">string</span>
    - Result: <span class="render-code-wrapper">(answer: <span class="render-code-wrapper">any</span>) => <span class="render-code-wrapper">void</span></span>

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"ressource.download",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>, <span class="render-code-wrapper">string</span>], <br/>&nbsp;&nbsp;&nbsp;<span class="render-code-wrapper">(answer: <span class="render-code-wrapper">any</span>) => <span class="render-code-wrapper">void</span></span><br/>)</div>
 

#### <span class="render-code-wrapper">ressource.fetch</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. url: <span class="render-code-wrapper">string</span>
       1. options: <span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;disableCache?: <span class="render-code-wrapper">boolean</span><br/>}</span>
    - Result: <span class="render-code-wrapper">(urlContent: <span class="render-code-wrapper">string</span>) => <span class="render-code-wrapper">void</span></span>

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"ressource.fetch",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>, <span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;disableCache?: <span class="render-code-wrapper">boolean</span><br/>}</span>], <br/>&nbsp;&nbsp;&nbsp;<span class="render-code-wrapper">(urlContent: <span class="render-code-wrapper">string</span>) => <span class="render-code-wrapper">void</span></span><br/>)</div>
 


 ## Api.call : search
 

#### <span class="render-code-wrapper">search.files.search</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. term: <span class="render-code-wrapper">string</span>
    - Result: <span class="render-code-wrapper">(nFiles: <span class="render-code-wrapper"><span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span>[]</span>, contentSearchPreview: <span class="render-code-wrapper">string[]</span>) => <span class="render-code-wrapper">void</span></span>

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"search.files.search",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>], <br/>&nbsp;&nbsp;&nbsp;<span class="render-code-wrapper">(nFiles: <span class="render-code-wrapper"><span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span>[]</span>, contentSearchPreview: <span class="render-code-wrapper">string[]</span>) => <span class="render-code-wrapper">void</span></span><br/>)</div>
 

#### <span class="render-code-wrapper">search.ui.term.get</span>
 - Type: <span class="render-code-wrapper">string</span> 
 - Example: 
 <div class="render-code-wrapper">api.call("search.ui.term.get", [], (res:string) => {})</div>
 

#### <span class="render-code-wrapper">search.ui.term.set</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. nTerm: <span class="render-code-wrapper">string</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"search.ui.term.set",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span> ]<br/>)</div>
 

#### <span class="render-code-wrapper">search.ui.search</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. term: <span class="render-code-wrapper">string</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"search.ui.search",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span> ]<br/>)</div>
 

#### <span class="render-code-wrapper">search.hashtags</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. folder: <span class="render-code-wrapper">string</span>
    - Result: <span class="render-code-wrapper">(res: <span class="render-code-wrapper"><a href="#client-api?id=ihashtags">iHashtags</a></span>) => <span class="render-code-wrapper">void</span></span>

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"search.hashtags",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>], <br/>&nbsp;&nbsp;&nbsp;<span class="render-code-wrapper">(res: <span class="render-code-wrapper"><a href="#client-api?id=ihashtags">iHashtags</a></span>) => <span class="render-code-wrapper">void</span></span><br/>)</div>
 

#### <span class="render-code-wrapper">search.word</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. word: <span class="render-code-wrapper">string</span>
       1. folder: <span class="render-code-wrapper">string</span>
    - Result: <span class="render-code-wrapper">(res: <span class="render-code-wrapper"><a href="#client-api?id=isearchwordres">iSearchWordRes</a></span>) => <span class="render-code-wrapper">void</span></span>

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"search.word",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>, <span class="render-code-wrapper">string</span>], <br/>&nbsp;&nbsp;&nbsp;<span class="render-code-wrapper">(res: <span class="render-code-wrapper"><a href="#client-api?id=isearchwordres">iSearchWordRes</a></span>) => <span class="render-code-wrapper">void</span></span><br/>)</div>
 


 ## Api.call : status
 

#### <span class="render-code-wrapper">status.ipsServer.get</span>
 - Type: <span class="render-code-wrapper">array</span> 
 

#### <span class="render-code-wrapper">status.ipsServer.getLocal</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Result: <span class="render-code-wrapper">string</span> 

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"status.ipsServer.getLocal",<br/>&nbsp;&nbsp;&nbsp; [ ], <br/>(res:<span class="render-code-wrapper">string</span>) => {}<br/>)</div>
 

#### <span class="render-code-wrapper">status.ipsServer.set</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. nIps: <span class="render-code-wrapper">string[]</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"status.ipsServer.set",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string[]</span> ]<br/>)</div>
 

#### <span class="render-code-wrapper">status.isConnected</span>
 - Type: <span class="render-code-wrapper">boolean</span> 
 - Example: 
 <div class="render-code-wrapper">api.call("status.isConnected", [], (res:boolean) => {})</div>
 

#### <span class="render-code-wrapper">status.refresh.get</span>
 - Type: <span class="render-code-wrapper">number</span> 
 - Example: 
 <div class="render-code-wrapper">api.call("status.refresh.get", [], (res:number) => {})</div>
 

#### <span class="render-code-wrapper">status.searching.get</span>
 - Type: <span class="render-code-wrapper">boolean</span> 
 - Example: 
 <div class="render-code-wrapper">api.call("status.searching.get", [], (res:boolean) => {})</div>
 

#### <span class="render-code-wrapper">status.searching.set</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. isSearching: <span class="render-code-wrapper">boolean</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"status.searching.set",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">boolean</span> ]<br/>)</div>
 


 ## Api.call : tabs
 

#### <span class="render-code-wrapper">tabs.active.get</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Result: <span class="render-code-wrapper"></span> 

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"tabs.active.get",<br/>&nbsp;&nbsp;&nbsp; [ ], <br/>(res:<span class="render-code-wrapper"></span>) => {}<br/>)</div>
 

#### <span class="render-code-wrapper">tabs.close</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. tabId: <span class="render-code-wrapper">string</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"tabs.close",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span> ]<br/>)</div>
 

#### <span class="render-code-wrapper">tabs.get</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Result: <span class="render-code-wrapper"><span class="render-code-wrapper"><a href="#client-api?id=itab">iTab</a></span>[]</span> 

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"tabs.get",<br/>&nbsp;&nbsp;&nbsp; [ ], <br/>(res:<span class="render-code-wrapper"><span class="render-code-wrapper"><a href="#client-api?id=itab">iTab</a></span>[]</span>) => {}<br/>)</div>
 

#### <span class="render-code-wrapper">tabs.openInNewTab</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. file: <span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"tabs.openInNewTab",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span> ]<br/>)</div>
 

#### <span class="render-code-wrapper">tabs.reorder</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. oldPos: <span class="render-code-wrapper">any</span>
       1. newPos: <span class="render-code-wrapper">any</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"tabs.reorder",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">any</span>, <span class="render-code-wrapper">any</span> ]<br/>)</div>
 


 ## Api.call : ui
 

#### <span class="render-code-wrapper">ui.lightbox.close</span>
 - Type: <span class="render-code-wrapper">Function</span> 
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"ui.lightbox.close",<br/>&nbsp;&nbsp;&nbsp; [ ]<br/>)</div>
 

#### <span class="render-code-wrapper">ui.lightbox.open</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. index: <span class="render-code-wrapper">number</span>
       1. images: <span class="render-code-wrapper">"undefined" | "undefined"</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"ui.lightbox.open",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">number</span>, <span class="render-code-wrapper">"undefined" | "undefined"</span> ]<br/>)</div>
 

#### <span class="render-code-wrapper">ui.note.lineJump.get.line</span>
 - Type: <span class="render-code-wrapper">number</span> 
 - Example: 
 <div class="render-code-wrapper">api.call("ui.note.lineJump.get.line", [], (res:number) => {})</div>
 

#### <span class="render-code-wrapper">ui.note.lineJump.get.windowId</span>
 - Type: <span class="render-code-wrapper">string</span> 
 - Example: 
 <div class="render-code-wrapper">api.call("ui.note.lineJump.get.windowId", [], (res:string) => {})</div>
 

#### <span class="render-code-wrapper">ui.search.term.get</span>
 - Type: <span class="render-code-wrapper">string</span> 
 - Example: 
 <div class="render-code-wrapper">api.call("ui.search.term.get", [], (res:string) => {})</div>
 

#### <span class="render-code-wrapper">ui.search.term.set</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. nTerm: <span class="render-code-wrapper">string</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"ui.search.term.set",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span> ]<br/>)</div>
 

#### <span class="render-code-wrapper">ui.search.search</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. term: <span class="render-code-wrapper">string</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"ui.search.search",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span> ]<br/>)</div>
 

#### <span class="render-code-wrapper">ui.textToSpeechPopup.close</span>
 - Type: <span class="render-code-wrapper">Function</span> 
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"ui.textToSpeechPopup.close",<br/>&nbsp;&nbsp;&nbsp; [ ]<br/>)</div>
 

#### <span class="render-code-wrapper">ui.textToSpeechPopup.getStatus</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
    - Result: <span class="render-code-wrapper">(status: <span class="render-code-wrapper"><a href="#client-api?id=ittsstatus">iTtsStatus</a></span>) => <span class="render-code-wrapper">void</span></span>

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"ui.textToSpeechPopup.getStatus",<br/>&nbsp;&nbsp;&nbsp; [], <br/>&nbsp;&nbsp;&nbsp;<span class="render-code-wrapper">(status: <span class="render-code-wrapper"><a href="#client-api?id=ittsstatus">iTtsStatus</a></span>) => <span class="render-code-wrapper">void</span></span><br/>)</div>
 

#### <span class="render-code-wrapper">ui.textToSpeechPopup.open</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. content: <span class="render-code-wrapper">string</span>
       1. opts: <span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;id?: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;startString?: <span class="render-code-wrapper">string</span><br/>}</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"ui.textToSpeechPopup.open",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>, <span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;id?: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;startString?: <span class="render-code-wrapper">string</span><br/>}</span> ]<br/>)</div>
 

#### <span class="render-code-wrapper">ui.windows.active.get</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. tab: <span class="render-code-wrapper"><a href="#client-api?id=itab">iTab</a></span>
    - Result: <span class="render-code-wrapper"></span> 

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"ui.windows.active.get",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper"><a href="#client-api?id=itab">iTab</a></span> ], <br/>(res:<span class="render-code-wrapper"></span>) => {}<br/>)</div>
 

#### <span class="render-code-wrapper">ui.windows.active.setContent</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. file: <span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"ui.windows.active.setContent",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span> ]<br/>)</div>
 

#### <span class="render-code-wrapper">ui.windows.close</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. windowIds: <span class="render-code-wrapper">string[]</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"ui.windows.close",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string[]</span> ]<br/>)</div>
 

#### <span class="render-code-wrapper">ui.windows.getIdsFromFile</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. filepath: <span class="render-code-wrapper">string</span>
    - Result: <span class="render-code-wrapper">string[]</span> 

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"ui.windows.getIdsFromFile",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span> ], <br/>(res:<span class="render-code-wrapper">string[]</span>) => {}<br/>)</div>
 

#### <span class="render-code-wrapper">ui.windows.updateWindows</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. windowIds: <span class="render-code-wrapper">string[]</span>
       1. file: <span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"ui.windows.updateWindows",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string[]</span>, <span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span> ]<br/>)</div>
 


 ## Api.call : upload
 

#### <span class="render-code-wrapper">upload.uploadFile</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. p: <span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;file: <span class="render-code-wrapper"></span>, <br/>&nbsp;&nbsp;&nbsp;folderPath: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;onProgress: <span class="render-code-wrapper"><a href="#client-api?id=onuploadprogressfn">onUploadProgressFn</a></span>, <br/>&nbsp;&nbsp;&nbsp;onSuccess: <span class="render-code-wrapper"><a href="#client-api?id=onuploadsuccessfn">onUploadSuccessFn</a></span><br/>}</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"upload.uploadFile",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;file: <span class="render-code-wrapper"></span>, <br/>&nbsp;&nbsp;&nbsp;folderPath: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;onProgress: <span class="render-code-wrapper"><a href="#client-api?id=onuploadprogressfn">onUploadProgressFn</a></span>, <br/>&nbsp;&nbsp;&nbsp;onSuccess: <span class="render-code-wrapper"><a href="#client-api?id=onuploadsuccessfn">onUploadSuccessFn</a></span><br/>}</span> ]<br/>)</div>
 


 ## Api.call : userSettings
 

#### <span class="render-code-wrapper">userSettings.refresh.css.get</span>
 - Type: <span class="render-code-wrapper">number</span> 
 - Example: 
 <div class="render-code-wrapper">api.call("userSettings.refresh.css.get", [], (res:number) => {})</div>
 

#### <span class="render-code-wrapper">userSettings.get</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. name: <span class="render-code-wrapper"><a href="#client-api?id=iusersettingname">iUserSettingName</a></span>
    - Result: <span class="render-code-wrapper">any</span> 

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"userSettings.get",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper"><a href="#client-api?id=iusersettingname">iUserSettingName</a></span> ], <br/>(res:<span class="render-code-wrapper">any</span>) => {}<br/>)</div>
 

#### <span class="render-code-wrapper">userSettings.list</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Result: <span class="render-code-wrapper"><span class="render-code-wrapper"><a href="#client-api?id=keyval">keyVal</a></span>[]</span> 

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"userSettings.list",<br/>&nbsp;&nbsp;&nbsp; [ ], <br/>(res:<span class="render-code-wrapper"><span class="render-code-wrapper"><a href="#client-api?id=keyval">keyVal</a></span>[]</span>) => {}<br/>)</div>
 

#### <span class="render-code-wrapper">userSettings.set</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. name: <span class="render-code-wrapper"><a href="#client-api?id=iusersettingname">iUserSettingName</a></span>
       1. val: <span class="render-code-wrapper">any</span>
       1. options: <span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;writeInSetupJson?: <span class="render-code-wrapper">boolean</span><br/>}</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"userSettings.set",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper"><a href="#client-api?id=iusersettingname">iUserSettingName</a></span>, <span class="render-code-wrapper">any</span>, <span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;writeInSetupJson?: <span class="render-code-wrapper">boolean</span><br/>}</span> ]<br/>)</div>
 

#### <span class="render-code-wrapper">userSettings.updateSetupJson</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. paramName: <span class="render-code-wrapper">string</span>
       1. paramValue: <span class="render-code-wrapper">string</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"userSettings.updateSetupJson",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>, <span class="render-code-wrapper">string</span> ]<br/>)</div>
 


 ## Api.call : watch
 

#### <span class="render-code-wrapper">watch.file</span>
 - Description: 
Watch for file changes

 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. notePath: <span class="render-code-wrapper">string</span>
    - Result: <span class="render-code-wrapper">(res: <span class="render-code-wrapper"><a href="#client-api?id=iwatchupdate">iWatchUpdate</a></span>) => <span class="render-code-wrapper">void</span></span>

 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"watch.file",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">string</span>], <br/>&nbsp;&nbsp;&nbsp;<span class="render-code-wrapper">(res: <span class="render-code-wrapper"><a href="#client-api?id=iwatchupdate">iWatchUpdate</a></span>) => <span class="render-code-wrapper">void</span></span><br/>)</div>
 


 ## Api.call : _References
 

#### <span class="render-code-wrapper">iAnalyticsObj</span>
 - Type: <span class="render-code-wrapper">object</span> 
 - Details: 
 <div class="render-code-wrapper"><span class="render-code-wrapper">{<br/>}</span></div>
 

#### <span class="render-code-wrapper">iFileNature</span>
 - Type: <span class="render-code-wrapper">union</span> 
 - Details: 
 <div class="render-code-wrapper"><span class="render-code-wrapper">"file" | "folder"</span></div>
 

#### <span class="render-code-wrapper">iFile</span>
 - Type: <span class="render-code-wrapper">object</span> 
 - Details: 
 <div class="render-code-wrapper"><span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;folder: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;name: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;nature: <span class="render-code-wrapper"><a href="#client-api?id=ifilenature">iFileNature</a></span>, <br/>&nbsp;&nbsp;&nbsp;path: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;realname: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;created?: <span class="render-code-wrapper">number</span>, <br/>&nbsp;&nbsp;&nbsp;extension?: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;index?: <span class="render-code-wrapper">number</span>, <br/>&nbsp;&nbsp;&nbsp;modified?: <span class="render-code-wrapper">number</span><br/>}</span></div>
 

#### <span class="render-code-wrapper">iGetFilesCb</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. files: <span class="render-code-wrapper"><span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span>[]</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"undefined",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper"><span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span>[]</span> ]<br/>)</div>
 

#### <span class="render-code-wrapper">iFilePreview</span>
 - Type: <span class="render-code-wrapper">object</span> 
 - Details: 
 <div class="render-code-wrapper"><span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;content: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;path: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;picture?: <span class="render-code-wrapper">string</span><br/>}</span></div>
 

#### <span class="render-code-wrapper">iNotePart</span>
 - Type: <span class="render-code-wrapper">object</span> 
 - Details: 
 <div class="render-code-wrapper"><span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;file: <span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span>, <br/>&nbsp;&nbsp;&nbsp;titleName: <span class="render-code-wrapper">string</span><br/>}</span></div>
 

#### <span class="render-code-wrapper">iHashtag</span>
 - Type: <span class="render-code-wrapper">object</span> 
 - Details: 
 <div class="render-code-wrapper"><span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;id: <span class="render-code-wrapper">number</span>, <br/>&nbsp;&nbsp;&nbsp;lines: <span class="render-code-wrapper">number[]</span>, <br/>&nbsp;&nbsp;&nbsp;name: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;noteParts: <span class="render-code-wrapper"><span class="render-code-wrapper"><a href="#client-api?id=inotepart">iNotePart</a></span>[]</span><br/>}</span></div>
 

#### <span class="render-code-wrapper">iHashtagsArr</span>
 - Type: <span class="render-code-wrapper">array</span> 
 

#### <span class="render-code-wrapper">iHashtagsDic</span>
 - Type: <span class="render-code-wrapper">object</span> 
 - Details: 
 <div class="render-code-wrapper"><span class="render-code-wrapper">{<br/>}</span></div>
 

#### <span class="render-code-wrapper">iHashtags</span>
 - Type: <span class="render-code-wrapper">object</span> 
 - Details: 
 <div class="render-code-wrapper"><span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;edges: <span class="render-code-wrapper">string[]</span>, <br/>&nbsp;&nbsp;&nbsp;nodesArr: <span class="render-code-wrapper"><a href="#client-api?id=ihashtagsarr">iHashtagsArr</a></span>, <br/>&nbsp;&nbsp;&nbsp;nodesObj: <span class="render-code-wrapper"><a href="#client-api?id=ihashtagsdic">iHashtagsDic</a></span><br/>}</span></div>
 

#### <span class="render-code-wrapper">iSearchWordRes</span>
 - Type: <span class="render-code-wrapper">object</span> 
 - Details: 
 <div class="render-code-wrapper"><span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;[filePath:string]: <span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;file: <span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span>, <br/>&nbsp;&nbsp;&nbsp;results: <span class="render-code-wrapper">string[]</span><br/>}</span><br/>}</span></div>
 

#### <span class="render-code-wrapper">iViewType</span>
 - Type: <span class="render-code-wrapper">union</span> 
 - Details: 
 <div class="render-code-wrapper"><span class="render-code-wrapper">"editor" | "editor-with-map" | "both" | "preview"</span></div>
 

#### <span class="render-code-wrapper">iWindowContent</span>
 - Type: <span class="render-code-wrapper">object</span> 
 - Details: 
 <div class="render-code-wrapper"><span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;active: <span class="render-code-wrapper">boolean</span>, <br/>&nbsp;&nbsp;&nbsp;file: <span class="render-code-wrapper"><a href="#client-api?id=ifile">iFile</a></span>, <br/>&nbsp;&nbsp;&nbsp;i: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;view: <span class="render-code-wrapper"><a href="#client-api?id=iviewtype">iViewType</a></span><br/>}</span></div>
 

#### <span class="render-code-wrapper">iWindow</span>
 - Type: <span class="render-code-wrapper">object</span> 
 - Details: 
 <div class="render-code-wrapper"><span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;h: <span class="render-code-wrapper">number</span>, <br/>&nbsp;&nbsp;&nbsp;i: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;maxH: <span class="render-code-wrapper">number</span>, <br/>&nbsp;&nbsp;&nbsp;minH: <span class="render-code-wrapper">number</span>, <br/>&nbsp;&nbsp;&nbsp;w: <span class="render-code-wrapper">number</span>, <br/>&nbsp;&nbsp;&nbsp;x: <span class="render-code-wrapper">number</span>, <br/>&nbsp;&nbsp;&nbsp;y: <span class="render-code-wrapper">number</span>, <br/>&nbsp;&nbsp;&nbsp;refresh?: <span class="render-code-wrapper">number</span><br/>}</span></div>
 

#### <span class="render-code-wrapper">iGrid</span>
 - Type: <span class="render-code-wrapper">object</span> 
 - Details: 
 <div class="render-code-wrapper"><span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;content: <span class="render-code-wrapper"><span class="render-code-wrapper"><a href="#client-api?id=iwindowcontent">iWindowContent</a></span>[]</span>, <br/>&nbsp;&nbsp;&nbsp;layout: <span class="render-code-wrapper"><span class="render-code-wrapper"><a href="#client-api?id=iwindow">iWindow</a></span>[]</span><br/>}</span></div>
 

#### <span class="render-code-wrapper">iTab</span>
 - Type: <span class="render-code-wrapper">object</span> 
 - Details: 
 <div class="render-code-wrapper"><span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;active: <span class="render-code-wrapper">boolean</span>, <br/>&nbsp;&nbsp;&nbsp;grid: <span class="render-code-wrapper"><a href="#client-api?id=igrid">iGrid</a></span>, <br/>&nbsp;&nbsp;&nbsp;id: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;name: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;manualName?: <span class="render-code-wrapper">boolean</span>, <br/>&nbsp;&nbsp;&nbsp;position?: <span class="render-code-wrapper">number</span>, <br/>&nbsp;&nbsp;&nbsp;refresh?: <span class="render-code-wrapper">number</span><br/>}</span></div>
 

#### <span class="render-code-wrapper">iTtsStatus</span>
 - Type: <span class="render-code-wrapper">object</span> 
 - Details: 
 <div class="render-code-wrapper"><span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;currentChunk: <span class="render-code-wrapper">number</span>, <br/>&nbsp;&nbsp;&nbsp;isPlaying: <span class="render-code-wrapper">boolean</span>, <br/>&nbsp;&nbsp;&nbsp;totalChunks: <span class="render-code-wrapper">number</span>, <br/>&nbsp;&nbsp;&nbsp;currentText?: <span class="render-code-wrapper">string</span><br/>}</span></div>
 

#### <span class="render-code-wrapper">onUploadProgressFn</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. percentUpload: <span class="render-code-wrapper">number</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"undefined",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">number</span> ]<br/>)</div>
 

#### <span class="render-code-wrapper">onUploadSuccessFn</span>
 - Type: <span class="render-code-wrapper">Function</span> 
    - Parameters: 
       1. p: <span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;name: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;path: <span class="render-code-wrapper">string</span><br/>}</span>
 - Example: 
 <div class="render-code-wrapper">api.call(<br/>&nbsp;&nbsp;&nbsp;"undefined",<br/>&nbsp;&nbsp;&nbsp; [<span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;name: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;path: <span class="render-code-wrapper">string</span><br/>}</span> ]<br/>)</div>
 

#### <span class="render-code-wrapper">iUserSettingName</span>
 - Type: <span class="render-code-wrapper">union</span> 
 - Details: 
 <div class="render-code-wrapper"><span class="render-code-wrapper">"ui_filesList_sortMode" | "ui_layout_colors_main" | "ui_layout_shortcuts_panel" | "ui_sidebar" | "ui_editor_links_as_button" | "ui_editor_markdown_preview" | "ui_editor_markdown_table_preview" | "users_viewer_user_enable" | "users_viewer_user_password" | "demo_mode_enable" | "ui_other"</span></div>
 

#### <span class="render-code-wrapper">keyVal</span>
 - Type: <span class="render-code-wrapper">object</span> 
 - Details: 
 <div class="render-code-wrapper"><span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;key: <span class="render-code-wrapper"><a href="#client-api?id=iusersettingname">iUserSettingName</a></span>, <br/>&nbsp;&nbsp;&nbsp;val: <span class="render-code-wrapper">any</span><br/>}</span></div>
 

#### <span class="render-code-wrapper">iWatchUpdate</span>
 - Type: <span class="render-code-wrapper">object</span> 
 - Details: 
 <div class="render-code-wrapper"><span class="render-code-wrapper">{<br/>&nbsp;&nbsp;&nbsp;fileContent: <span class="render-code-wrapper">string</span>, <br/>&nbsp;&nbsp;&nbsp;filePath: <span class="render-code-wrapper">string</span><br/>}</span></div>

<style>
h4 .render-code-wrapper {
    font-size: 1.4rem;
    color: #f56e6e;
}
.render-code-wrapper {
    background: #f4f4f4;
    padding: 5px;
    color: #f56e6e;
    font-family: Roboto Mono,Monaco,courier,monospace;
    font-size: .8rem;
}
</style>
