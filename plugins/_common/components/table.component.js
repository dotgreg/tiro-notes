// assuming react is already loaded in window
// assuming     <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> is loaded in html


// const TableComponentReact = () => {
//   return TableComponentReact2()
// }
// let TableComponentReact2 = () => {
//   const r = React;
//   const c = r.createElement;
//   const [sortConfig, setSortConfig] = r.useState(null);
//   return [
//     c('input', { type: 'text', value: "", onChange: e => {} })
//   ]
// }
const styleCss = `
#ctag-component-table-wrapper {
  padding: 10px;
}

table {
  width: 100%;
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

.table-controls-wrapper {
  padding-left: 15px;
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
  padding-top: 20px;
  display: flex;
  justify-content: center;
  flex-direction: row;
  flex-wrap: wrap;
  padding-bottom: 80px;
}
.ctag-component-table-grid-view .grid-item {
  cursor: pointer;
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

<h3> More options </h3>
<p> You can remove the meta columns by adding the word "__config_hide_meta" <br>
<p> You can remove header and config rows by adding the word "__config_hide_config_rows" <br>
Full example: (to copy and paste in a note, then click on #food)
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
	const r = React;
  const c = r.createElement;
	return r.useMemo(() => {
		return c(TableComponentReactInt, { items, config, id })
	}, [
		items,
		config,
		id
  ])
}

// if grid enabled
  // 

const TableComponentReactInt = ({ items, config, id }) => {
  if (!id) id = "table-component"
  const r = React;
  
  
  const c = r.createElement;
  // r.useEffect(() => {
  //   if (!config.displayType) config.displayType = "table"
  // }, [config]);

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
    // let term = JSON.parse(localStorage.getItem(`${id}-view`));
    // if (term) setViewInt(term);
  }, []);



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


  const [activeFilters, setActiveFilters] = r.useState({});
  const filteredItems = r.useMemo(() => {
    return sortedItems.filter(item => {
      let found = false;
      // filter using search
      found = JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
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
    // console.log("requestSort", key)
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }

    setSortConfig({ key, direction });
  };

  let processContent = (contentCell, configCol) => {
    if (typeof contentCell === "string" && contentCell.includes("http")) {
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
    // console.log(config.multiselect, config)
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


  //
  // Header cell
  //
  const genHeaderCell = col => {
    if (col.headerLabel) {
      if (col.headerLabel.includes("{{sumCol}}")) {
        let sumCol = 0;
        items.forEach(item => {
          sumCol += item[col.colId]
        })
        sumCol = Math.round(sumCol)
        col.headerLabel = col.headerLabel.replace("{{sumCol}}", sumCol)
      }
      if (col.headerLabel.includes("{{count}}")) col.headerLabel = col.headerLabel.replace("{{count}}", items.length)
    }
  
    let res = [
      `${col.headerLabel || col.colId} `, 
      c('span', {className:"sortIndic" }, [
        `${sortConfig?.key === col.colId ? (sortConfig?.direction === "ascending" ? "▼" : "▲") : ""}`
      ])
    ]
    if (col.type && col.type === "multiselect") {
      res = [c('input', {type:"checkbox", checked: filteredItems.length === selectedItems.length, onChange: () => onColHeaderClick(col.colId)})]
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
  const clearTxt = "🧹"
  const closeTxt = "✖️"
  r.useEffect(() => {
    let uniqFilterVals = {};
    config.cols.forEach(col => {
      let values = new Set();
      // add select all
      values.add(closeTxt)
      values.add(clearTxt)
      items.forEach(item => {
        values.add(item[col.colId])
      })
      uniqFilterVals[col.colId] = Array.from(values)
    })
    setUniqFilterVals(uniqFilterVals)
    // console.log("uniqFilterVals", uniqFilterVals)
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
      // console.log("newActiveFilters", newActiveFilters)

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
  

  const tableView = () =>  [
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
                      c('select', {class:"select-multiple-filter", multiple: true, onChange: (e) => {
                        let selectedValues = Array.from(e.target.selectedOptions).map(o => o.value)
                        onFilterChange(col.colId, selectedValues)
                      }}, [
                        ...uniqFilterVals[col.colId].map(val => {
                          return c('option', {value: val, selected: activeFilters[col.colId]?.includes(val)}, val)
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
                          c('input', {type:"checkbox", checked: selectedItems.includes(item), onChange: () => {
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
                          c('div', {
                            onClick: (e) => {
                              if (configColsObj[col.colId]?.onClick) configColsObj[col.colId]?.onClick(item, e)
                            },
                            className:`cell-content ${rowCompressed ? "compressed" : ""} ${configColsObj[col.colId]?.onClick ? "table-link-click" : ""}`, 
                            dangerouslySetInnerHTML:{__html: processContent(item[col.colId], configColsObj[col.colId])}
                          })
                        ] : []
                        ]
                        ])
                    )
                    ])
                ) 
            ]) // endbody
        ]) // endtable
      ]) // endtable
    ]

  const gridView = () => [
    c('div', {className:"ctag-component-table-grid-view"}, [
      ...filteredItems.map(item =>
        c('div', { 
            key: keyCounter(`${item.id}`), 
            className: "grid-item",
            onClick: (e) => {
              if (config.gridView.onClick) config.gridView.onClick(item, e)
            }
          }, [
            config.gridView?.image && config.gridView?.hideLabel && config.gridView?.label &&
            c('div', { className: "grid-item-image" }, [
              config.gridView?.image(item)?.html ? 
                c('div', {dangerouslySetInnerHTML:{__html: config.gridView?.image(item).html}}) :
                c('img', { src: config.gridView?.image(item), alt: config.gridView?.image(item) })
            ]),
            c('div', { className: `grid-item-name ${config.gridView?.hideLabel(item) ? "hide-label": ""}` }, [
              c('div', {className: "grid-item-name-text"}, [config.gridView?.label(item)])
            ]),
        ])
      )
    ])
  ]

  return [
    c('style', {}, [styleCss]),

    c('div', {className:"table-controls-wrapper"}, [ 
      // filter button
      c('input', { type: 'text', value: searchTerm, placeholder:"Filter the table", onChange: e => setSearchTerm(e.target.value) }),
      // toggle gridview button
      config?.gridView && c('button', { onClick: () => {nView = view === "table" ? "grid" : "table"; setView(nView)} }, [
        view === "table" && c('div', {className:"fa fa-th-large"}),
        view !== "table" && c('div', {className:"fa fa-th"})
      ]),
      // export to graph button
      config?.exportToGraph && c('button', { onClick: () => {config.exportToGraph(filteredItems)}, title: "Graphs" }, [
        c('div', {className:"fa fa-chart-line"})
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
    
    // c('div', {className:"nb-items"}, [ config.displayType ]),
    view === "table" ? tableView() : gridView()
  ]

    
}


//
// load directly, context without react
//
let genTableComponent = ({items, config, id}) => {
  const api = window.api;
  const startMainLogic = () => {
    let int = setInterval(() => {
      if (!window.ReactDOM || !ReactDOM || !React) return;
      clearInterval(int)
      const r = React;
      const c = r.createElement;

      // v18
      // console.log("table render component")
      let container = document.getElementById("ctag-component-table-wrapper")
      const root = ReactDOM.createRoot(container); // create a root
      root.render(c(TableComponentReact, {items, config, id}));
    }, 100) 
  }
  api.utils.loadRessources(
      [
        // "https://unpkg.com/react@18/umd/react.development.js",
        // "https://unpkg.com/react-dom@18/umd/react-dom.development.js",
        // "https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js",
        // "https://cdn.jsdelivr.net/npm/react-dom@18.2.0/index.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js",

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

