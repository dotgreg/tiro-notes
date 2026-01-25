
// tableRawString > 
// #invest| __header_support| __header_name | __header_buy_date | __header_buy_rate | __header_buy_price |  __header_url   |  __header_auto_update_date |  __header_auto_gain_net |  __header_auto_perf_per_year |  __header_auto_update_date
// #invest |livret | livret_ldd| 24/05/2023 |   | 12000
//  | livret_ldd |    
// #invest|cto |  MSCI World ETF ETORO | 25/05/2023 | 74 | 983 | https://www.boursorama.com/bourse/trackers/cours/1rAIWDA/   

export type iSmartTableRow = {
    row_id: number
    line: string
    cells: {[key: string]: any}
}
export type iSmartTable = {
    id: string
    rows: iSmartTableRow[],
    config: {[key: string]: any}
    cols:{[header:string]:number},
}

// from string, get obj
export const getSmartTableObj = (tableRawString:string): iSmartTable | undefined => {
    // first split by line
    const lines = tableRawString.split("\n")
    // remove empty lines, or lines without # or | in it
    const filteredLines = lines.filter(line => line.trim() !== "" && (line.includes("#") || line.includes("|")))
    // split by | and trim spaces
    const rawRows = filteredLines.map(line => {
        return line.split("|").map(cell => cell.trim())
    })

    // get id >> first # of first row, we remove the #, if no # return error
    let id = ""
    if (rawRows[0][0].startsWith("#")) {
        id = rawRows[0][0].substring(1)
    } else {
        console.error("Invalid table format: no # id found")
        return undefined
    }

    const isThereHeaders = rawRows.some(row => row.some(cell => cell.includes("__header_")))
    // get headers line, can be anywhere
    const headers: string[]|undefined = isThereHeaders ? rawRows.find(row => row.some(cell => cell.includes("__header_"))) : []
    // remove __header_ from headers
    const cleanedHeaders = headers?.map(header => header.replace(/^__header_/, ""))
    // remove the first row (#id)
    cleanedHeaders?.shift()

    const cols: {[header:string]:number} = {}
    // should not contain __header_ or __config
    const firstRow = rawRows.find(row => row[0] === `#${id}` && !row.some(cell => cell.includes("__header_") || cell.includes("__config_")))
    const numberColsFirstRow = firstRow ? firstRow.length - 1 : 0
    // if cleandedHeader length = 0, replace all cols name by col1,2,3 etc.., take the nb from first row
    if (cleanedHeaders && cleanedHeaders.length < numberColsFirstRow) {
        if (firstRow) {
            let start = cleanedHeaders.length + 1
            for (let i = start; i < firstRow.length; i++) {
                cleanedHeaders.push(`col${i}`)
            }
        }
    }

    cleanedHeaders?.forEach((header, index) => {
        cols[header] = index
    })

    let res:iSmartTable = {
        id,
        rows: [],
        config:  {},
        cols
    }

    // get rows
    let rowId = 0
    for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i]
        const line = filteredLines[i]
        // only keep rows with the correct id
        if (row[0] !== `#${id}`) continue // skip rows with different id

        //
        //
        // PROCESSING __CONFIG_
        //
        //
        // if the line contains __config_ in it, update the config, __config_KEY_
        if (row.some(cell => cell.includes("__config_"))) {
            // for each cell of that row
            row.map(cell => {
                // if __config_view_XXX
                if (cell.startsWith("__config_view_")) {
                    const configValue = cell.split("__config_view_")[1]
                    res.config.view = configValue ? configValue.trim().replace(/^"|"$/g, "") : ""
                // if __config_add_form="XXX"
                } else if (cell.startsWith("__config_add_form=")) {
                    const configValue = cell.split("=")[1]
                    res.config.form = configValue ? configValue.trim().replace(/^"|"$/g, "") : ""
                // if __config_hidecol_XXXXX
                } else if (cell.startsWith("__config_hidecol_")) {
                    let configKey = cell.split("=")[0].replace("__config_", "")
                    res.config[configKey as keyof iSmartTable["config"]] = true
                // else, just take __CONFIG_KEY = true
                } else if (cell.startsWith("__config_")) {
                    let configKey = cell.split("=")[0].replace("__config_", "")
                    // remove __config_ from key
                    res.config[configKey as keyof iSmartTable["config"]] = true
                }
            })
            // remove it from nb
            continue
        }

        // remove headers line
        let rowData = {
            cells: {},
            row_id: rowId,
            line: line
        }
        if (row.some(cell => cell.includes("__header_"))) continue
        if (cleanedHeaders) {
            for (let j = 0; j < cleanedHeaders.length; j++) {
                rowData.cells[cleanedHeaders[j]] = row[j + 1]
            }
        }         
        rowId++
        res.rows.push(rowData)
    }

    return res


}



// updateSmartTable > from string to string?
export type iSmartTableUpdate = {
    // by default it is row_id 
    rowId: string,
    rowIdValue: string | number,
    updatedRow: string,
    updatedRowValue: any
}
// I want a function that locate all occurences where row 
export const updateSmartTable = (tableRawString:string, update:iSmartTableUpdate ): string => {
    // get the tableObj
    let tableObj = getSmartTableObj(tableRawString);
    // get all the rowId rows with the matching rowIdValue
    // console.log(tableObj)
    let matchingRows = tableObj.rows.filter(row => row[update.rowId] === update.rowIdValue);
    // update the matching rows
    let linesToUpdate:{old:string,new:string}[] = []
    matchingRows.forEach(row => {
        row.cells[update.updatedRow] = update.updatedRowValue;
        let oldLine = row.line
        // new line = each param obj with #id | p1 | p2 etc...
        let newLine = `#${tableObj.id} | `;
        for (let i = 0; i < Object.keys(tableObj.cols).length; i++) {
            let propName = Object.keys(tableObj.cols)[i];
            newLine += `${row.cells[propName]} | `;
        }
        linesToUpdate.push({old:oldLine,new:newLine});
    });

    // for each line, replace
    let stringUpdated = tableRawString;
    for (let i = 0; i < linesToUpdate.length; i++) {
        stringUpdated = stringUpdated.replace(linesToUpdate[i].old, linesToUpdate[i].new);
    }
    // convert the tableObj back to a string

    return stringUpdated
}