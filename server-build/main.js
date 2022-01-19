const execa = require('execa');
const path = require('path')
const fs = require('fs')

console.log('hello world pkg')

let execCmd = async () => {
    // let exePath = './rg/rg-win.exe'
    let rgPath = path.join(__dirname, './rg/rg-win.exe')
    console.log(rgPath);
    // let rgPath = path.join(process.cwd(), 'rg1.exe')
    // let rgPath = path.join(process.cwd(), './rg/rg-win.exe')
    // let rgPath = path.join(__dirname, './rg/rg-win.exe')
    // const {stdout2} = await execa.command(`ls C:\\snapshot`)
    // let rgPathSnapshot =  path.join(__dirname, './rg/rg-win2.exe')
    // console.log(stdout2);
    // const fileBuffer = fs.readFileSync(rgPath)
    // fs.writeFileSync('./rg2.exe', fileBuffer)
    const fileBuffer = fs.readFileSync(path.resolve(__dirname, './rg/rg-win.exe'))
    let rgTemp = './rgtemp.exe'
    fs.writeFileSync(rgTemp, fileBuffer)
    const {stdout} = await execa.command(`${rgTemp} test ../../data`)
    console.log(stdout);
    // const {stdout3} = await execa.command(`cp ${rgPath} ./rg2.exe`)
    // console.log(stdout3);
    // const {stdout} = await execa.command(`./rgwin.exe elise ../../data`)
    // console.log(stdout);
}
execCmd() 
