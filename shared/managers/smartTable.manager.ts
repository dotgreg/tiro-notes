
// tableRawString > 
// #invest| __header_support| __header_name | __header_buy_date | __header_buy_rate | __header_buy_price |  __header_url   |  __header_auto_update_date |  __header_auto_gain_net |  __header_auto_perf_per_year |  __header_auto_update_date
// #invest |livret | livret_ldd| 24/05/2023 |   | 12000
//  | livret_ldd |    
// #invest|cto |  MSCI World ETF ETORO | 25/05/2023 | 74 | 983 | https://www.boursorama.com/bourse/trackers/cours/1rAIWDA/   

export type iSmartTable = {
    id: string
    rows: {[key: string]: any}[],
}
export const getSmartTableFromRawString = (tableRawString: string): iSmartTable => {
    // first split by line
    const lines = tableRawString.split("\n")
    // split by | and trim spaces
    const rawRows = lines.map(line => line.split("|").map(cell => cell.trim()))

    // get id >> first # of first row, we remove the #, if no # return error
    let id = ""


    



}