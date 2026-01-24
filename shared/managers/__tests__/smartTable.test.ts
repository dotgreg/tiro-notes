// impor
import { getSmartTableFromRawString } from '../smartTable.manager';


describe('getSmartTableFromRawString', () => {
    it('should parse a smart table raw string correctly', () => {
        const tableRawString = `#invest| __header_support| __header_name | __header_buy_date | __header_buy_rate | __header_buy_price |  __header_url   |  __header_auto_update_date |  __header_auto_gain_net |  __header_auto_perf_per_year |  __header_auto_update_date
#invest |livret | livret_ldd| 24/05/2023 |   | 12000
 | livret_ldd |    
#invest|cto |  MSCI World ETF ETORO | 25/05/2023 | 74 | 983 | https://www.boursorama.com/bourse/trackers/cours/1rAIWDA/   `;

        const result = getSmartTableFromRawString(tableRawString);
    });
});