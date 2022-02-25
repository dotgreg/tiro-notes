# TIRO NOTES

![Tiro-desktop-exemple](https://user-images.githubusercontent.com/2981891/150394718-bf33d239-6ada-4548-bde5-88dce5eaeca2.jpg)

## GOAL

Tiro Notes is a light markdown note editor flexible enough to be used on all your devices.

Aims to offer all functionalities expected from applications like Evernote, Onenote, Joplin etc... 

While keeping all your datas in a simple folder with markdown files you can edit and sync anywhere else.

- No database, only markdown files 
- Fast and lightweight
- Web-based (can be installed on a server, accessed on any device with a browser)
- Windows/Mac/Linux standalone applications
- Can be installed on Android with termux

## INSTALLATION
### APPS (Not yet)

Mac/Linux/Windows Electron Apps coming soon...

### CLI ONE LINER (Not working yet)
you need nodejs installed (v14 minimum)

```
npx @tiro/app ./my-markdown-folder
```

### USING CLI
- you need nodejs installed (v14 minimum)
- you need ripgrep installed (https://github.com/BurntSushi/ripgrep)

```
$ curl -O -L https://github.com/dotgreg/tiro/releases/download/pre-production/tiro-0.24-node.zip
$ unzip tiro-0.24-node.zip
$ cd tiro
$ npm start
```
- Go to localhost:3023

## CURRENT STATUS
I have been developing it for over a year and using it as my daily note app for over 6 months now, its core functionalities seems stable enough for my use so far.
I haven't been loosing any data so far, and there is always the history note functionality in that case.

However, I consider that application still in alpha phase, it still needs a lot of testing to be considered robust.

So use it at your own risk, and always with data you can afford to lose.

I am not responsible of any data loss!

## FUNCTIONALITIES & DEV ETA OVERVIEW

```
... = working on it
|---------------------+-----------------------------------+---------|
| TYPE                | FUNCTION                          | STATUS  |
|---------------------+-----------------------------------+---------|
| Note Edition        | markdown dual editor              | OK      |
|                     | note id, note tags, note link     | OK      |
|                     | attach image/document             | OK      |
|                     | drag and drop                     | OK      |
|                     | note encryption                   | OK      |
|                     | note images as slideshow          | OK      |
|                     | note history                      | OK      |
|                     | note download (pdf via print)     | Beta    |
|                     | text to speech                    | Beta    |
|                     | collaborative edition             | Planned |
|---------------------+-----------------------------------+---------|
| Notes list          | Notes Infinite scroll list        | OK      |
|                     | Image gallery view                | OK      |
|                     | Sort List                         | OK      |
|                     | Last Notes edited (per device)    | OK      |
|                     | Notes Management (CRUD)           | OK      |
|                     | Folder management (CRUD)          | OK      |
|---------------------+-----------------------------------+---------|
| Note Search         | Searching note from content       | OK      |
|                     | Searching note from title         | OK      |
|---------------------+-----------------------------------+---------|
| Desktop Application | Nodejs application                | OK      |
|                     | Windows/Mac/linux                 | ...     |
|                     | Cli via NPX                       | ...     |
|---------------------+-----------------------------------+---------|
| Mobile Applications | Android (via termux)              | OK      |
|                     | Mobile/tablet interface           | OK      |
|---------------------+-----------------------------------+---------|
| Other               | Application login (user/password) | OK      |
|                     |                                   |         |
|---------------------+-----------------------------------+---------|
```

# FAQ

## How can I sync my notes folder on other devices?
You can use any sync solution like dropbox, google drive, resilio sync, syncthings etc...

## Can I edit my notes on another application?
Yes, all the datas Tiro uses is coming from markdown notes

## How can I access to Tiro on my device
1) Device where tiro is installed : http://localhost:3023
2) If on same local network: http://192.168.xx.xx:3023 where that ip is the ip of the device where tiro is installed
3) Not on same network : Tiro works great using SSH tunneling, AutoSSH or similar (free ssh tunnels solutions exists like https://opentunnel.net/)

