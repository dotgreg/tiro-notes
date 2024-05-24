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


  const filteredItems = r.useMemo(() => {
    return sortedItems.filter(item => {
      return JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
    });
  }, [sortedItems, searchTerm]);

  const requestSort = key => {
    console.log("requestSort", key)
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
        `${sortConfig?.key === col.colId ? (sortConfig?.direction === "ascending" ? "v" : "^") : ""}`
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

  const tableView = () =>  [
        c('table', {className: "ctag-component-table"}, [
          c('thead', {}, [
          c('tr', {}, [
              ...config.cols.map(col =>
                genHeaderCell(col)
              )
          ])
          ]),
          c('tbody', {}, [
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
                      !col.type ? [
                        c('div', {
                          onClick: (e) => {
                            if (configColsObj[col.colId]?.onClick) configColsObj[col.colId]?.onClick(item, e)
                          },
                          className:`cell-content ${configColsObj[col.colId]?.onClick ? "table-link-click" : ""}`, 
                          dangerouslySetInnerHTML:{__html: processContent(item[col.colId], configColsObj[col.colId])}
                        })
                      ] : []
                      ])
                  )
                  ])
              ) 
          ]) // endbody
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
      config?.exportToGraph && c('button', { onClick: () => {config.exportToGraph(filteredItems)} }, [
        c('div', {className:"fa fa-chart-line"})
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

