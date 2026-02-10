// assuming react is already loaded in window
// assuming     <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> is loaded in html


const styleCss = `
#ctag-component-table-wrapper {
  padding: 5px 10px 10px 10px;
}

table {
  width: 100%;
}
table th .header_details {
  display:none;
}
table .canvas_hist {
  display: block;
  width: 90%;
  height: 100px;
}
table th:hover .header_details {
  padding: 4px;
  z-index: 1000;
  display: block;
  font-size: 9px;
  color: grey;
  position: fixed;
  top: 10px;
  right: 10px;
  width: 200px;
  background: rgba(255,255,255,0.9);
  border: 1px solid #ccc;
  border-radius: 4px;
  // box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  pointer-events: none;
  line-height:1.2;
}
table thead {
  cursor:pointer;
}
table tbody {}
table tr:nth-child(even) {background: #CCC}
table tr:nth-child(odd) {background: #EEE}
table tr td { 
  word-break: break-all; 
  border:none; 
  padding: 1px 11px;
}
.input-content {
  background: none;
  border: none;
  color: #525252;
  width: 100%;
  font-weight: normal;
}

.table-controls-wrapper {
}
.table-controls-wrapper button {
  margin-right: 5px;
}
.table-controls-wrapper input {
  margin-right: 10px;
  background-color: #fff;
  border: none;
  box-shadow: 0 0 0 1px #ccc;
  border-radius: 3px;
  padding: 4px;
  width: 100px;
  margin-top: 8px;
}


.ctag-component-table {
  padding-bottom: 80px;
  overflow-wrap: normal;
  width: 100%;
  height: 100%;
  padding: 10px;
}
table.ctag-component-table  td, 
table.ctag-component-table  th { 
  overflow-wrap: anywhere; 
  min-width: 50px;
}
.ctag-component-table th {
  // display: flex;
}
.ctag-component-table th .sortIndic {
  margin-left: 5px;
  position: absolute;
}
.ctag-component-table td {
  padding: 1px 5px;
  // word-break: break-all;
}
.ctag-component-table .table-link-click {
  cursor: pointer;
}

.ctag-component-table-grid-view {
}
.ctag-component-table-grid-view .flex-grid{
  padding-top: 20px;
  padding-bottom: 80px;
  display: flex;
  justify-content: center;
  flex-direction: row;
  flex-wrap: wrap;
}
.grid-category-title{
  color: white;
    font-weight: bold;
    padding: 10px;
    opacity: 0.6;
    font-size: 20px;
}
.ctag-component-table-grid-view .grid-item {
  width: 18vw;
  height: 18vw;
  max-width: 180px;
  max-height: 180px;
  min-width: 115px;
  min-height: 115px;
  margin: 3px;
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  border-radius: 7px;
  box-shadow: 0px 0px 4px rgba(0,0,0,0.1);
  position: relative;
}
.ctag-component-table-grid-view .grid-item-image {
  cursor: pointer;
  width: 100%;
  height: 100%;
}
.ctag-component-table-grid-view .grid-item-image-html {
  width: 100%;
  height: 100%;
}
.ctag-component-table-grid-view .grid-item-image i {
  font-size: 9vw;
  color: #ccc;
  display: flex;
  
  justify-content: center;
  align-items: center;
  padding-top: 30px;
}
.ctag-component-table-grid-view .grid-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ctag-component-table-grid-view .grid-item .grid-item-name {
  width: 100%;
}
.ctag-component-table-grid-view .grid-item .grid-item-name.hide-label {
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}
.ctag-component-table-grid-view .grid-item:hover .grid-item-name {
  opacity: 1;
}

.ctag-component-table-grid-view .grid-item-name-text {
  text-align: center;
  position: absolute;
  line-height: 13px;
  bottom: 0;
  background-color: rgba(255,255,255,0.8);
  padding: 6px;
  width: calc(100% - 12px);
}


.col-buttons  {
  display: flex;
  align-items: center;
}
.col-buttons .fa-filter.active {
  color: blue;
}
.col-buttons .fa-filter {
  color: #ccc;
}
.col-buttons .fa-eye {
  color: #ccc;
}
.col-buttons .table-link-click {
  margin-right: 5px;
}

.compressed.cell-content {
  height: 20px;
  overflow: hidden;
}

.select-multiple-filter {
  min-height: 30vh;
}

`

