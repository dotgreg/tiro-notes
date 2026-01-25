// impor
import { getSmartTableObj, updateSmartTable } from '../smartTable.manager';


const headers = `
#invest| __header_support| __header_name | __header_buy_date | __header_buy_rate | __header_buy_price |  __header_url   |  __header_auto_update_date |  __header_auto_gain_net |  __header_auto_perf_per_year |  __header_auto_update_date
`
const partialHeaders = `
#invest| __header_support| __header_name 
`
const tableRawString = `
#invest |livret | livret_ldd| 24/05/1999 |   | 1111 | livret_ldd |    
hello world
#invest|cto |  MSCI World ETF ETORO | 25/05/2008 | 74 | 983 | https://www.boursorama.com/bourse/trackers/cours/1rAIWDA/   
hello | world woop
#invest |livret | livret_ldd| 24/05/1999 |   | 2345 | livret_ldd |    
#invest2 |livret | livret_ldd| 24/05/1999 |   | 12033 | livret_ldd |    
\|#invest |livret | livret_ldd| 24/05/1999 |   | 12033 | livret_ldd |    
||#invest2 |livret | livret_ldd| 24/05/1999 |   | 12033 | livret_ldd |    `;

const tableWithConfig = tableRawString + `\n
#invest2 | __config_view_grid | __config_add_form="form2" 
#invest | __config_view_grid | __config_add_form="form1" 
#invest2 | __config_view_grid | __config_add_form="form2" 
#invest | __config_hidecol_name | __config_show_meta | __config_hide_config_rows | __config_split_on_comma | __config_disable_click
`

const tableWithHeaders = headers + tableRawString;
const tableWithoutHeaders = tableRawString;
const tableWithPartialHeaders = partialHeaders + tableRawString;

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
        expect(result.rows[0].line).toBe('#invest |livret | livret_ldd| 24/05/1999 |   | 1111 | livret_ldd |    ');
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

// <h3> More options </h3>
// <p>You can display elements either as a table (default) or as an image gallery, you will need to add __config_view_grid for that.
// <br> You will need to have 2 columns named respectively "name" and "image" to display the grid view.
// <br> You can sort the grid view by category by adding a column named "category" in your table
// <br> The image col can either be a http link to a jpg/png or a relative image link if the image was uploaded on Tiro like /.ressources/your_image.jpg
// <p>"__config_add_form=" add item button: you can add a "+" button that will add a form to insert a new line using __config_add_form=form_name where form_name is the name of your form from /.tiro/forms.md. please refer to tiro notes general help (? button) to create forms <br>
// <p>"__config_hidecol_namecol"  removing a column: you can remove one col by adding the word <br>
// <p>"__config_show_meta":  showing default cols: you can add the meta columns by adding the word <br>
// <p>"__config_hide_config_rows": removing config rows: by adding the word <br>
// <p>"__config_split_on_comma": [not implemented yet] split on comma: if a cell has several values like "cat1, cat2, cat3" it will be splitted in separated rows <br>
// <p>"__config_disable_click": disable the default click event, useful for grid view
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
});

describe('updateSmartTable', () => {
    it("should update content right", () => {
        const result = updateSmartTable(tableWithPartialHeaders, {
            rowId: "row_id",
            rowIdValue: 0,
            updatedRow: "name",
            updatedRowValue: "New Name"
        });
        expect(result).toContain("#invest | livret | New Name | 24/05/1999 |  | 1111 | livret_ldd |  |");
    });

});
