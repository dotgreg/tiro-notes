// impor
import { getSmartTableObj, updateSmartTableString } from '../smartTable.manager';


const headers = `
#invest| __header_support| __header_name | __header_buy_date | __header_buy_rate | __header_buy_price |  __header_url   |  __header_auto_update_date |  __header_auto_gain_net |  __header_auto_perf_per_year |  __header_auto_update_date
`
const partialHeaders = `
#invest| __header_support| __header_name 
`
const tableRawString = `
# table starts here | dffasdfdas
## second title
#invest |livret1 | livret_ldd| 24/05/1999 |   | 1111 | livret_ldd |    
hello world
#invest|cto |  MSCI World ETF ETORO | 25/05/2008 | 74 | 983 | https://www.boursorama.com/bourse/trackers/cours/1rAIWDA/   
hello | world woop
#invest |livret2 | livret_ldd| 24/05/1999 |   | 2345 | livret_ldd |    
#invest2 |livret | livret_ldd| 24/05/1999 |   | 12033 | livret_ldd |    
\|#invest |livret | livret_ldd| 24/05/1999 |   | 12033 | livret_ldd |    
||#invest2 |livret | livret_ldd| 24/05/1999 |   | 12033 | livret_ldd |    `;

const tableRawString2 = tableRawString + `
#invest |livret2 | 
`
const bugColsAddedIncrem = `
#invest | livret_ldd_30 | fixed | livret_ldd | 25/05/1993 | 0.03 | 444 
## config
#invest| __config_hide_config_rows | __config_hidecol_url | __config_hidecol_col17 | __config_edit_mode
#invest| __header_support| __header_type |__header_name | __header_buy_date | __header_buy_rate | __header_buy_value |  __header_url   | __header_sold_date | __header_sold_rate |  __header__date |  __header__current_rate |  __header__current_value |  __header__gain_net | __header__gain_per_year |  __header__log   

`

const tableStartingWithText = `
afldskjfadlksjjflsdka
afldskjfdsalkjofdsafsda
afldskjfdsalkjofdsafsda
afldskjfdsalkjofdsafsda
afldskjfdsalkjofdsafsda
afldskjfdsalkjofdsafsda
afldskjfdsalkjofdsafsda
afldskjfdsalkjofdsafsda
` + tableRawString

const tableStartingWithOtherId = `
flasdkjfsdlakjfdsalkj
fadsljfdsalkjfdsjlakfdjslka

#investotherid |livret3 | livret_ld| 24/05/1998 |   | 2020 | livret_ldd |    
hello world
` + tableRawString

const tableWithConfig = tableRawString + `\n
#invest2 | __config_view_grid | __config_add_form="form2" 
#invest | __config_view_grid | __config_add_form="form1" 
#invest2 | __config_view_grid | __config_add_form="form2" 
#invest | __config_hidecol_name | __config_show_meta | __config_hide_config_rows | __config_split_on_comma | __config_disable_click
`

const tableWithHeaders = headers + tableRawString;
const tableWithoutHeaders = tableRawString;
const tableWithPartialHeaders = partialHeaders + tableRawString;
const table2WithPartialHeaders = partialHeaders + tableRawString2;

describe('getSmartTableObj > increm cols bug', () => {
    let u = {
            cellId: "row_id",
            cellIdValue: 0,
            updatedCell: "name",
            updatedCellValue: "__UPDATED CONTENT1__"
        }
    let result1 = updateSmartTableString(bugColsAddedIncrem, u);
    let result2 = updateSmartTableString(result1.stringUpdated, u);
    result2 = updateSmartTableString(result2.stringUpdated, u);
    result2 = updateSmartTableString(result2.stringUpdated, u);
    result2 = updateSmartTableString(result2.stringUpdated, u);
    expect(result1.stringUpdated).toBe(result2.stringUpdated);
})

