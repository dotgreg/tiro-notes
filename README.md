# Tiro Notes

Open-source, fast and extensible markdown editor to use anywhere

![Tiro S2](https://user-images.githubusercontent.com/2981891/161093353-e9c2df15-ffca-4d2f-839d-ced9ced659b1.jpg)

## WHY

Tiro Notes is designed to be a viable open source alternative to proprietary software like Evernote, OneNote etc. 

Tiro Notes focus points are : 

- 👼 **Open source & free**: Code is open source, free forever. Optimistically reaching a GNU GPLv3 license in the future.
- 👑 **Own your data**: No database, no hidden ties. Markdown files only. You can edit and sync your files with external software as you need.


- 🚅 **Fast**: Search is really fast (using ripgrep). You can scroll list of several thousands of items without slowdown.
- 💅 **Nice**: Usability & nice user experience is key aspect of Tiro.


- ☁️ / 🖥️ /  💻 / 📱 **Use it anywhere** : Apps for Windows, Mac, Linux. You can install and start Tiro within seconds with npx. You can install it on Android and iOS. You can use it as web server and use it with any device with a browser.
- 🏋 **Extensible** : create custom markdown tag like [[calendar]], [[uml]] and other within seconds. Use [[latex]]. Create your own tag with [[script]] and the client api

## MENU
* [Why](#why)
* [Usage](#usage)
  + [Desktop Applications](#desktop-applications)
  + [Command Line](#command-line)
* [Functionalities List](#functionalities-list)
* [Documentation](#documentation)
    + [Ready to install custom tags](#ready-to-install-custom-tags)
    + [Add scripts in your note](#add-scripts-in-your-note)
    + [Create your own custom tags](#create-your-own-custom-tags)
      - [1) How to create a new custom tag [[mail-address]]](#1--how-to-create-a-new-custom-tag--)
      - [2) Using {{InnerTag}}](#2--using---innertag--)
      - [3) Add script logic in your tag](#3--add-script-logic-in-your-tag--)
    + [Client API](#client-api)
* [Faq](#faq)
  + [How can I sync my notes folder on other devices?](#how-can-i-sync-my-notes-folder-on-other-devices)
  + [Can I edit my notes on another application?](#can-i-edit-my-notes-on-another-application)
  + [How can I access to Tiro on my device](#how-can-i-access-to-tiro-on-my-device)
  + [What is the current status of Tiro Notes?](#what-is-the-current-status-of-tiro-notes)

## USAGE

### DESKTOP APPLICATIONS

Mac/Linux/Windows Applications can be downloaded [here](https://github.com/dotgreg/tiro-notes/releases/tag/production) 

### COMMAND LINE
- Requirements : [NodeJs](https://nodejs.org/en/download/) and [RipGrep](https://github.com/BurntSushi/ripgrep)

```
npx tiro-notes
```

<img src="https://user-images.githubusercontent.com/2981891/159723396-b5e81dcd-a4aa-4581-9b7f-e3b62bcdef65.gif" width="600"/>

- This works with any platform/device, including unrooted Android with [Termux](https://termux.com) and possibly iOS with iSH (untested)
- ```npx tiro-notes --help``` for all available options


## FUNCTIONALITIES LIST
<details>
  <summary>Expand all functionalities</summary>
  
  
**Note Edition**
- 🖊️ Mardown notes edition
- 🌄 Drag and Drop images & files upload (stored in a relative .resources folder)
- 🔗 Notes linking
- 🔑 End to end (E2E) note encryption (RSA 2048)
- 🏛 Note changes history
- 📄 Export to PDF
- 🏋 Embed videos and other web content (with iframe)
- 🏋 create javascript applications within your note with [[script]] 
- 💱 display math formulas with [[latex]] 
- 🧬 display UML and other diagrams with [[diagram]] (custom tags)
- (🔧) 💬 Text to Speech (beta)
- (🔧) 📡 Server Collaborative edition (planned...)

**Search**
- 🔍 Fast search (~2s for 30k notes)
- 🔬 Search filters (intitle: etc...)

**Folders Tree & Notes List**
- 🗂️ Folders management (create/rename/move/delete)
- 🏎️ Fast Notes List (can display 10k files without slowdown)
- 🧮 Notes List sorting (date creation/date modification/name)
- 👁️ Note preview in Notes List (with image and text)
- 📤 Last notes edited
- 🌄 Images list view

**Security**
- 🔒 Application login (user/password)
- 🔒 HTTPS support (with self signed certificate)

**Platforms**
- 💻 Windows/Mac/Linux applications
- 🥷 10 seconds install & start with command line NPX 
- 📱 Install on Android with Termux and NPX
- ☁️ Use it as a local application, as a local or cloud server.
- 📟 Use it on any device with a browser (Mobile, tablet and Desktop interface)
- (🔧)📱 Install on iOS with iSH and NPX (to be tested...)
</details>


## DOCUMENTATION

### Available Custom Tags
  - [[calendar]] a fully functional calendar that stored data on a note : [install instructions & screenshot](https://github.com/dotgreg/tiro-notes/blob/master/documentation/custom-tag-calendar.md)
  - [[mermaid]] Uml, Gantt and flowcharts : [install instructions & screenshot](https://github.com/dotgreg/tiro-notes/blob/master/documentation/custom-tag-mermaid.md)

### Add scripts in your note

<details>
  <summary>Expand for details</summary>
  You can add javascript logic in your note with the special tag [[script]]
  
  You need to use ```return``` to output it in the preview.
  
  ```
  .... Note content ....
  
  [[script]]]
  const stringToDisplay = `this is a hello world from javascript`
  const randomNumber = Math.round(Math.random() * 1000)
  return `${stringToDisplay} ${randomNumber} `
  [[script]]
  
  .... Note content ....
  ```
  
  will output something like 
  
  ```
  .... Note content ....
  
  this is a hello world from javascript 102
  
  .... Note content ....
  
  ```
</details>

### Create your own custom tags

<details>
  <summary>Expand for details</summary>
  
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
  
  ### 3) Add script logic in your tag
  
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
  
  
</details>


### Client API (Beta)
<details>
  <summary>Expand for details</summary>
  
  
  Tiro Notes provides a Client API accessible using the developer console of your browser :
  ![Screenshot 2022-03-31 at 18 39 22](https://user-images.githubusercontent.com/2981891/161106559-b27890d1-fca4-4e66-a6ff-0bdf38f679b3.jpg)

  typing ``` window.tiroCli ``` will give you the updated list of available functions. Each function has a description ```window.tiroCli.FUNCTION.description``` and can be called like that ```window.tiroCli.FUNCTION.f()```
  
  The Tiro Cli allows you to :
  - fetch a note content : ```window.tiroCli.clientApiGetFileContent```
  - modify a note content : ```window.tiroCli.clientApiSetFileContent```
  - Load an external javascript file : ```window.tiroCli.loadScripts(['https://', 'https://', ...], function () => {})```
  - Show the current note content : ```window.tiroCli.fileContent```
  - Trigger a search in the interface : ```window.tiroCli.triggerSearch```
  - Set the Dual Editor view type temporarily : ```window.tiroCli.setTempViewType ("both", "editor", "preview")```
  
  /!\ this API and CLI structure is meant to change in term of structure, make sure to check window.tiroCli when upgrading to a new version /!\
  
</details>



## FAQ

### How can I sync my notes folder on other devices?
You can use any sync solution like dropbox, google drive, resilio sync, syncthings etc...

### Can I edit my notes on another application?
Yes, all the datas Tiro uses is coming from markdown notes. So you can edit your notes in other applications without any problem.

### How can I access to Tiro on my device from anywhere
1) Device where tiro is installed : http://localhost:3023 
2) If on same Wifi/local network: http://192.168.xx.xx:3023 where that ip is the ip of the device where tiro is installed
3) Not on same network : Tiro works great using SSH tunneling, AutoSSH or similar (free ssh tunnels solutions exists like https://opentunnel.net/). Npx tiro-notes also includes a --tunnel option for easy tunneling.
4) On the cloud: You can install Tiro Notes on your server and access it from anywhere.

### What is the current status of Tiro Notes? 
I have been developing it for over a year and using it as my daily note app for over 6 months now, its core functionalities seems stable enough for my use so far.
I haven't been loosing any data so far, and there is always the history note functionality in that case.

However, I consider that application still in alpha phase, it still needs a lot of testing to be considered robust.

So use it at your own risk, and always with data you can afford to lose.

I am not responsible of any data loss!
