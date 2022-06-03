### Create a custom tags

  
  #### 1) How to create a new custom tag [[mail-address]]
  In order to install a new tag, you need to create a new note in ```/.tiro/tags/``` folder. (create the /tags directory if doesn't exists).
  
  The content of that note will then be placed instead of the tag.
  
  So in order to create a custom tag [[mail-address]], you will need to create ```/.tiro/tags/mail-address.md```
  
  So with ```/.tiro/tags/mail-address.md``` content being :
  ```
  10 Downing Street
  City of Westminster
  London, SW1
  ```
  
  And your note content being
    
  ```
  .... Note content ....
  
  [[mail-address]] [[mail-address]]
  
  .... Note content ....
  
  ```
  
  The result will give
  
   ```
  .... Note content ....
  
  10 Downing Street
  City of Westminster
  London, SW1
  
  .... Note content ....
  
  ```
  
  
  #### 2) Using {{InnerTag}}
  The content inside the custom tags can be fetched with the special tag ```{{innerTag}}```
  
  So with ```/.tiro/tags/mail-address.md``` content being :
  ```
  10 Downing Street
  City of Westminster
  London, SW1
  {{innerTag}}
  ```
  
  Calling ```[[mail-address]] John Foo [[mail-address]]``` in any note will be replaced by
  
  ```
  10 Downing Street
  City of Westminster
  London, SW1
  John Foo
  ```
  
  ###  Add script logic 
  
  You can add javascript to your custom tag with the special tag [[script]]
  
  If we have ```/.tiro/tags/square-number.md``` with the following content : 
  ```
  The multiplied result is : 
  [[script]]]
  const numberToSquare = {{innerTag}}
  return `${numberToSquare * numberToSquare}`
  [[script]]
  ```
  
  Using ```[[square-number]] 4 [[square-number]]``` will return ```The multiplied result is :  16```
  
  ### Using Tiro Client API

Inside your scripts and/or custom tags, you can leverage the [Client API](client-api.md) to interact with your notes and Tiro interface. A few examples of what is possible :

- get current parent note content and path [```api.utils.getInfos```](client-api.md?id=utilsgetinfos)
- load external javascript libraries [```api.utils.loadScripts```](client-api.md?id=utilsloadscripts)
- get the content of a note from its path with [```api.call("file.getContent")```](client-api.md?id=filegetcontent)
- update a note content using [```api.call("file.saveContent")```](client-api.md?id=filesavecontent)
- search a term and get the files list [```api.call("files.search")```](client-api.md?id=filessearch)
- trigger a popup [```api.call("popup.prompt")```](client-api.md?id=popupprompt)
- open a file in a new tab [```api.call("tabs.openInNewTab")```](client-api.md?id=tabsopeninnewtab)


### Publish my custom tag to Tiro website
You can do a Push Request (PR) in https://github.com/dotgreg/tiro-notes and add your own folder-name inside /custom-tags/MY_CUSTOM_TAG_NAME. 