const helpStrTable = `
<h3>SmartTable component</h3>
<p>This is the SmartTable component, it allows you to view and search data from your notes

<h3> Creating custom cols </h3>
<p> If you search #food for instance, it will return you all the lines where <code>#food</code> appears<br>
If you have "|" in that line, it will tell the SmartTable to split it into different columns <br> 
So the line <code>#food | apple | 1$ </code> will appear in three columns</p>

<h3>Creating custom column header</h3>
<p> if a column content is a word starting by "__header_" it will rename the SmartTable header <br>
<code>#food | __header_name | __header_price</code> will rename col2 into "name" and col3 into "price"<br>
<br> 
Full example: (to copy and paste in a note, then click on #food)
<code>
<pre>
#food | __header_name | header_price
#food | apple | 1
#food | banana | 2
#food | orange | 3
</pre>
</code>

<h3>Creating a smartlist custom tag in a note</h3>
<p> You can create a custom tag smarttable searching for the string "#food" in the folder "/root/groceries" with the following code:<br>	
<code>
<pre>
[[smartlist]]
#food | /root/groceries
[[smartlist]]
</pre>
</code>

<h3> View </h3>
<p>You can display elements either as a table (default) or as an image gallery, you will need to add __config_view_grid for that.
<br> You will need to have 2 columns named respectively "name" and "image" to display the grid view.
<br> You can sort the grid view by category by adding a column named "category" in your table
<br> The image col can either be a http link to a jpg/png or a relative image link if the image was uploaded on Tiro like /.ressources/your_image.jpg



<h3> More options </h3>
<p>"__config_no_edit_mode":  disabling edit mode for each cell, it will not auto update the underlying files<br>
<p>"__config_add_form=" add item button: you can add a "+" button that will add a form to insert a new line using __config_add_form=form_name where form_name is the name of your form from /.tiro/forms.md. please refer to tiro notes general help (? button) to create forms <br>
<p>"__config_hidecol_namecol"  removing a column: you can remove one col by adding the word <br>
<p>"__config_show_meta":  showing default cols: you can add the meta columns by adding the word <br>
<p>"__config_hide_config_rows": removing config rows: by adding the word <br>
<p>"__config_split_on_comma": [not implemented yet] split on comma: if a cell has several values like "cat1, cat2, cat3" it will be splitted in separated rows <br>
<p>"__config_disable_click": disable the default click event, useful for grid view

<h3> timeline visualization </h3>
<p> to have the timeline visualization working, it requires a col with dates in the cols for the smartlist

<h3> Custom cell content: </h3>
<p>you can customize a cell content, here are some examples
<br>
<code>
<pre>
- #food | __config_formula_image2 =  < div style="width:40px; color: red" >\${sum_image/count_image} and row_image < / div >
// for reducing the size of a col with http links
 #appart2025| __config_formula_col7 =  <div style="width:20px; color: red"><a  target="_blank" href="row_col7">link</a></div>
</pre>
</code>
<br> 
<br> 

<br><b>Available fields</b> : 
<br>- sum_COLNAME: sum of the column COLNAME (if col rows are numbers)
<br>- count_COLNAME: count of the column COLNAME
<br>- row_COLNAME: value of the column COLNAME of the current row
<br> 
<br> 
<br> <b>Custom functions</b> : 
<br> It is also possible to call custom user functions. These functions should be in the file /.tiro/user_functions.md like

<code>
<pre>
/.tiro/user_functions.md
--------------------

const addition = (a, b) => {
  return a + b
}
                                        console.log(line)

// look for an image on bing image from a string
const searchImage = (stringToSearch, cb) => {
    function extractImageUrls(htmlString) {
        htmlString = htmlString.replaceAll("&quot;", " ");
        const regex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|htm|html|php))/gi;
        let res = htmlString.match(regex) || []
        // only keep when ends with jpg, jpeg, png
        res = res.filter(url => url.endsWith('jpg') || url.endsWith('jpeg') || url.endsWith('png'))
        return res;
    }
  
    let url = "https://www.bing.com/images/search?q="+stringToSearch+"&first=1"
    api.call("ressource.fetch", [url], html => {
        let images = extractImageUrls(html)
        cb(images)
    })
    return ""
}


</pre>
</code>

<code>
<pre>
- #food | __config_formula_sum = < div style="width: 300px" > \${addition(row_price1, row_price2)\}   < / div >

- #food | __config_formula_image = \${searchImage("row_name", images => {   cb(\`< img width="40px" src="\${images[row_image]}" / >\`) }  )  } 

</pre>
</code>


</p>

<h3> Example: (to copy and paste in a note, then click on #food)</h3>
<code>
<pre>
#food | __config_hide_meta __config_hide_config_rows
#food | __header_name | __header_price
#food | apple | 1
#food | banana | 2
#food | orange | 3
</pre>
</code>

`


const TableComponentReact = ({ items, config, id }) => {

  
	// const r = window._tiro_react;
  const r = window._tiro_react || React
  const c = r.createElement;
  return c(TableComponentReactInt, { items, config, id })
}

// if grid enabled
  // 

