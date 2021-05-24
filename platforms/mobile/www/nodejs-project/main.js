const cordova = require('cordova-bridge');

// const cordova = null
// curl -H "Content-Type: application/json" -X POST -d '{"username":"foo","email":"bar@foo.com"}' http://webhook.logentries.com/noformat/logs/5b26ee19-7439-4740-9d79-3fd6b4b94618


// console.log('BACKEND JS INITIALIZED');
// console.log('BACKEND JS INITIALIZED222222');

// const express = require('express')
// const app = express()
// const port = 4044
// app.listen(port, () => {
//   // logEntry(`Example app listening at http://localhost:${port}`)
//   console.log(`YOYOYO app listening at http://localhost:${port} 2`)
  
// })
// app.get('/', (req, res) => { 
//   let list = []
//   require('fs').readdirSync('/sdcard').map(async (child) => {
//     list.push(child)
//   })
//   let obj = {answer: 'hello world from nodejs api in mobile!', list}
//   console.log(obj)
//   res.send(obj)
// });

// if (cordova) { 
//   cordova.channel.on('message', function (msg) {
//     console.log('[node] received:', msg);
//     // var net = require('net')
//     // net.createServer(opts, handler).listen(port, host)
//     let ips = JSON.stringify(require('os').networkInterfaces())
//     let res = `${ips} 'WOHOOO MESSAGE FROM NODEJS BACKKKK! ${msg}`
//     // let res = `WOHOOO MESSAGE FROM NODEJS BACKKKK! ${msg}`
//     cordova.channel.send(res);
//   });
// }


setTimeout(() => {
  // const other = require('./other');
  // other.otherFunc()
 
  // try {
  //   require('./tiro/server/server');
  // } catch (error) {
  //   console.log(`FAILED TO EXECUTE TIRO CODE : ${JSON.stringify(error)}`)
  // }

    require('./tiro/server/server');
})












const axios = require('axios')
const logEntry = (msg) => {
  axios
    .post('http://webhook.logentries.com/noformat/logs/2df00922-0193-4aad-a142-6fa5a2b5af2d', msg)
}
// CONSOLE REWRITE
var _console={...console}
console.log = function(...args) {
    var msg = {...args}[0];
    logEntry(msg)
    _console.log('wooop', ...args);
}


// const post = (url, jsonData, port=80) => {
//   const stringData = JSON.stringify(jsonData)
//   const https = require('https')
//   const options = {
//     hostname: url,
//     port: 443,
//     path: '/todos',
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Content-Length': stringData.length
//     }
//   }
//   const req = https.request(options, res => {
//     console.log(`statusCode: ${res.statusCode}`)
//     res.on('data', d => {
//       process.stdout.write(d)
//     })
//   })
//   req.on('error', error => {
//     console.error(error)
//   })
//   req.write(stringData)
//   req.end()
// }
