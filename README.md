# Tiro Notes

Open-source, fast and supercharged markdown editor to be used anywhere

![tiro-notes](https://user-images.githubusercontent.com/2981891/159723385-a6ab2fc8-c9b4-4019-9a54-a40382ad45bb.jpeg)

## WHY

Tiro Notes is designed to be a viable open source alternative to proprietary software like Evernote, OneNote etc. 

Tiro Notes focus points are : 

- 👼 **Open source & free**: Code is open source, free forever. Optimistically reaching a GNU GPLv3 license in the future.
- 👑 **Own your data**: No database, no hidden ties. Markdown files only. You can edit and sync your files with external software as you need.


- 🚅 **Fast**: Search is really fast (using ripgrep). You can scroll list of several thousands of items without slowdown.
- 💅 **Nice**: Usability & nice user experience is key aspect of Tiro.


- 📟 **Use it anywhere** : Apps for Windows, Mac, Linux. You can install and start Tiro within seconds with npx. You can install it on Android and iOS. You can use it as web server and use it with any device with a browser.
- 🏋 **Extensible** : custom and extensible markdown tags like [[latex]] or [[script]] or with third party plugins (planned).

## FUNCTIONALITIES
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
- (🔧) 💬 Text to Speech (beta)
- (🔧) 🧬 display UML and other diagrams with [[diagram]] (planned...)
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

## USAGE
### 1) COMMAND LINE
- Requirements : [NodeJs](https://nodejs.org/en/download/) and [RipGrep](https://github.com/BurntSushi/ripgrep)

```
npx tiro-notes
```

<img src="https://user-images.githubusercontent.com/2981891/159723396-b5e81dcd-a4aa-4581-9b7f-e3b62bcdef65.gif" width="600"/>

- This works with any platform/device, including unrooted Android with [Termux](https://termux.com) and possibly iOS with iSH (untested)
- "npx tiro-notes --help for all available options

### 2) APPS (Coming...)
Mac/Linux/Windows Electron Apps coming soon...

# FAQ

## How can I sync my notes folder on other devices?
You can use any sync solution like dropbox, google drive, resilio sync, syncthings etc...

## Can I edit my notes on another application?
Yes, all the datas Tiro uses is coming from markdown notes. So you can edit your notes in other applications without any problem.

## How can I access to Tiro on my device
1) Device where tiro is installed : http://localhost:3023
2) If on same local network: http://192.168.xx.xx:3023 where that ip is the ip of the device where tiro is installed
3) Not on same network : Tiro works great using SSH tunneling, AutoSSH or similar (free ssh tunnels solutions exists like https://opentunnel.net/). Npx tiro-notes also includes a --tunnel option for easy tunneling.

## What is the current status of Tiro Notes? 
I have been developing it for over a year and using it as my daily note app for over 6 months now, its core functionalities seems stable enough for my use so far.
I haven't been loosing any data so far, and there is always the history note functionality in that case.

However, I consider that application still in alpha phase, it still needs a lot of testing to be considered robust.

So use it at your own risk, and always with data you can afford to lose.

I am not responsible of any data loss!
