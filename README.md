# Tiro Notes

An open-source, cross-platform markdown editor designed for extensibility & flexibility

🌐 website| 📢 news| 📘 guides|  ⬇️ usage |  Version |
-|-|-|-|-
[tiro-notes.org](https://tiro-notes.org)|[dev blog](https://tiro-notes.org/blog) & [twitter](https://twitter.com/NotesTiro)|[guides](https://tiro-notes.org/#/guide-custom-tags)|[download](https://tiro-notes.org/#/downloads) or ```npx tiro-notes```| 0.30 (beta)


![Tiro 0.30](https://github.com/dotgreg/tiro-notes/assets/2981891/9e684988-5575-428f-8499-d11ad6637c71)



Tiro Notes focus points are : 

- 🏋 **Extensibility** : Tiro Notes uses a system of custom tags to extend its capabilities :
  - Add [```[[latex]]```](https://tiro-notes.org/#/custom-tags?id=latex), [```[[uml]]```](https://tiro-notes.org/#/custom-tags?id=mermaid) or [```[[charts]]```](https://tiro-notes.org/#/custom-tags?id=mermaid), preview your pdf, mp4 or youtube links using [```[[view]]```](https://tiro-notes.org/#/custom-tags?id=view). Add [```[[spreadsheet]]```](https://tiro-notes.org/#/custom-tags?id=spreadsheet) logic to your markdown tables.
  - Use Tiro as an app platform with a [```[[rss]]```](https://tiro-notes.org/#/custom-tags?id=rss) reader or a [```[[calendar]]```](https://tiro-notes.org/#/custom-tags?id=calendar) in it.
  - [Create your own custom tags](https://tiro-notes.org/#/guide-custom-tags) and use the [Client API](https://tiro-notes.org/#/guide-custom-tags?id=using-tiro-client-api).

- 🎛️ **Flexibility** : multi-window interface to create a custom workspace. Create multiple workspaces organized by tabs. Keep these workspaces synced accross your devices.

- 👑 **Open source & Open Data**: Code is open source and free. No database required. Markdown files only. You can edit and sync your files with external software as you need.

- ☁️ / 🖥️ /  💻 / 📱 **Cross-platform & Web** : Windows, macOS, Android, Linux, Web. Start an App or with CLI and access it anywhere on your local network. 

# Install
- [Download desktop client (Win/Mac/Linux)](https://tiro-notes.org/#/downloads)
- or with command line ```npx tiro-notes``` 
  - for the latest functionnalities ```npx tiro-notes@develop``` (updates on [weekly basis](https://www.npmjs.com/package/tiro-notes?activeTab=versions))

# Functionalities
  
**Note Edition**
- 🖊️ Mardown notes edition
- 🌄 Drag and Drop images & files upload (stored in a relative .resources folder)
- 🔗 Notes linking
- 🔑 End to end (E2E) note encryption (RSA 2048)
- 🏛 Note changes history
- 📄 Export to PDF
- (🔧) 💬 Text to Speech (beta)

**Custom Tags**
- 💱 display math formulas with [[latex]] 
- 🧬 display UML and other diagrams with [[diagram]] 
- 🏋 Embed videos, pdf and web content with [[view]] 
- 🏋 create javascript applications within your note with [[script]] 
- 🧬 leverage the full [Client API](guide-custom-tags?id=using-tiro-client-api) in [[script]]

**Search**
- 🔍 Fast search (~2s for 30k notes)
- 🔬 Search filters (intitle: etc.)

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

>"Marcus Tullius Tiro, a learned freedman who was a member of Cicero’s household, invented the Tironian notes, the first Latin shorthand system. Tironian notes consist of letters of the alphabet, simplified and modified to achieve greater speed in their writing."
