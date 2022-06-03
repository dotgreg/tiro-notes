### How can I sync my notes folder on other devices?
You can use any sync solution like dropbox, google drive, resilio sync, syncthings etc...

### Can I edit my notes on another application?
Yes, all the datas Tiro uses is coming from markdown notes. So you can edit your notes in other applications without any problem.

### Where are located the configuration file and the logs of Tiro?
The configuration file is located at ```~/.tiro-config.json``` for linux, mac and termux android and under ```/Users/USER_NAME/.tiro-config.json```in windows.
The logs are also located at the same path ```.tiro-logs.txt``` if using NPX or Node directly and ```.tiro-electron-log.txt``` if using Tiro Notes Desktop Apps.

### How can I use Tiro in the Web?
1) Device where tiro is installed : http://localhost:3023 
2) If on same Wifi/local network: http://192.168.xx.xx:3023 where that ip is the ip of the device where tiro is installed
3) Not on same network : Tiro works great using SSH tunneling, AutoSSH or similar (free ssh tunnels solutions exists like https://opentunnel.net/). Npx tiro-notes also includes a --tunnel option for easy tunneling.
4) On the cloud: You can self-host/install Tiro Notes on your server and access it from anywhere.

### What is the current status of Tiro Notes? 
I have been developing it for over a year and using it as my daily note app for over 6 months now, its core functionalities seems stable enough for my use so far.
I haven't been loosing any data so far, and there is always the history note functionality in that case.

However, I consider that application still in alpha phase, it still needs a lot of testing to be considered robust.
So use it at your own risk, and always with data you can afford to lose.

### How can I contribute?

Contributions and PR are welcome! You can contact me for more details on the ROADMAP and how to be involved.

Right now, Tiro Notes needs testers to stabilize the current scope of functionalities and to give feedbacks on it.

Also translation can be a nice thing to have in the future.

Twitter News & Updates : https://twitter.com/NotesTiro