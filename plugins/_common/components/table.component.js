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
.ctag-component-table {
  padding-bottom: 80px;
  overflow-wrap: normal;
  width: calc(100% - 30px);
  height: 100%;
  padding: 10px;
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
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  padding-bottom: 80px;
}
.ctag-component-table-grid-view .grid-item {
  cursor: pointer;
  width: 200px;
  height: 200px;
  border: 1px solid #ccc;
  margin: 5px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.ctag-component-table-grid-view .grid-item-image {
  width: 100%;
  height: 100%;
}
.ctag-component-table-grid-view .grid-item-image i {
  font-size: 100px;
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
.ctag-component-table-grid-view .grid-item-name {
  width: 100%;
}
.ctag-component-table-grid-view .grid-item-name-text {
  width: 100%;
  text-align: center;
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
    localStorage.setItem(`${id}-searchTerm`, JSON.stringify(term));
  }
  r.useEffect(() => {
    let term = JSON.parse(localStorage.getItem(`${id}-searchTerm`));
    if (term) setSearchTermInt(term);
  }, []);
  const [view, setViewInt] = r.useState("table");
  const setView = (term) => {
    setViewInt(term)
    localStorage.setItem(`${id}-view`, JSON.stringify(term));
  }
  r.useEffect(() => {
    let term = JSON.parse(localStorage.getItem(`${id}-view`));
    if (term) setViewInt(term);
  }, []);



  const sortedItems = r.useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] === null) a[sortConfig.key] = " ";
        if (b[sortConfig.key] === null) b[sortConfig.key] = " ";
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
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
    // console.log(123, configCol)
    // if (configCol.onClick) {
    //   contentCell = `<div class="table-link-click" onclick="${configCol.onClick}">${contentCell}</a>`
    // }
    return contentCell
  }

  const [configColsObj, setConfigColsObj] = r.useState({});
  r.useEffect(() => {
    let configColsObj = {};
    config.cols.forEach(col => {
      configColsObj[col.colId] = col;
    });
    setConfigColsObj(configColsObj);
  }, [config.cols]);


  const keysRef = r.useRef({});
  const keyCounter = (stringId) => {
    if(keysRef.current[stringId] === undefined) keysRef.current[stringId] = 0;
    keysRef.current[stringId] += 1;
    return `${stringId}-${keysRef.current[stringId]}`
  }

  const tableView = () =>  [
        c('table', {className: "ctag-component-table"}, [
          c('thead', {}, [
          c('tr', {}, [
              ...config.cols.map(({ colId, headerLabel }) =>
              c('th', { key: keyCounter(`th-header-${colId}`), onClick: () => requestSort(colId) }, [
                  `${headerLabel || colId} `,
                  c('span', {className:"sortIndic"}, [`${sortConfig?.key === colId ? (sortConfig?.direction === "ascending" ? "v" : "^") : ""}`])
              ])
              )
          ])
          ]),
          c('tbody', {}, [
              ...filteredItems.map(item =>
                  c('tr', { key: keyCounter(`${item.id}`) }, [
                  ...config.cols.map(({ colId, type, buttons }) =>
                      c('td', { key: keyCounter(`${colId}-${item.id}`), className: `${configColsObj[colId]?.classes || ""}` }, [
                      // BUTTON 
                      ...(type === 'buttons'
                          ? buttons.map(({ label, icon, onClick, onMouseEnter, onMouseLeave }) =>
                              c('button', { 
                                key: keyCounter(`${colId}-${item.id}-${label}`), 
                                onClick: (e) => {onClick(item, e)}, 
                                onMouseEnter: (e) => {if (onMouseEnter) onMouseEnter(item, e)}, 
                                onMouseLeave: (e) => {if (onMouseLeave) onMouseLeave(item, e)}  
                              }, [
                                c('div', {className: `fa fa-${icon}` }),
                                label
                              ])
                          )
                          : []),
                      // ICON 
                      ...(type === 'icon' ? [c('div', {className: `fa fa-${item[colId]}` })] : []),
                      // TEXT 
                      !type ? [
                        c('div', {
                          onClick: (e) => {
                            if (configColsObj[colId]?.onClick) configColsObj[colId]?.onClick(item, e)
                          },
                          className:`cell-content ${configColsObj[colId]?.onClick ? "table-link-click" : ""}`, 
                          dangerouslySetInnerHTML:{__html: processContent(item[colId], configColsObj[colId])}
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
          c('div', { className: "grid-item-image" }, [
            config.gridView.image(item)?.html ? 
              c('div', {dangerouslySetInnerHTML:{__html: config.gridView.image(item).html}}) :
              c('img', { src: config.gridView.image(item), alt: config.gridView.image(item) })
          ]),
          c('div', { className: "grid-item-name" }, [
            c('div', {className: "grid-item-name-text"}, [config.gridView.label(item)])
          ]),
        ])
      )
    ])
  ]

  return [
    c('style', {}, [styleCss]),
    c('input', { type: 'text', value: searchTerm, onChange: e => setSearchTerm(e.target.value) }),
    // c('div', {className:"nb-items"}, [ Math.random()]),
    // add a button to switch between table and grid view
    // c('button', { onClick: () => {nView = view === "table" ? "grid" : "table"; setView(nView)} }, [view]),
    // same but using font awesome
    c('button', { onClick: () => {nView = view === "table" ? "grid" : "table"; setView(nView)} }, [
      view === "table" && c('div', {className:"fa fa-th-large"}),
      view !== "table" && c('div', {className:"fa fa-th"})
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
        "https://unpkg.com/react@18/umd/react.development.js",
        "https://unpkg.com/react-dom@18/umd/react-dom.development.js",
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


















// let tableComponent = (p) => {
//     const r = React;
//     const c = r.createElement;
    
    
//     return (
//         c('div', { className: "app-wrapper" }, [
//             p.array && p.array.map(item => 
//                 c('div', { className: "item-wrapper" }, [item.name])
//             ),
//         ])
//     )
// }


// if (!window._tiroPluginsCommon) window._tiroPluginsCommon = {}
// window._tiroPluginsCommon.tableComponent = tableComponent


// API structure
// items: [
//     {
//       id: image1, 
//       image:src..., 
//       name:..., 
//       size:....,
//       icon:"fa-image",
//     },...
//   ]
//   config: {
//     showGalleryView: true
//     cols: [
//       {colId: "icon", label: "type", type:"icon"},
//       {colId: "name", label: "name2"},
//       {colId: "size"},
//       {colId: "actions", type: "buttons", buttons:[
//         {
//           label: delete, 
//           icon: delete, 
//           onClick: (id) => {
//             if (id.endswith === jpeg) => ask sthg specific
//             api.warn => api.delete
//           }
//         }
//       ]},
//     ]
//   }


// const [status, setStatus] = r.useState("hello world react ctag loaded from simple js lib")
// r.useEffect(() => {
//     console.log("woop", p)
//     setTimeout(() => {setStatus(12333333)}, 3000)
//     api.call("ui.notification.emit",[{content:"hello world common lib comp api"}])
// }, [])