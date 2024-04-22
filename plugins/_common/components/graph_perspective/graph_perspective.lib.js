//@flow
const openPlotlyWindow = (api, csvString, id) => {
    console.log("open plotly")
    const plotlyStyle = `
        body, html {
            height: 100%;
            margin: 0;
            padding: 0;
        }
        #plotly { 
            margin: 30px 30px 30px 0px;
            height: calc(100% - 60px);
            width: calc(100% - 230px);
        }
        #buttonsWrapper {
            position: absolute;
            top: 30px;
            left: 10px;
            z-index: 100;
        }
        #buttonsWrapper button {
            margin-right: 10px;
        }
        #interface-wrapper {
            display: flex;
            height: 100%;
        }
        #textarea-wrapper {
            height: calc(100% - 78px);
            margin-top: 70px;
            z-index: 100;
            position: relative;
            margin-left: 10px;
        }
        #textarea-wrapper textarea {
            height: 100%;
        }
    `
    const contentCtagPlotly = `
            window.disableCache=true;
            
            api.utils.loadRessources(
                [
                    "https://cdn.plot.ly/plotly-latest.min.js",
                ],
                () => {
                    setTimeout(() => {
                            api.utils.resizeIframe("100%");
                    }, 100)
                    // const div = document.createElement("div")
                    // div.id = "plotly"
                    // document.body.appendChild(div)
                    // const buttonsWrapper = document.createElement("div")
                    // buttonsWrapper.id = "buttonsWrapper"
                    // document.body.appendChild(buttonsWrapper)
                    document.body.innerHTML = \`
                        <div id="interface-wrapper">
                            <div id="textarea-wrapper">
                                <textarea placeholder="Enter your custom plotly data here"></textarea>
                            </div>
                            <div id="plotly"></div>
                        </div>
                        <div id="buttonsWrapper"></div>
                    \`

                    //
                    // on resize
                    //
                    window.onresize = function() {
                        console.log("resize")
                        Plotly.Plots.resize(document.getElementById('plotly'))
                    }
                    

                    //
                    // csvString to array
                    //
                    const csvString = \`${csvString}\`
                    const csvArray = csvString.split("\\n").map(row => row.split(","))
                    // console.log("csvArray", csvArray.length)
                    let colsNames = csvArray[0]
                    let colsValues = []
                    let dataType = []
                    if (csvArray.length > 2) {
                        for (let i = 0; i < colsNames.length; i++) {
                            for (let j = 1; j < csvArray.length; j++) {
                                if (!colsValues[i]) colsValues[i] = []
                                let val = csvArray[j][i]
                                if (!val) continue
                                val = val.trim()
                                // remove " and ' inside val
                                val = val.replace(/['"]+/g, '')
                                colsValues[i].push(val)
                                if (!dataType[i]) {
                                    dataType[i] = parseInt(val) ? "number" : "string"
                                }
                            }
                        }
                    } else {
                        console.log("not enough data, loading fake data")
                        const fakeData = \`[[" PA"," NY"," WI"," FL"," CA"," MN"," OR"," NC"," ND"," SC"," OH"," TX"," SD"," PA"," DC"," FL"," SD"," MB"," NB"," PA"," KS"," GA"," NY"," IN"," TX"," IL"," WY"," CA"," MO"," UT"," DE"," MI"," CA"," UT"," FL"," MO"," CA"," KS"," WV"," IN"," WA"," IN"," NM"," CA"," ON"," OH"," TX"," WI"," WI"," CO"," MO"," VT"," WA"," GA"," WA"," CA"," WY"," MN"," ID"," CT"," TX"," SD"," VA"," WI"," CO"," NV"," IA"," LA"," IA"," MI"," IN"," FL"," OH"," TX"," CA"," WA"," CA"," TX"," AL"," CA"," TX"," VT"," MI"," SA"," PA"," NM"," MD"," IL"," OH"," MS"," TX"," FL"," CA"," PA"," MA"," BC"," IL"," VA"," PA"," MS"," NC"," WA"," GA"," AZ"," NJ"," MO"," OK"," AL"," VA"," CO"," CA"," ND"," OK"," VA"," NY"," OH "," NY"," CA"," OH"," NC"," MA"," MI"," WV"," WA"," GA"," KS"," NY"," MN"],["59","58","57","57","57","57","56","56","55","55","55","54","54","54","53","53","52","52","52","50","50","49","49","49","48","47","47","46","46","46","45","45","45","45","43","42","42","41","40","40","40","40","40","40","39","39","38","38","37","37","37","36","35","35","35","35","35","34","33","32","32","32","32","31","31","31","30","30","29","29","28","27","27","27","26","25","25","25","25","25","25","25","25","25","24","24","22","21","21","20","20","20","20","19","16","16","16","16","15","15","14","14","13","13","13","13","13","12","11","10","10","9","9","9","9","9","6","6","5","5","5","5","4","4","4","2","2","1"]]\`
                        const fakeDataArray = JSON.parse(fakeData)
                        colsValues = fakeDataArray
                    }
                    console.log("colsValues", colsValues, colsNames, dataType)
                    // console.log(JSON.stringify(colsValues))

                    //
                    // add a style
                    //
                    const style = document.createElement("style")
                    style.innerHTML = \`${plotlyStyle}\`
                    document.head.appendChild(style)

                    //
                    // plotly
                    //
                    
                    var dataScatterStr = \`[{
                        type: 'scatter',
                        x: colsValues[0],
                        y: colsValues[1],
                        mode: 'markers',
                    }]\`

                    var dataPlotBoxStr = \`[{
                        x: colsValues[0],
                        y: colsValues[1],
                        type: 'box',
                        boxpoints: 'all',
                        jitter: 0.3,
                        pointpos: -2,
                    }]\`

                    // generate buttons for each plot type
                    const plotTypes = ["scatter", "box", "custom"]
                    const buttons = plotTypes.map((plotType) => {
                        const button = document.createElement("button")
                        button.innerHTML = plotType
                        button.onclick = () => {
                            loadPlot(plotType)
                        }
                        buttonsWrapper.appendChild(button)
                    })
                    // add a textarea in buttonsWrapper
                    // const textarea = document.createElement("textarea")
                    // textarea.style.width = "100%"
                    // textarea.style.height = "100px"
                    // textarea.placeholder = "Enter your custom plotly data here"
                    // buttonsWrapper.appendChild(textarea)

                    const loadPlot = (plotType) => {
                        let configStr = ""
                        if (plotType === "scatter") configStr = dataScatterStr
                        if (plotType === "box") configStr = dataPlotBoxStr
                        if (plotType === "custom")  configStr = document.querySelector("textarea").value
                        // clean plot 
                        Plotly.purge('plotly')
                        Plotly.plot('plotly', eval(configStr))
                        // replace textarea value with the current plotly data
                        document.querySelector("textarea").value = configStr
                    }
                      
                    loadPlot("scatter")
                    
                    // Plotly.plot('plotly', dataScatter)
                    // console.log(Plotly.validate(data))
                    
                    

                }
            );
    `
    const floatingPanelConfig = {
            type: "ctag",
            ctagConfig: {
                tagName: "script",
                content: contentCtagPlotly,
            },
            id
    }
    api.call("ui.floatingPanel.create", [floatingPanelConfig])
    
}


const graphPerspectiveLib = {openPlotlyWindow}
// export flow type from timerLib
/*::
export type iGraphPerspectiveLib = typeof graphPerspectiveLib;
*/

if (!window._tiroPluginsCommon) window._tiroPluginsCommon = {}
window._tiroPluginsCommon.graphPerspectiveLib = graphPerspectiveLib