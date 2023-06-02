import { random } from "lodash";
import { execString, execStringStream } from "../exec.manager"

test('execStringStream: echo linux returns its result',  done => {
    execStringStream("echo hello world", (r) => {
        if(r.isLast) return done()
        console.log(333, r.text, r.isLast)
        expect(r.text).toBe("hello world\n");
    })
})

const testFolder = `~/.tiro_test_folder`
const randomFilePath = `${testFolder}/.test-file-${random(0,100000)}`
const resetFolderPath = async () => {
    await execString(`rm -r ${testFolder}`)
    await execString(`mkdir ${testFolder}`)
}

test('LINUX exec async: wait for its end of exec',  async () => {
    await resetFolderPath()
    let r = ""
    r = await execString(`echo "111" >> ${randomFilePath}; cat ${randomFilePath};`)
    expect(r.endsWith("111")).toBe(true);
    r = await execString(`echo "222" >> ${randomFilePath}; cat ${randomFilePath};`)
    r = await execString(`echo "333" >> ${randomFilePath}; cat ${randomFilePath};`)
    r = await execString(`echo "444" >> ${randomFilePath}; cat ${randomFilePath};`)
    expect(r.endsWith("444")).toBe(true);
    r = await execString(`echo "555" >> ${randomFilePath}; cat ${randomFilePath};`)
    r = await execString(`echo "666" >> ${randomFilePath}; cat ${randomFilePath};`)
    r = await execString(`echo "777" >> ${randomFilePath}; cat ${randomFilePath};`)
    r = await execString(`echo "888" >> ${randomFilePath}; cat ${randomFilePath};`)
    expect(r.endsWith("888")).toBe(true);
})



test('LINUX execStringStream: tail -f + echo to test a text that is incrementally inserted in a file',  
(done) => {
        
    execString(`mkdir ${testFolder}`).then(() => {
        execString(`echo "" > ${randomFilePath}`).then(() => {
            // start listening
            execStringStream(`tail -f ${randomFilePath}`, (r) => {
                // console.log(123, i, isLast, resTot)
                if (r.index > 0) {
                    expect(r.textTot.includes("111")).toBe(true);
                    done()
                }
            })
            setTimeout(() => {
                execString(`echo "111" >> ${randomFilePath}`).then(() => {
                    setTimeout(() => {
                        execString(`echo "222" >> ${randomFilePath}`).then(() => {
                            setTimeout(() => {
                                execString(`echo "333" >> ${randomFilePath}`).then(() => {
                                    
                                })
                            }, 100)
                        })
                    }, 100)
                })    
            }, 100)
        })
    })
})