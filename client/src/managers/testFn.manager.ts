import {getSmartTable} from "../../../shared/managers/smartTable.manager";

export const testFn = () => {
    // let str = `Longtemps l’apanage de partis conservateurs, ces postures de fermeté se radicalisent et s’étendent à une large part du spectre politique. Les médias les relaient et les amplifient, car la criminalité et l’immigration confortent les audiences. Toute critique est présentée comme « irresponsable ». Pourtant, les enquêtes de victimation suggèrent une stabilité, voire une baisse, de nombreuses formes de délinquance, à quelques exceptions près, très localisées (1). Des conclusions qui infirment l’idée d’un « processus de décivilisation », évoquée par M. Emmanuel Macron en conseil des ministres le 24 mai 2023. Mais qu’importe. Cette rhétorique efface plusieurs siècles de philosophie libérale de l’État insistant sur l’équilibre nécessaire entre la liberté et la sécurité, au profit d’un slogan, sans doute forgé par un cabinet de conseil en communication politique : « La sécurité est la première des libertés ».`
    // let textToSentSimple =  transformString(str, {accents:true, specialChars:false, escapeChars:true})

    // console.log("TEST", 123, textToSentSimple)
        const tableRawString = `
#invest| __header_support| __header_name | __header_buy_date | __header_buy_rate | __header_buy_price |  __header_url   |  __header_auto_update_date |  __header_auto_gain_net |  __header_auto_perf_per_year |  __header_auto_update_date
#invest |livret | livret_ldd| 24/05/1999 |   | 1111 | livret_ldd |    
hello world
#invest|cto |  MSCI World ETF ETORO | 25/05/2008 | 74 | 983 | https://www.boursorama.com/bourse/trackers/cours/1rAIWDA/   
hello | world woop
#invest |livret | livret_ldd| 24/05/1999 |   | 2345 | livret_ldd |    
#invest2 |livret | livret_ldd| 24/05/1999 |   | 12033 | livret_ldd |    
\|#invest |livret | livret_ldd| 24/05/1999 |   | 12033 | livret_ldd |    
||#invest2 |livret | livret_ldd| 24/05/1999 |   | 12033 | livret_ldd |    `;
        let smart = getSmartTable(tableRawString);
    console.log("SMART TABLE DATA:", smart);
}