const TableComponentReactInt = ({ items, config, id }) => {
  if (config.id) id = config.id
  if (!id) id = "table-component"
  const r = window._tiro_react || React
  // const r = window._tiro_react;
  const c = r.createElement;

  //
  // localstorage save
  //
  const [sortConfig, setSortConfigInt] = r.useState(null);
  const setSortConfig = (sort) => {
    setSortConfigInt(sort)
    localStorage.setItem(`${id}-sort`, JSON.stringify(sort));
  }
  r.useEffect(() => {
    let sort = JSON.parse(localStorage.getItem(`${id}-sort`));
    if (sort) setSortConfig(sort);
  }, []);

  const [searchTerm, setSearchTermInt] = r.useState("");
  const setSearchTerm = (term) => {
    setSearchTermInt(term)
    // localStorage.setItem(`${id}-searchTerm`, JSON.stringify(term));
  }
  r.useEffect(() => {
    // let term = JSON.parse(localStorage.getItem(`${id}-searchTerm`));
    // if (term) setSearchTermInt(term);
  }, []);
  const [view, setViewInt] = r.useState("table");
  const setView = (term) => {
    setViewInt(term)
    // localStorage.setItem(`${id}-view`, JSON.stringify(term));
  }
  r.useEffect(() => {
  }, [view]);
  r.useEffect(() => {
    // let term = JSON.parse(localStorage.getItem(`${id}-view`));
    // if (term) setViewInt(term);
    if (config?.gridView) setView("grid")
  }, [config?.gridView]);



  //////////////////////////////////////////////////////
  //
  // SORTING MECHANISM
  //
  const sortedItems = r.useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] === null) a[sortConfig.key] = " ";
        if (b[sortConfig.key] === null) b[sortConfig.key] = " ";
        // if a[sortConfig.key] does not exist, return 1
        if (a[sortConfig.key] === undefined) a[sortConfig.key] = " ";
        if (b[sortConfig.key] === undefined) b[sortConfig.key] = " ";
        // if a[sortConfig.key] and b[sortConfig.key] are dates, convert them to date objects and sort them using timestamp
        // count / in a[sortConfig.key], if 2, it is a date
        //
        // DATE SORTING
        //
        if (a[sortConfig.key].split && a[sortConfig.key].split("/").length === 3) {
          // date format is dd/mm/yyyy, convert it to mm/dd/yyyy
          let dateA = a[sortConfig.key].split("/").reverse().join("/");
          let dateB = b[sortConfig.key].split("/").reverse().join("/");
          if (new Date(dateA) < new Date(dateB)) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (new Date(dateA) > new Date(dateB)) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          
        //
        // NUMBER SORTING
        //
        // check if parseFloat is not NaN
        } else if (!isNaN(parseFloat(a[sortConfig.key])) && !isNaN(parseFloat(b[sortConfig.key]))) {
          return sortConfig.direction === 'ascending' ? 
            parseFloat(a[sortConfig.key]) - parseFloat(b[sortConfig.key]) : 
            parseFloat(b[sortConfig.key]) - parseFloat(a[sortConfig.key]);

        //
        // TEXT
        //
        } else {

          if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);


  const [activeFilters, setActiveFiltersInt] = r.useState({});
  const setActiveFilters = (filters) => {
    setActiveFiltersInt(filters)
    localStorage.setItem(`${id}-filters`, JSON.stringify(filters));
  }
  r.useEffect(() => {
    let filters = JSON.parse(localStorage.getItem(`${id}-filters`));
    if (filters) setActiveFiltersInt(filters);
  }, []);

  const filteredItems = r.useMemo(() => {
    return sortedItems.filter(item => {
      let found = false;
      // filter using search 
      let strItem = JSON.stringify(item).toLowerCase()
      found = strItem.includes(searchTerm.toLowerCase())
      // if * included in searchTerm, do a regex filter
      if (searchTerm.includes("*")) {
        found = strItem.match(new RegExp(searchTerm.toLowerCase().replace(/\*/g, ".*"))) != null
      }
      // filter using activeFilters
      if (activeFilters) {
        for (let colId in activeFilters) {
          // if activeFilters[colId] is empty, do not filter
          if (activeFilters[colId].length === 0) {
            found = true;
          }

          if (!activeFilters[colId].includes(item[colId])) {
            found = false;
          }
        }
      }
      return found
    });
  }, [sortedItems, searchTerm, activeFilters]);

  const requestSort = key => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }

    setSortConfig({ key, direction });
  };

  let shouldCellContentBeProcessed = (contentCell) => {
    // if < / > exists inside the contentCell, it is html
    return contentCell && contentCell.includes("<") && contentCell.includes(">");
  }
  let processContent = (contentCell, configCol) => {
    // if type of is not string, return it
    if (typeof contentCell !== "string") return contentCell

    // if < and > exists inside the contentCell, it is html
    let isContentCellHtml = contentCell && contentCell.includes("<") && contentCell.includes(">")
    if (typeof contentCell === "string" && contentCell.includes("http") && !isContentCellHtml) {
      // find with a regex all the urls in the contentCell and transform them into links
      let regex = /(https?:\/\/[^\s]+)/g;
      contentCell = contentCell.replace(regex, (url) => {
        return `<a href="${url}" target="_blank">${url}</a>`;
      });
    } 
    // if (configCol.onClick) {
    //   contentCell = `<div class="table-link-click" onclick="${configCol.onClick}">${contentCell}</a>`
    // }
    return contentCell
  }

  const [configColsObj, setConfigColsObj] = r.useState({});
  r.useEffect(() => {
    let configColsObj = {};
    // if (config.multiselect === true) configColsObj["multiselect"] = {colId: "multiselect-col"}

    config.cols.forEach(col => {
      configColsObj[col.colId] = col;
    });
    // if multiselect exists, add it to the configColsObj
      
    setConfigColsObj(configColsObj);
  }, [config.cols]);

  //
  // multiselect logic
  //
  const [selectedItems, setSelectedItems] = r.useState([]);
  const onColHeaderClick = (colId) => {
    if (colId === "multiselect") {
      let allSelected = filteredItems.length === selectedItems.length;
      if (allSelected) {
        setSelectedItems([])
      } else {
        setSelectedItems(filteredItems)
      }
    } else {
      setActiveColToFilter(colId)
      requestSort(colId)
    }
  }
  


  const keysRef = r.useRef({});
  const keyCounter = (stringId) => {
    if(keysRef.current[stringId] === undefined) keysRef.current[stringId] = 0;
    keysRef.current[stringId] += 1;
    return `${stringId}-${keysRef.current[stringId]}`
  }

  //
  // buttons cell gene
  //
  const buttonsCell = (col, itemsForAction) => {
    if (!Array.isArray(itemsForAction)) itemsForAction = [itemsForAction]
    let res =  c('div', {className: "buttons-cell"}, [
      col.buttons.map(({ label, icon, onClick, onMouseEnter, onMouseLeave }) =>
        c('button', { 
          key: keyCounter(`${col.colId}-${itemsForAction[0]?.id}-${label}`), 
          onClick: (e) => {onClick(itemsForAction, e)}, 
          onMouseEnter: (e) => {if (onMouseEnter) onMouseEnter(itemsForAction, e)}, 
          onMouseLeave: (e) => {if (onMouseLeave) onMouseLeave(itemsForAction, e)}  
        }, [
          c('div', {className: `fa fa-${icon}` }),
          label
        ])
      )
    ])
    return [res]
  }

  const hasMultiselect = () => {
    return config.cols.map(c => c.colId).includes("multiselect")
  }


  // sort array ascending
  const asc = arr => arr.sort((a, b) => a - b);
  const sum = arr => arr.reduce((a, b) => a + b, 0);
  const mean = arr => sum(arr) / arr.length;
  // sample standard deviation
  const std = (arr) => {
      const mu = mean(arr);
      const diffArr = arr.map(a => (a - mu) ** 2);
      return Math.sqrt(sum(diffArr) / (arr.length - 1));
  };
  const quantile = (arr, q) => {
    let res = 0
      const sorted = asc(arr);
      const pos = (sorted.length - 1) * q;
      const base = Math.floor(pos);
      const rest = pos - base;
      if (sorted[base + 1] !== undefined) {
          res = sorted[base] + rest * (sorted[base + 1] - sorted[base]);
      } else {
          res = sorted[base];
      }
      // if res has two dots, remove the second one
      let resStr = res.toString()
      if (resStr.split(".").length > 2) {
        resStr = resStr.split(".").slice(0, 2).join(".")
        res = parseFloat(resStr)
      }
      if (res > 1) {
        res = Math.round(res * 10) / 10;
      }
      return res
  };
  const q25 = arr => quantile(arr, .25);
  const q50 = arr => quantile(arr, .50);
  const q75 = arr => quantile(arr, .75);
  const median = arr => q50(arr);
  const createHistogramCanvas = arr => {
    let canvasId = `histogram-${Math.random().toString(36).substr(2, 9)}`;
    setTimeout(() => {
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext("2d");
      // bg color whitegrey
      ctx.fillStyle = "#b7b7b7ff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const histogram = {};
      // create histogram bars with 30 bars (split from min to max)
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      const step = (max - min) / 30;
      for (let i = 0; i < 30; i++) {
        let start = min + i * step;
        let end = min + (i + 1) * step;
        let rounder = 1
        if (start < 1) rounder = 100
        start = Math.round(start * rounder) / rounder
        end = Math.round(end * rounder) / rounder
        if (i === 29) end += 1

        histogram[`${start}-${end}`] = 0;
      }
      // fill histogram data
      arr.forEach(value => {
        const bin = Object.keys(histogram).find(key => {
          const [start, end] = key.split("-").map(Number);
          return value >= start && value <= end;
        });
        if (bin) histogram[bin] += 1;
      });
      console.log(333, histogram, arr)
      // draw histogram + add legend every 5 bars on the bottom of the graph, text is 90d oriented
      const maxCount = Math.max(...Object.values(histogram));
      const barWidth = canvas.width / Object.keys(histogram).length;
      Object.entries(histogram).forEach(([range, count], index) => {
        const barHeight = (count / maxCount) * canvas.height;
        // console.log({range, count, barHeight})
        ctx.fillStyle = "grey";
        ctx.fillRect(index * barWidth, canvas.height - barHeight, barWidth, barHeight);
        // add legend every 5 bars on the bottom of the graph, text is 90d oriented
      });
      Object.entries(histogram).forEach(([range, count], index) => {
        let rangeStr = Math.round(parseFloat(range.split("-")[0])).toString();
        if (index % 5 === 0 || index === Object.entries(histogram).length - 1) {
          ctx.fillStyle = "white";
          ctx.save();
          let tX = (index * barWidth + barWidth / 2)
          if (tX < 20) tX = 20
          if (tX > canvas.width - 20) tX = canvas.width - 20

          ctx.translate(tX, canvas.height);
          ctx.rotate(-Math.PI / 3);
          // text 20px
          ctx.font = "20px Arial";
          ctx.fillText(rangeStr, 0, 0);
          ctx.restore();
        }
      });

    }, 1000);
    return `<canvas class="canvas_hist" id="${canvasId}"></canvas>`;
  }


  //
  // Header cell
  //
  const genHeaderCell = col => {
    let sum = 0
    let diffVals = new Set()
    let colType = "string"
    let earliestDate = null
    let latestDate = null
    let allValsCol = []
    let mostCountedVals = {}
    let count = 0
    if (col.headerLabel) {
      // if (col.headerLabel.includes("{{sumCol}}")) {
        items.forEach(item => {
          val = item[col.colId]
          if (!val) val = ""
          if (val.includes("%")) val = val.replace("%", "").trim()
          val = val.trim()
          let nb = parseFloat(val)
          diffVals.add(val)
          mostCountedVals[val] = (mostCountedVals[val] || 0) + 1
          allValsCol.push(val)
          sum += nb
          count++
          // item has two / / + size is dd/mm/yyyy = 10 then it is a date
          if (val.includes("/") && val.length === 10) colType = "date"
          if (colType === "date") {
            let [day, month, year] = val.split("/")
            let date = new Date(year, month - 1, day)
            if (!earliestDate || date < earliestDate) earliestDate = date
            if (!latestDate || date > latestDate) latestDate = date
          }
        })
        const formatDMY = d => {
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yy = d.getFullYear();
            return `${dd}/${mm}/${yy}`;
        };
        sum = Math.round(sum)
        if (isNaN(parseFloat(sum))) colType = "string"
        if (!isNaN(parseFloat(sum)) && colType !== "date") colType = "number"

        if (colType === "string") {
          // get 5 most counted
          const mostCounted = Object.entries(mostCountedVals)
            .sort((a, b) => b[1] - a[1])
          col.header_details = `
          unique: ${diffVals.size} <br>
          --------<br>
          <b>most counted</b>: <br> 
          <table>
          ${mostCounted.map(v => `<tr><td>${v[0]}</td><td>${v[1]}</td></tr>`).join("")}
          </table>
          `

        } else if (colType === "number") {
          // console.log(allValsCol)
          col.header_details = `
          sum: ${sum} <br>
          avg: ${Math.round(sum/items.length)} <br>
          count: ${count} <br>
          ----<br>
          min:${Math.min(...allValsCol)} <br>
          q25:${q25(allValsCol)} <br>
          q50:${q50(allValsCol)} <br>
          q75:${q75(allValsCol)} <br>
          max:${Math.max(...allValsCol)} <br>
          ----<br>
          ${createHistogramCanvas(allValsCol)}
          `
        } else if (colType === "date") {
          // date format = dd/mm/yyyy hh:mm
          let earliest = earliestDate ? formatDMY(earliestDate) : ""
          let latest = latestDate ? formatDMY(latestDate) : ""
          let diffInDays = latestDate && earliestDate ? Math.round((latestDate - earliestDate) / (1000 * 60 * 60 * 24)) : 0

          col.header_details = `from: ${earliest} <br> to : ${latest} <br> duration: ${diffInDays} days <br> unique: ${diffVals.size}`
        }
        col.header_details = `<b>${col.headerLabel} </b><br> Type: ${colType}<br>----<br>` + col.header_details
        // col.headerLabel = col.headerLabel.replace("{{sumCol}}", sumCol)
      // }
      if (col.headerLabel.includes("{{count}}")) col.headerLabel = col.headerLabel.replace("{{count}}", items.length)
    }
  
    let res = [
      `${col.headerLabel || col.colId} `, 
      c('span', {className:"sortIndic" }, [
        `${sortConfig?.key === col.colId ? (sortConfig?.direction === "ascending" ? "▼" : "▲") : ""}`
      ]),
      c('div', {className: "header_details", dangerouslySetInnerHTML: { __html: col.header_details }})
    ]
    if (col.type && col.type === "multiselect") {
      res = [c('input', {type:"checkbox", checked: filteredItems.length === selectedItems.length, onInput: () => onColHeaderClick(col.colId)})]
    }
    if (col.type && col.type === "buttons" && hasMultiselect()) {
      res = [buttonsCell(col, selectedItems)]
    }

    let isSortable = ["multiselect", "buttons"].includes(col.type) ? false : true
    res = c('th',  {  key: keyCounter(`${col.colId}-${col.headerLabel}`) ,onClick: () => { if (isSortable) requestSort(col.colId) }}, res)
    return res
  }


  // 
  // CREATE EXCEL LIKE FILTER TABLE
  // 

  // for each col, get unique values
  const [uniqFilterVals, setUniqFilterVals] = r.useState({});
  const [countUniqueFilterVals, setCountUniqueFilterVals] = r.useState({})
  const clearTxt = "🧹"
  const closeTxt = "✖️"

  const genSelectOptionLabel = (colId, val) => {
    let count = countUniqueFilterVals[colId][val] || 0
    let allValsFromColId = 0
    let longuestValLengthFromCol = 0
    for (let valCol in countUniqueFilterVals[colId]) {
      allValsFromColId += countUniqueFilterVals[colId][valCol]
      let valLength = valCol?.length || 0
      if (valCol == undefined) valLength = 0
      longuestValLengthFromCol = Math.max(longuestValLengthFromCol, valLength)
    }
    let percent = Math.round(count / allValsFromColId * 100)

    // if val is undefined, just ""
    if (val === undefined) val = ""
    let valLength = val?.length || 0
    let spaceBetween = longuestValLengthFromCol - valLength + 3
    // let spaceStr = "  ".repeat(spaceBetween)
    // let spaceStr = "&#160;".repeat(spaceBetween)
    let spaceStr = "&nbsp;".repeat(spaceBetween)
    let countStr = `${spaceStr}[ ${count} | ${percent}% ]`
    if (count === 0) countStr = ""
    if (val === closeTxt) countStr = ""
    if (val === clearTxt) countStr = ""
    return val + countStr
  }


  r.useEffect(() => {
    let uniqFilterVals = {};
    let countPerUniqVals = {};
    config.cols.forEach(col => {
      let values = new Set();
      // add select all
      values.add(closeTxt)
      values.add(clearTxt)
      items.forEach(item => {
        values.add(item[col.colId])
        if (countPerUniqVals[col.colId] === undefined) countPerUniqVals[col.colId] = {}
        if (countPerUniqVals[col.colId][item[col.colId]] === undefined) countPerUniqVals[col.colId][item[col.colId]] = 1
        else countPerUniqVals[col.colId][item[col.colId]] += 1

      })
      uniqFilterVals[col.colId] = Array.from(values)
      
    })
    setCountUniqueFilterVals(countPerUniqVals)
    setUniqFilterVals(uniqFilterVals)

  }, [items])

  // active filters rules like {col1 : [val1, val2], col2: [val1]}
  const onFilterChange = (colId, valsArr) => {
    if (valsArr.includes(closeTxt)) {
      setActiveColToFilter(null)
    } else {
      let newActiveFilters = {...activeFilters}
      newActiveFilters[colId] = valsArr
      // if "-- select all --" is selected, remove the filter
      if (valsArr.includes(clearTxt)) {
        delete newActiveFilters[colId]
        // activeColToFilter = null
        setActiveColToFilter(null)
        
      }
      setActiveFilters(newActiveFilters)

    }
  }
  // click on a header of a col to change table filter form
  const [activeColToFilter, setActiveColToFilter] = r.useState(null);





  const isColFiltered = (colId) => {
    return activeFilters[colId] !== undefined
  }
  const [colsContentHidden, setColsContentHidden] = r.useState({})
  const toggleColContent = (colId) => {
    let newColsContentHidden = {...colsContentHidden}
    newColsContentHidden[colId] = !newColsContentHidden[colId]
    setColsContentHidden(newColsContentHidden)
  }

  // status of compressing/not the row, if row compressed, cell-content is 20px height overflow hidden
  const [rowCompressed, setRowCompressed] = r.useState(true)
  


  // 

  const [gridCategories, setGridCategories] = r.useState([])
  r.useEffect(() => {
    // get from each item.category
    let categories = new Set()
    filteredItems.forEach(item => {
      // if not empty
      if (item.category?.length > 0)categories.add(item.category)
    })
    // add last category "rest"
    categories.add("_")
    setGridCategories(Array.from(categories))
  }, [filteredItems])
  const getItemsFromCategory = (category) => {
    if (category === "_") {
      return filteredItems.filter(item => item.category === undefined || item.category === "")
    }
    let items = filteredItems.filter(item => item.category === category)
    return items
  }

  const filterView = (bodyDiv) => [
      c('div', {className: "ctag-component-table-wrapper"}, [

          c('table', {className: "ctag-component-table"}, [
            c('thead', {}, [
            c('tr', {}, [
                ...config.cols.map(col =>
                  genHeaderCell(col)
                )
            ])
            ]),
            c('tbody', {}, [
              // first row is the filter row
              c('tr', {}, [
                ...config.cols.map(col => {
                  if (activeColToFilter === col.colId) {
                    return c('td', {key: `${col.colId}-filter`}, [
                      c('select', {class:"select-multiple-filter", multiple: true, onInput: (e) => {
                        let selectedValues = Array.from(e.target.selectedOptions).map(o => o.value)
                        onFilterChange(col.colId, selectedValues)
                      }}, [
                        ...uniqFilterVals[col.colId].map(val => {
                          return c('option', {value: val, selected: activeFilters[col.colId]?.includes(val), dangerouslySetInnerHTML: {__html: genSelectOptionLabel(col.colId, val)} } )
                        })
                      ])
                    ])
                  } else {
                    return c('td', {key: keyCounter(`${col.colId}-buttons`)}, [
                      // on click here, set activeColToFilter to none but event propagation should be stopped
                      c('div', {className: "col-buttons", onClick: (e) => { 
                        e.stopPropagation();
                        // setActiveColToFilter(null)
                      }}, [
                        c('div', {className: "table-link-click", onClick: () => setActiveColToFilter(col.colId)}, [
                          // filter emoji icon with ative class if filter is active
                          c('div', {className: `fa col-icon fa-filter ${isColFiltered(col.colId) ? "active" : ""}`}),
                        
                        ]),
                        // hide/show col content
                        c('div', {className: "table-link-click", onClick: () => toggleColContent(col.colId)}, [
                          c('div', {className: `fa col-icon  ${colsContentHidden[col.colId] ? "fa-eye-slash" : "fa-eye"}`}),
                        ])
                      ])
                    ])
                  }
                })
              ]),
              bodyDiv && bodyDiv()
            ]),
          ]),
    ])
  ]

  const tableView = () =>  [
       
                ...filteredItems.map(item =>
                    c('tr', { key: keyCounter(`${item.id}`) }, [
                    ...config.cols.map(col =>
                    // ...config.cols.map(({ colId, type, buttons }) =>
                      c('td', { key: keyCounter(`${col.colId}-${item.id}`), className: `${configColsObj[col.colId]?.classes || ""}` }, [
                        // BUTTON 
                        ...(col.type === 'buttons'
                            ? buttonsCell(col, item)
                            : []),
                        // ICON 
                        ...(col.type === 'icon' ? [c('div', {className: `fa fa-${item[col.colId]}` })] : []),
                        // MULTISELECT
                        ...(col.colId === "multiselect" ? [
                          c('input', { type:"checkbox", checked: selectedItems.includes(item), onInput: () => {
                            if (selectedItems.includes(item)) {
                              setSelectedItems(selectedItems.filter(i => i !== item))
                            } else {
                              setSelectedItems([...selectedItems, item])
                            }
                          }})
                        ] : []),
                        // TEXT 
                        colsContentHidden[col.colId] ? [] : [

                          !col.type ? [
                            // if config.editAction exists, show input instead of div

                            config.editMode && config.editAction && !shouldCellContentBeProcessed(item[col.colId]) ? [
                              c('input', {
                                type: "text",
                                className: "input-content",
                                value: item[col.colId],
                                onInput: (e) => {
                                  const newValue = e.target.value
                                  config.editAction(item, col, newValue)
                                  // update item[col.colId] with newValue
                                }
                              })
                            ] : [

                              c('div', {
                                onClick: (e) => {
                                  if (configColsObj[col.colId]?.onClick) configColsObj[col.colId]?.onClick(item, e)
                                },
                                className:`cell-content ${rowCompressed ? "compressed" : ""} ${configColsObj[col.colId]?.onClick ? "table-link-click" : ""}`, 
                                dangerouslySetInnerHTML:{__html: processContent(item[col.colId], configColsObj[col.colId])}
                              })
                            ]



                          ] : []



                        ]
                        ])
                    )
                    ])
                ) 
    ]

  const gridView = () => [
    c('div', {className:"ctag-component-table-grid-view"}, [
      gridCategories.length !== 1 && 
        gridCategories.map(category => [
        c('div', { key: keyCounter(`${category}`), className: "grid-category-title" }, [ category ]),
        c('div', { className: "flex-grid" }, [ 
          ...getItemsFromCategory(category).map(item =>
            gridItem(item)
          )
        ]),
      ]),
      gridCategories.length === 1 &&
        c('div', { className: "flex-grid" }, [ 
          filteredItems.map(item =>
            gridItem(item)
          )
        ]),
    ])
  ]

  const gridItem = (item) => 
          c('div', { 
            key: keyCounter(`${item.id}`), 
            className: "grid-item",
          }, [
            config.gridView?.image && config.gridView?.hideLabel && config.gridView?.label &&
            c('div', { 
              onClick: (e) => {
                if (config.gridView.onClick) config.gridView.onClick(item, e)
              },
              className: "grid-item-image" }, [
              config.gridView?.image(item)?.html ? 
                c('div', { className:"grid-item-image-html", dangerouslySetInnerHTML:{__html: config.gridView?.image(item).html}}) :
                // c('div',["test"])
                config.gridView?.image(item)?.length > 1 && 
                  c('img', { 
                    src: config.gridView?.image(item), 
                    alt: config.gridView?.image(item) 
                  })
            ]),
            c('div', { className: `grid-item-name ${config.gridView?.hideLabel(item) ? "hide-label": ""}` }, [
              c('div', {className: "grid-item-name-text"}, [config.gridView?.label(item)])
            ]),
        ])
  

  const renderView = () => {
    if (view === "table") return [filterView(tableView)]
    else if (view === "grid") return [filterView(), gridView()]
    

    //     view === "table" && filterView(tableView),
    // view === "grid" && filterView(), gridView(), 

  }
  return [
    c('style', {}, [styleCss]),

    c('div', {className:"table-controls-wrapper"}, [ 
      // filter button
      c('input', { type: 'text', value: searchTerm, placeholder:"Filter the table", onInput: e => {  setSearchTerm(e.target.value) }}),
      // toggle gridview button
      config?.gridView && c('button', { onClick: () => {nView = view === "table" ? "grid" : "table"; setView(nView)} }, [
        view === "table" && c('div', {className:"fa fa-th-large"}),
        view !== "table" && c('div', {className:"fa fa-th"})
      ]),
      // export to graph button
      config?.exportToGraph && c('button', { onClick: () => {config.exportToGraph(filteredItems)}, title: "Graphs" }, [
        c('div', {className:"fa fa-chart-line"})
      ]),
      // export to timeline button
      config?.exportToTimeline && c('button', { onClick: () => {config.exportToTimeline(filteredItems)}, title: "Timeline" }, [
        c('div', {className:"fa fa-timeline"})
      ]),
      // export to csv
      config?.exportToCsv && c('button', { onClick: () => {config.exportToCsv(filteredItems)}, title: "Export to CSV" }, [
        c('div', {className:"fa fa-file-csv"})
      ]),
      // rowcompressed button 
      c('button', { onClick: () => setRowCompressed(!rowCompressed), title: `${rowCompressed ? "Toggle to large rows" : "Toggle to compressed rows"}`}, [
        c('div', {className:`fa ${rowCompressed ? "fa-table-cells-large" : "fa-table-cells"}`})
      ]),
      // help button with  api.call("popup.show", [helpStr, "Table Help"])
      c('button', { onClick: () => api.call("popup.show", [helpStrTable, "Table Help"]), title: "Help" }, [
        c('div', {className:"fa fa-question-circle"})
      ]),
      

    ]),
    
    renderView()
  ]

    
}


//
// load directly, context without react
//
let genTableComponent = ({items, config, id}) => {
  const api = window.api;

  const startMainLogic = () => {
    let int = setInterval(() => {

      if (!window.preact.createElement || !window.preactHooks.useState) return;
      window._tiro_react = {...window.preact, ...window.preactHooks}
      clearInterval(int)
      const r = window._tiro_react;
      const c = r.createElement;

      // v18
      let container = document.getElementById("ctag-component-table-wrapper")
      container.innerHTML = ""
      r.render(c(TableComponentReact, {items, config, id}), container);
    }, 100) 
  }
  api.utils.loadRessourcesOneByOne(
      [
                "https://cdnjs.cloudflare.com/ajax/libs/preact/10.24.3/preact.min.umd.min.js",
                "https://cdnjs.cloudflare.com/ajax/libs/preact/10.24.3/hooks.umd.min.js",
      ],
      () => {
                startMainLogic()
      }
  );
  
  return `<div id="ctag-component-table-wrapper"> loading table... </div>` 
}



if (!window._tiroPluginsCommon) window._tiroPluginsCommon = {}
window._tiroPluginsCommon.TableComponentReact = TableComponentReact
window._tiroPluginsCommon.genTableComponent = genTableComponent

