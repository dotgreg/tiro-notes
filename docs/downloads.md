### 1. Desktop Applications <!-- {docsify-ignore} -->

Mac/Linux/Windows Applications can be downloaded [here](https://github.com/dotgreg/tiro-notes/releases/tag/production) 

- For MacOs users, meanwhile I am working on the signing process, you can open the application by going to ```System preference > Security & Privacy > "Tiro Notes was blocked..." > Open Anyway```

### 2. Android/Ios  <!-- {docsify-ignore} -->
- You need to use a terminal app. Tested on unrooted Android with [Termux](https://termux.com). Untested on iOS with iSH
- Requirements : [NodeJs](https://nodejs.org/en/download/) and [RipGrep](https://github.com/BurntSushi/ripgrep)

#### Android with Termux
```
pkg install ripgrep nodejs;
npx tiro-notes@latest;
```

- ```npx tiro-notes@latest --help``` for all available options
- You can then use tiro on all your devices by connecting to:
  - ```http://myandroidip:3023``` on a local wifi network
  - the shared wifi network of your phone
  - ```mywebsite.com:3023``` if you use the included tunneling system ```-t root@mywebsite:3023```. That is especially useful if you want to keep your data on your local devices while being able to easily access to it anywhere.

### 3. As a self-hosted Web Server  <!-- {docsify-ignore} -->
- This works with any platform/device.
- Requirements : [NodeJs](https://nodejs.org/en/download/) and [RipGrep](https://github.com/BurntSushi/ripgrep)

```
npx tiro-notes@latest (-s t)
```
- then connects to ```http(s)://YOURSERVER.com:3023```
- ```-s t``` uses self signed SSL certificates for secured connection.

<img src="https://user-images.githubusercontent.com/2981891/159723396-b5e81dcd-a4aa-4581-9b7f-e3b62bcdef65.gif" width="600"/>