describe('getSmartTableObj', () => {


    it('id should be recognized', () => {
        const result = getSmartTableObj(tableRawString);
        expect(result.id).toBe('invest');
    });

    it('WITH HEADER: check the object syntax and structure', () => {
        const result = getSmartTableObj(tableWithHeaders);
        expect(result.rows.length).toBe(3);
        expect(result.rows[0].row_id).toBe(0);
        expect(result.rows[0].cells.name).toBe('livret_ldd');
        expect(result.rows[1].cells.name).toBe('MSCI World ETF ETORO');
        expect(result.rows[2].cells.name).toBe('livret_ldd');
        expect(result.rows[0].line).toBe('#invest |livret1 | livret_ldd| 24/05/1999 |   | 1111 | livret_ldd |    ');
        expect(result.cols["buy_date"]).toBe(2);
        expect(result.rows[2].row_id).toBe(2);
        // expect(1).toBe(2);
    });

    it('WITHOUT HEADER: check the object syntax and structure', () => {
        const result = getSmartTableObj(tableWithoutHeaders);
        // console.log(result)
        expect(result.cols["col3"]).toBe(2);
        expect(Object.keys(result.cols).length).toBe(7);
    });
    it('PARTIAL HEADER: check the object syntax and structure', () => {
        const result = getSmartTableObj(tableWithPartialHeaders);
        expect(result.cols["col3"]).toBe(2);
        expect(result.rows[1].cells.name).toBe("MSCI World ETF ETORO");
        expect(result.rows[1].cells.col3).toBe("25/05/2008");
        expect(Object.keys(result.cols).length).toBe(7);
    });
    it('should return the right amount of rows as well as the config options in result.config', () => {
        const result = getSmartTableObj(tableWithConfig);
        // console.log(JSON.stringify(result.config));
        expect(result.rows.length).toBe(3);
        expect(result.config.form).toBe("form1");
        expect(result.config["#invest"]).toBeUndefined();
        expect(result.config.view).toBe("grid");
        expect(result.config.hidecol_name).toBe(true);
        expect(result.config.show_meta).toBe(true);
        expect(result.config.hide_config_rows).toBe(true);
        expect(result.config.split_on_comma).toBe(true);
        expect(result.config.disable_click).toBe(true);

        // expect(1).toBe(2);
    });
    it('argument tableId is set, in raw note starting with another id, should find the right id', () => {
        const result = getSmartTableObj(tableStartingWithOtherId, "invest");
        expect(result.rows.length).toBe(3);
        expect(result.id).toBe("invest");
    });
    it('if raw note content provided, should find the right first id (2)', () => {
        const result = getSmartTableObj(tableStartingWithOtherId);
        expect(result.rows.length).toBe(1);
        expect(result.id).toBe("investotherid");
    });
    it('if raw note content provided, should find the right first id', () => {
        const result = getSmartTableObj(tableStartingWithText);
        expect(result.rows.length).toBe(3);
        expect(result.id).toBe("invest");
    });
});

describe('updateSmartTableString', () => {
    it("should update content right", () => {
        const result = updateSmartTableString(tableWithPartialHeaders, {
            cellId: "row_id",
            cellIdValue: 0,
            updatedCell: "name",
            updatedCellValue: "__UPDATED CONTENT1__"
        });
        expect(result.stringUpdated).toContain("#invest | livret1 | __UPDATED CONTENT1__ | 24/05/1999 |  | 1111 | livret_ldd |  |");
    });

    it("should create content if nothing in cell", () => {
        const result = updateSmartTableString(tableWithPartialHeaders, {
            cellId: "row_id",
            cellIdValue: 0,
            updatedCell: "col7",
            updatedCellValue: "__UPDATED CONTENT2__"
        });
        expect(result.stringUpdated).toContain("#invest | livret1 | livret_ldd | 24/05/1999 |  | 1111 | livret_ldd | __UPDATED CONTENT2__");
    });

    it("should update all rows with the selected cellId", () => {
        // console.log(getSmartTableObj(tableWithPartialHeaders)["rows"])
        const result = updateSmartTableString(tableWithPartialHeaders, {
            cellId: "col6",
            cellIdValue: "livret_ldd",
            updatedCell: "col7",
            updatedCellValue: "__UPDATED CONTENT3__"
        });
        // console.log(result);
        let doesResContainsTwoTimes = (result.stringUpdated.match(/__UPDATED CONTENT3__/g) || []).length;
        expect(doesResContainsTwoTimes).toBe(2);
        // expect(result).toContain("#invest | livret1 | New Name | 24/05/1999 |  | 1111 | livret_ldd | __UPDATED CONTENT3__ |");
    });
});

describe('current', () => {
    it("should update all rows with the selected cellId", () => {
        // console.log(getSmartTableObj(table2WithPartialHeaders)["rows"])
        const result = updateSmartTableString(table2WithPartialHeaders, {
            cellId: "row_id",
            cellIdValue: 3,
            updatedCell: "col7",
            updatedCellValue: "__UPDATED CONTENT4__"
        });
        // console.log(result);
        expect(result.stringUpdated).toContain("#invest | livret2 |  |  |  |  |  | __UPDATED CONTENT4__");
    });
});
