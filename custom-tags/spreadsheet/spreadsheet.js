const spreadSheetApp = (innerTagStr, opts) => {
		if (!opts) opts = {}

		const h = `[CTAG SPREADSHEET] 04111 v1.0`
		const api = window.api;
		const { div, updateContent } = api.utils.createDiv();
		const classId = `spreadsheet-${api.utils.uuid()}`;

		console.log(h, "========= INIT with opts:", opts)

		//
		// CHUNK INNERTAG ARRAY
		//

		const innertag = innerTagStr
		// const innertag = `
		//     hello|world|woop|wooop
		//     -|-|-|-
		//     11|12|13|=SUM(A1:C1)
		//     21|22|23|=SUM(A2:C2)
		//     31|32|33|=SUM(A1:C3)
		//     `;

		const tableMdToArray = (str) => {
				const arr1 = str.split("\n");
				const arr3 = [];
				for (let i = 0; i < arr1.length; i++) {
						const arr2 = arr1[i].split("|");
						if (arr2.length === 1 && arr2[0] === "") continue;
						for (let y = 0; y < arr2.length; y++) {
								arr2[y] = arr2[y].trim();
						}
						arr3.push(arr2);
				}
				const headArr = arr3[0];
				const bodyArr = arr3.slice(2);
				return { headArr, bodyArr };
		};

		//
		// CALC & RENDER ARRAY HTML
		//

		const renderTable = (bodyArr, headArr) => {
				const hf = window.HyperFormula.buildEmpty({
						precisionRounding: 10,
						licenseKey: "gpl-v3"
				});

				// Add a new sheet and get its id.
				const sheetName = hf.addSheet("main");
				const sheetId = hf.getSheetId(sheetName);

				// Fill the HyperFormula sheet with data.
				hf.setCellContents(
						{
								row: 0,
								col: 0,
								sheet: sheetId
						},
						bodyArr
				);

				const { height, width } = hf.getSheetDimensions(sheetId);
				let newTheadHTML = "";
				let newTbodyHTML = "";

				for (let row = -1; row < height; row++) {
						for (let col = 0; col < width; col++) {
								if (row === -1) {
										newTheadHTML += `<th><span>${headArr[col]}</span></th>`;
										continue;
								}

								const cellAddress = { sheet: sheetId, col, row };
								const cellHasFormula = hf.doesCellHaveFormula(cellAddress);
								let cellValue = "";

								if (!hf.isCellEmpty(cellAddress) && !cellHasFormula) {
										cellValue = hf.getCellValue(cellAddress);
								} else {
										cellValue = hf.getCellValue(cellAddress);
								}

								newTbodyHTML += `<td><span>
        ${cellValue}
        </span></td>`;
						}

						newTbodyHTML += "</tr>";
				}

				const head = newTheadHTML;
				const body = newTbodyHTML;
				const htmlRes = `
    <table>
        <thead>${head}</thead>
        <tbody>${body}</tbody>
    </table>
    `;
				return htmlRes;
		};

		api.utils.loadScripts(
				["https://cdn.jsdelivr.net/npm/hyperformula/dist/hyperformula.full.min.js"],
				() => {
						const { headArr, bodyArr } = tableMdToArray(innertag);
						const renderedRes = `${renderTable(bodyArr, headArr)}`;
						updateContent(`
    <div class="${classId}"> 
        ${renderedRes}
    </div>
    <style>
        ${styleTable}
    </style>
    `);
						setTimeout(() => {
								api.utils.resizeIframe();
						}, 100);
				}
		);

		const styleTable = `
body {
  font-family: sans-serif;
  counter-reset: row-counter col-counter;
}2  

.example button.run {
  background-color: #1c49e4;
  border-color: #1c49e4;
  margin-bottom: 20px;
}

.example button.run:hover {
  background-color: #2350ea;
}

table tbody tr td:first-child {
  text-align: left;
  padding: 0;
}

table {
  table-layout: fixed;
}

table tbody tr td,
table tbody tr th {
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
}

table thead tr th:first-child {
  padding-left: 40px;
}

table tbody tr td:first-child span {
  width: 100%;
  display: inline-block;
  text-align: left;
  padding-left: 15px;
  margin-left: 0;
}

table tbody tr td:first-child span::before {
  counter-increment: row-counter;
  content: "("counter(row-counter)")";
  display: inline-block;
  width: 20px;
  position: relative;
  left: -10px;
  font-size: 10px;
  font-weight: bold;
  color: #b1b1b1;
}

table thead tr th span::before {
  counter-increment: col-counter;
  content:  "("counter(col-counter, upper-alpha)")";
  display: inline-block;
  width: 15px;
  font-size: 8px;
  font-weight: bold;
  color:#b1b1b1;
}

#address-preview {
  font-weight: bold;
}

div.result {
  display: inline-block;
  margin: 0 0 0 15px;
}

p.data-label {
  margin: 0;
}

`;

		return div
}

window.initCustomTag = spreadSheetApp
