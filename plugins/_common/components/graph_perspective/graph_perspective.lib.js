//@flow
const openPlotlyWindow = (api, csvStringExt, id) => {
    console.log("open plotly")
    

    const logicInt = (csvString) => {
        setTimeout(() => {
            api.utils.resizeIframe("100%");
        }, 100)
        document.body.innerHTML = `
            <div class="config-wrapper">
                        <select id="config-select"> </select> 
                    <div id="buttonsWrapper"> </div>
                    <div id="views-buttons-wrapper"> </div>
                    <button id="config-save"> 💾 </button>
                    <button id="config-delete"> ❌ </button>
                    <button id="config-help"> ? </button>
            </div>
            <div id="interface-wrapper">
                
                <div id="left-wrapper">
                    <div id="table-preview-wrapper"></div>
                    <div id="textarea-wrapper">
                        <textarea placeholder="Enter your custom plotly data here"></textarea>
                    </div>
                </div>
                <div id="plotly"></div>
            </div>
            
        `
        const plotlyStyle = `
            body, html {
                height: 100%;
                margin: 0;
                padding: 0;
            }
            #plotly { 
                margin: 0px 0px 0px 0px;
                height: calc(100% - 60px);
                width: calc(100% - 30vw);
            }
            
            #interface-wrapper {
                display: flex;
                height: 100%;
            }
            #left-wrapper {
                height: calc(100% - 78px);
                z-index: 100;
                position: relative;
                margin-left: 10px;
            }
            #left-wrapper #textarea-wrapper {
                height: calc(100% - 200px);
                overflow-y: auto;
                padding: 10px;
                background-color: #f9f9f9;
            }
            #left-wrapper #textarea-wrapper textarea {
                height: 100%;
                width: 30vw;
                min-width: 170px
            }
            #table-preview-wrapper {
                max-height: 200px;
                overflow-y: auto;
                background-color: #f9f9f9;
                padding: 10px;
            }
            #table-preview-wrapper table {
                width: 100%;
                border-collapse: collapse;
                border-spacing: 0;
            }


            .config-wrapper {
                display:flex;
                margin-top: 30px;
            }
            #config-select {
                display:none;
            }
        `

        //
        // on resize
        //
        window.onresize = function() {
            console.log("resize")
            Plotly.Plots.resize(document.getElementById('plotly'))
        }
        








        ////////////////////////////////////////////////////////////////////////////////////
        // VIEWS CACHING
        //

        const configSelect = document.getElementById("config-select");
        const configSave = document.getElementById("config-save");
        const configDelete = document.getElementById("config-delete");
        configSelect.addEventListener("change", (e) => {
            restoreView(e.target.value);
        });
        
        const saveNewView = (view/*:iView*/, cb/*:Function*/) => {
            getViewsCache(
                views => {
                    // if name already exists, overwrite it
                    const foundIdx = views.findIndex(v => v.name === view.name)
                    if (foundIdx !== -1) views[foundIdx] = view
                    else views.push(view)
                    // reorder views by name 
                    views = views.sort((a, b) => a.name.localeCompare(b.name))
                    setViewsCache(views, cb)
                }, () => {
                    setViewsCache([view], cb)
                }
            )
        }
        const viewsSync = {curr: [], selectedName: ""}
        const getCache = (id/*:string*/) => (onSuccess/*:(views:iView[]) => void*/, onFailure/*:([]) => void*/) => {
            let nviews = []
            api.call("cache.get", [id], content => {
                let viewsFinal = []
                if (content !== undefined && content !== null && content.length !== 0) viewsFinal = [...nviews, ...content]
                else viewsFinal = nviews

                viewsSync.curr = [...viewsFinal]
                if (viewsFinal.length > 0 && viewsSync === "") viewsSync.selectedName = viewsFinal[0].name

                onSuccess(viewsFinal)
            })
        }

        const setCache = (id/*:string*/) => (views/*:iView[]*/, cb/*:Function*/) => {
            api.call("cache.set", [id, views, -1], () => {if(cb) cb()}) 
        }
        const cacheViewsId = `lib-graph-plotly-views`

        const getCurrConfig = () => {
            return document.querySelector("textarea").value
        }
        const setCurrConfig = (config/*:string*/) => {
            document.querySelector("textarea").value = config
            
        }
        const restoreView = (name/*:string*/) => {
            viewsSync.selectedName = name
            const view = viewsSync.curr.find(v => v.name === name)
            setCurrConfig(view.config)
            loadPlot("custom")
        }

        // if config save, prompt for a name and save it
        configSave.addEventListener("click", () => {
            const config = getCurrConfig()
            let name = prompt("Enter a name for the config ", viewsSync.selectedName);
            if (name) {
                console.log("saving config", name, config)
                viewsSync.selectedName = name
                saveNewView({name, config}, () => {
                    reloadViewsSelect()
                })
            }
        });
        configDelete.addEventListener("click", () => {
            let name = configSelect.value
            if (name) {
                deleteView(name, () => {
                    reloadViewsSelect()
                })
            }
        })
        const deleteView = (viewName/*:string*/, cb/*:Function*/) => {
            // prompt sure? 
            if (confirm(`Are you sure you want to delete the view ${viewName}?`)) {
                getViewsCache(
                    views => {
                        setViewsCache(views.filter(v => v.name !== viewName), cb)
                    },
                    () => {cb()}
                )
            }
        }
        window.restoreView = restoreView
        const genViewsButtons = (views/*:iView[]*/) => {
            // add buttons for each view in #views-buttons-wrapper
            const viewsButtonsWrapper = document.getElementById("views-buttons-wrapper")
            viewsButtonsWrapper.innerHTML = views.map(v => `<button class="btn" onclick="window.restoreView('${v.name}')">${v.name}</button>`).join("")
        }
        const reloadViewsSelect = (cb/*:Function*/) => {
            getViewsCache(
                views => {
                    genViewsButtons(views)
                    configSelect.innerHTML = views.map(v => `<option value="${v.name}">${v.name}</option>`).join("")
                    if (views.length > 0) {
                        updateSelectActiveOption(viewsSync.selectedName)
                        restoreView(viewsSync.selectedName)
                    }
                    if (cb) cb(views)
                },
                () => {
                    configSelect.innerHTML = ""
                    if (cb) cb([])
                }
            )   
        }
        

        
        // update the select option to active
        const updateSelectActiveOption = (viewName/*:string*/) => {
            const options = configSelect.options
            for (let i = 0; i < options.length; i++) {
                if (options[i].value === viewName) {
                    configSelect.selectedIndex = i
                    break
                }
            }
        }

        // window._graph_perspective_props
        const getViewsCache = getCache(cacheViewsId)
        const setViewsCache = setCache(cacheViewsId)
        reloadViewsSelect()








        ////////////////////////////////////////////////////////////////////////////////////
        // TABLE UPDATER
        //
        const updateTablePreview = (dataArr, limit) => {
            
            // if dataArr[0] is an Array
            // console.log("updateTablePreview1", dataArr, Array.isArray(dataArr[0]), dataArr[0])
            if (Array.isArray(dataArr[0])) {
                dataArrDic = []
                for (let i = 0; i < dataArr[0].length; i++) {
                    for (let j = 0; j < dataArr.length; j++) {
                        if (!dataArrDic[i]) dataArrDic[i] = {}
                        dataArrDic[i][colsNames[j]] = dataArr[j][i]
                    }
                }
                dataArr = dataArrDic
            } 
            dataArrRaw = [...dataArr]
            
            // #table-preview-wrapper
            tableWrapper = document.getElementById("table-preview-wrapper")
            tableWrapper.innerHTML = ""
            const table = document.createElement("table")
            // dataArr looks [{col1Name:value1, col2Name:value2, ...}, {col1Name:value1, col2Name:value2, ...}, ...]
            // add header
            const header = document.createElement("tr")
            for (let i = 0; i < colsNames.length; i++) {
                const cell = document.createElement("th")
                cell.innerHTML = colsNames[i]
                header.appendChild(cell)
            }
            // if limit reached, split table in 2 with in the middle a row with "..."
            if (limit && dataArr.length > limit) {
                console.log("limit reached", limit)
                const dataArr1 = dataArr.slice(0, limit / 2)
                const dataArr2 = dataArr.slice(dataArr.length - limit / 2)
                // take the last row and replace the values with "..."
                const dotsRow = dataArr1[dataArr1.length - 1]
                for (let i = 0; i < colsNames.length; i++) {
                    dotsRow[colsNames[i]] = "..."
                }
                dataArr1.push(dotsRow)
                dataArr = [...dataArr1, ...dataArr2]
            }

            

            // first row > first cell is "rows: x"
            const stats = {}
            for (let i = 0; i < colsNames.length; i++) {
                if (i === 0) stats[colsNames[i]] = `rows: ${dataArrRaw.length} `
                else if (i === 1) stats[colsNames[i]] = `cols: ${colsNames.length} `
                // else if (i === 2) stats[colsNames[i]] = `cols: ${colsNames.length}`
                else stats[colsNames[i]] = ""
            }
            dataArr.unshift(stats)

            

            console.log("updateTablePreview2", dataArr)
            
            // add header
            table.appendChild(header)
            
            for (let i = 0; i < dataArr.length; i++) {
                const row = document.createElement("tr")
                for (let j = 0; j < colsNames.length; j++) {
                    const cell = document.createElement("td")
                    cell.innerHTML = dataArr[i][colsNames[j]]
                    row.appendChild(cell)
                }
                table.appendChild(row)
            }

            tableWrapper.appendChild(table)
        }

















        ////////////////////////////////////////////////////////////////////////////////////
        // String to Array INPUT
        //
        const fakeData1 = `"class","sepal length","sepal width","petal length","petal width"\n"Iris-setosa",5.1,3.5,1.4,0.2\n"Iris-setosa",4.9,3,1.4,0.2\n"Iris-setosa",4.7,3.2,1.3,0.2\n"Iris-setosa",4.6,3.1,1.5,0.2\n"Iris-setosa",5,3.6,1.4,0.2\n"Iris-setosa",5.4,3.9,1.7,0.4\n"Iris-setosa",4.6,3.4,1.4,0.3\n"Iris-setosa",5,3.4,1.5,0.2\n"Iris-setosa",4.4,2.9,1.4,0.2\n"Iris-setosa",4.9,3.1,1.5,0.1\n"Iris-setosa",5.4,3.7,1.5,0.2\n"Iris-setosa",4.8,3.4,1.6,0.2\n"Iris-setosa",4.8,3,1.4,0.1\n"Iris-setosa",4.3,3,1.1,0.1\n"Iris-setosa",5.8,4,1.2,0.2\n"Iris-setosa",5.7,4.4,1.5,0.4\n"Iris-setosa",5.4,3.9,1.3,0.4\n"Iris-setosa",5.1,3.5,1.4,0.3\n"Iris-setosa",5.7,3.8,1.7,0.3\n"Iris-setosa",5.1,3.8,1.5,0.3\n"Iris-setosa",5.4,3.4,1.7,0.2\n"Iris-setosa",5.1,3.7,1.5,0.4\n"Iris-setosa",4.6,3.6,1,0.2\n"Iris-setosa",5.1,3.3,1.7,0.5\n"Iris-setosa",4.8,3.4,1.9,0.2\n"Iris-setosa",5,3,1.6,0.2\n"Iris-setosa",5,3.4,1.6,0.4\n"Iris-setosa",5.2,3.5,1.5,0.2\n"Iris-setosa",5.2,3.4,1.4,0.2\n"Iris-setosa",4.7,3.2,1.6,0.2\n"Iris-setosa",4.8,3.1,1.6,0.2\n"Iris-setosa",5.4,3.4,1.5,0.4\n"Iris-setosa",5.2,4.1,1.5,0.1\n"Iris-setosa",5.5,4.2,1.4,0.2\n"Iris-setosa",4.9,3.1,1.5,0.1\n"Iris-setosa",5,3.2,1.2,0.2\n"Iris-setosa",5.5,3.5,1.3,0.2\n"Iris-setosa",4.9,3.1,1.5,0.1\n"Iris-setosa",4.4,3,1.3,0.2\n"Iris-setosa",5.1,3.4,1.5,0.2\n"Iris-setosa",5,3.5,1.3,0.3\n"Iris-setosa",4.5,2.3,1.3,0.3\n"Iris-setosa",4.4,3.2,1.3,0.2\n"Iris-setosa",5,3.5,1.6,0.6\n"Iris-setosa",5.1,3.8,1.9,0.4\n"Iris-setosa",4.8,3,1.4,0.3\n"Iris-setosa",5.1,3.8,1.6,0.2\n"Iris-setosa",4.6,3.2,1.4,0.2\n"Iris-setosa",5.3,3.7,1.5,0.2\n"Iris-setosa",5,3.3,1.4,0.2\n"Iris-versicolor",7,3.2,4.7,1.4\n"Iris-versicolor",6.4,3.2,4.5,1.5\n"Iris-versicolor",6.9,3.1,4.9,1.5\n"Iris-versicolor",5.5,2.3,4,1.3\n"Iris-versicolor",6.5,2.8,4.6,1.5\n"Iris-versicolor",5.7,2.8,4.5,1.3\n"Iris-versicolor",6.3,3.3,4.7,1.6\n"Iris-versicolor",4.9,2.4,3.3,1\n"Iris-versicolor",6.6,2.9,4.6,1.3\n"Iris-versicolor",5.2,2.7,3.9,1.4\n"Iris-versicolor",5,2,3.5,1\n"Iris-versicolor",5.9,3,4.2,1.5\n"Iris-versicolor",6,2.2,4,1\n"Iris-versicolor",6.1,2.9,4.7,1.4\n"Iris-versicolor",5.6,2.9,3.6,1.3\n"Iris-versicolor",6.7,3.1,4.4,1.4\n"Iris-versicolor",5.6,3,4.5,1.5\n"Iris-versicolor",5.8,2.7,4.1,1\n"Iris-versicolor",6.2,2.2,4.5,1.5\n"Iris-versicolor",5.6,2.5,3.9,1.1\n"Iris-versicolor",5.9,3.2,4.8,1.8\n"Iris-versicolor",6.1,2.8,4,1.3\n"Iris-versicolor",6.3,2.5,4.9,1.5\n"Iris-versicolor",6.1,2.8,4.7,1.2\n"Iris-versicolor",6.4,2.9,4.3,1.3\n"Iris-versicolor",6.6,3,4.4,1.4\n"Iris-versicolor",6.8,2.8,4.8,1.4\n"Iris-versicolor",6.7,3,5,1.7\n"Iris-versicolor",6,2.9,4.5,1.5\n"Iris-versicolor",5.7,2.6,3.5,1\n"Iris-versicolor",5.5,2.4,3.8,1.1\n"Iris-versicolor",5.5,2.4,3.7,1\n"Iris-versicolor",5.8,2.7,3.9,1.2\n"Iris-versicolor",6,2.7,5.1,1.6\n"Iris-versicolor",5.4,3,4.5,1.5\n"Iris-versicolor",6,3.4,4.5,1.6\n"Iris-versicolor",6.7,3.1,4.7,1.5\n"Iris-versicolor",6.3,2.3,4.4,1.3\n"Iris-versicolor",5.6,3,4.1,1.3\n"Iris-versicolor",5.5,2.5,4,1.3\n"Iris-versicolor",5.5,2.6,4.4,1.2\n"Iris-versicolor",6.1,3,4.6,1.4\n"Iris-versicolor",5.8,2.6,4,1.2\n"Iris-versicolor",5,2.3,3.3,1\n"Iris-versicolor",5.6,2.7,4.2,1.3\n"Iris-versicolor",5.7,3,4.2,1.2\n"Iris-versicolor",5.7,2.9,4.2,1.3\n"Iris-versicolor",6.2,2.9,4.3,1.3\n"Iris-versicolor",5.1,2.5,3,1.1\n"Iris-versicolor",5.7,2.8,4.1,1.3\n"Iris-virginica",6.3,3.3,6,2.5\n"Iris-virginica",5.8,2.7,5.1,1.9\n"Iris-virginica",7.1,3,5.9,2.1\n"Iris-virginica",6.3,2.9,5.6,1.8\n"Iris-virginica",6.5,3,5.8,2.2\n"Iris-virginica",7.6,3,6.6,2.1\n"Iris-virginica",4.9,2.5,4.5,1.7\n"Iris-virginica",7.3,2.9,6.3,1.8\n"Iris-virginica",6.7,2.5,5.8,1.8\n"Iris-virginica",7.2,3.6,6.1,2.5\n"Iris-virginica",6.5,3.2,5.1,2\n"Iris-virginica",6.4,2.7,5.3,1.9\n"Iris-virginica",6.8,3,5.5,2.1\n"Iris-virginica",5.7,2.5,5,2\n"Iris-virginica",5.8,2.8,5.1,2.4\n"Iris-virginica",6.4,3.2,5.3,2.3\n"Iris-virginica",6.5,3,5.5,1.8\n"Iris-virginica",7.7,3.8,6.7,2.2\n"Iris-virginica",7.7,2.6,6.9,2.3\n"Iris-virginica",6,2.2,5,1.5\n"Iris-virginica",6.9,3.2,5.7,2.3\n"Iris-virginica",5.6,2.8,4.9,2\n"Iris-virginica",7.7,2.8,6.7,2\n"Iris-virginica",6.3,2.7,4.9,1.8\n"Iris-virginica",6.7,3.3,5.7,2.1\n"Iris-virginica",7.2,3.2,6,1.8\n"Iris-virginica",6.2,2.8,4.8,1.8\n"Iris-virginica",6.1,3,4.9,1.8\n"Iris-virginica",6.4,2.8,5.6,2.1\n"Iris-virginica",7.2,3,5.8,1.6\n"Iris-virginica",7.4,2.8,6.1,1.9\n"Iris-virginica",7.9,3.8,6.4,2\n"Iris-virginica",6.4,2.8,5.6,2.2\n"Iris-virginica",6.3,2.8,5.1,1.5\n"Iris-virginica",6.1,2.6,5.6,1.4\n"Iris-virginica",7.7,3,6.1,2.3\n"Iris-virginica",6.3,3.4,5.6,2.4\n"Iris-virginica",6.4,3.1,5.5,1.8\n"Iris-virginica",6,3,4.8,1.8\n"Iris-virginica",6.9,3.1,5.4,2.1\n"Iris-virginica",6.7,3.1,5.6,2.4\n"Iris-virginica",6.9,3.1,5.1,2.3\n"Iris-virginica",5.8,2.7,5.1,1.9\n"Iris-virginica",6.8,3.2,5.9,2.3\n"Iris-virginica",6.7,3.3,5.7,2.5\n"Iris-virginica",6.7,3,5.2,2.3\n"Iris-virginica",6.3,2.5,5,1.9\n"Iris-virginica",6.5,3,5.2,2\n"Iris-virginica",6.2,3.4,5.4,2.3\n"Iris-virginica",5.9,3,5.1,1.8`

        console.log("csvString", csvString)
        let csvArray = csvString.split("\n").map(row => row.split(","))
        if (csvArray.length < 2) {
            console.log("not enough data, loading fake data")
            csvArray = fakeData1.split("\n").map(row => row.split(","))
        }
        console.log("csvArray", csvArray.length)
        let colsNames = csvArray[0]
        // remove from colNames the " and ' characters
        colsNames = colsNames.map((colName) => {
            return colName.replace(/['"]+/g, '')
        })
        let colsValues = []
        let dataType = []
        
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

        console.log("colsValues", colsValues, colsNames, dataType)
        updateTablePreview(colsValues, 300)

        //
        // add a style
        //
        const style = document.createElement("style")
        style.innerHTML = plotlyStyle
        document.head.appendChild(style)

        //
        // plotly
        //
        const pl_colorscale=[
            [0.0, '#19d3f3'],
            [0.333, '#19d3f3'],
            [0.333, '#e763fa'],
            [0.666, '#e763fa'],
            [0.666, '#636efa'],
            [1, '#636efa']
        ]                

        const getColorsFromUniqValFirstCol = () => {
            let uniqVals = [...new Set(colsValues[0])]
            const uniqValsPercDic = {}
            uniqVals.forEach((val, index) => {
                uniqValsPercDic[val] = index / uniqVals.length
            })

            // disable if uniqVals.length > 100
            if (uniqVals.length > 100) return console.log("getColorsFromUniqValFirstCol: disabling, too many unique values", uniqVals.length)

            // colors is size of colsValues[0] where value is the percentage of the unique value
            const colors = colsValues[0].map((val) => {
                return uniqValsPercDic[val]
            })

            const firstColColorDic = {}
            colsValues[0].forEach((val, index) => {
                if (!firstColColorDic[val]) {
                    firstColColorDic[val] = pl_colorscale[index % pl_colorscale.length][1]
                }
            })
            console.log("getColorsFromUniqValFirstCol => ", {colors, firstColColorDic,  pl_colorscale})
            return colors
        }

    const dataScatterStr = `() => {
    return {
        data: [{
            type: 'scatter',
            x: colsValues[0],
            y: colsValues[1],
            mode: 'markers',
        }],
        layout: {
            dragmode: 'select'
            }
        }
    }`;


    const dataPlotBoxStr = `() => {
    return {
        data: [{
            x: colsValues[0],
            y: colsValues[1],
            type: 'box',
            boxpoints: 'all',
            jitter: 0.3,
            pointpos: -2,
        }],
        layout: {
            dragmode: 'select'
        }
    }`;



    const dataSplomStr = `
    () => {
        var axis = () => ({
            showline:false,
            zeroline:false,
            gridcolor:'#ffff',
            ticklen:4
        })
        let axisLayout = {}
        for (let i = 0; i < colsNames.length; i++) {
            if (i === 0) {
                axisLayout[\`xaxis\`] = axis()
                axisLayout[\`yaxis\`] = axis()
            } else {
                axisLayout[\`xaxis\${i+1}\`] = axis()
                axisLayout[\`yaxis\${i+1}\`] = axis()
            }
        }


        const dimensions = colsValues.map((colData, index) => ({
            label: colsNames[index],
            values: colData,
        }));
        return {
            data: [{
                type: 'splom',
                dimensions,
                marker: {
                    color: getColorsFromUniqValFirstCol(),
                    colorscale:pl_colorscale,
                    size: 7,
                    line: {
                        color: 'white',
                        width: 0.5
                    }
                }   
            }],
            layout: {
                dragmode: 'select',
                ...axisLayout
                }
            }
    }`;
        

        // generate buttons for each plot type
        const plotTypes = ["scatter", "box", "splom", "custom"]
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
            
        const onDataPlotSelect = (myPlot, cb) => {
            myPlot.on('plotly_selected', (eventData) => {
                if (eventData) {
                    // console.log(eventData.points);
                    const points = eventData.points
                    const pointsArr = []
                    points.forEach((point) => {
                        // for each colName
                        const pointDic = {}
                        let index = 0
                        colsNames.forEach((colName) => {
                            let val = point[`dimensions[${index}].values`]
                            pointDic[colName] = val
                            index++
                        })
                        pointsArr.push(pointDic)
                    })
                    cb(pointsArr)
                }
            });
        }

            

        const loadPlot = (plotType) => {
            let configStr = ""
            if (plotType === "scatter") configStr = dataScatterStr
            if (plotType === "box") configStr = dataPlotBoxStr
            if (plotType === "custom")  configStr = document.querySelector("textarea").value
            if (plotType === "splom") configStr = dataSplomStr
            // clean plot 
            Plotly.purge('plotly')
            const resEval = eval(configStr)()
            if (resEval.data && resEval.layout) {
                Plotly.plot('plotly', resEval.data, resEval.layout).then(() => {
                    const myPlot = document.getElementById('plotly')
                    onDataPlotSelect(myPlot, points => {
                        updateTablePreview(points, 200)
                    })
                });
                
            }
            // replace textarea value with the current plotly data
            document.querySelector("textarea").value = configStr
        }
            
        loadPlot("splom")
    }

    const mainCtagLogicPlotly = (csvString) => {
        window.disableCache=false;
            
        api.utils.loadRessources(
            [
                "https://cdn.plot.ly/plotly-latest.min.js",
            ],
            () => {
                logicInt(csvString)
            }
        );
    }

    const contentCtagPlotly = `
        const csvString = \`${csvStringExt}\`;
        const logicInt = ${logicInt.toString()};
        const fn = ${mainCtagLogicPlotly.toString()};
        fn(csvString);
       
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