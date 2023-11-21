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

let TableComponentReact = ({ items, config }) => {
  const r = React;
  const [sortConfig, setSortConfig] = r.useState(null);
  const c = r.createElement;
  const [searchTerm, setSearchTerm] = r.useState("");

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



  return [
    c('input', { type: 'text', value: searchTerm, onChange: e => setSearchTerm(e.target.value) }),
    c('table', {}, [
        c('thead', {}, [
        c('tr', {}, [
            ...config.cols.map(({ colId, headerLabel }) =>
            c('th', { key: colId, onClick: () => requestSort(colId) }, [
                `${headerLabel || colId} ${sortConfig?.key === colId ? (sortConfig?.direction === "ascending" ? "v" : "^") : ""}` 
            ])
            )
        ])
        ]),
        c('tbody', {}, [
            ...filteredItems.map(item =>
                c('tr', { key: item.id }, [
                ...config.cols.map(({ colId, type, buttons }) =>
                    c('td', { key: colId }, [
                    // BUTTON 
                    ...(type === 'buttons'
                        ? buttons.map(({ label, icon, onClick, onMouseEnter, onMouseLeave }) =>
                            c('button', { 
                              key: label, 
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
                    !type ? [item[colId]] : []
                    ])
                )
                ])
            ) 
        ]) // endbody
    ]) // endtable
  ]; 
}


//
// load directly, context without react
//
let genTableComponent = ({items, config}) => {
  const api = window.api;
  const startMainLogic = () => {
    let int = setInterval(() => {
      if (!window.ReactDOM || !ReactDOM || !React) return;
      clearInterval(int)
      const r = React;
      const c = r.createElement;

      // v18
      console.log("table render component")
      let container = document.getElementById("ctag-component-table-wrapper")
      const root = ReactDOM.createRoot(container); // create a root
      root.render(c(TableComponentReact, {items, config}));
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
  
  return `<div id="ctag-component-table-wrapper"> ... </div>
  
  <style>
    #ctag-component-table-wrapper {
      width: 100%;
      height: 100%;
      padding-top: 5px;
    }
    #ctag-component-table-wrapper td {
      word-break: break-all;
    }

    </style>
  ` 
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