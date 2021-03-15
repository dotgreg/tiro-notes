const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "June",
  "July", "Aug", "Sept", "Oct", "Nov", "Dec"
];

// export const formatDateEditor = (d: Date): string => {
//     var datestring = d.getFullYear()  + "-" + (d.getMonth()+1) + "-" + d.getDate() + " at " +
//     d.getHours() + "h" + d.getMinutes();
//     return datestring
// }
export const formatDateEditor = (d: Date): string => {
    var datestring =   d.getDate() + "  " + monthNames[d.getMonth()] + " " + d.getFullYear() + " at " +
    d.getHours() + "h" + d.getMinutes();
    return datestring
}
export const formatDateList = (d: Date): string => {
    // var datestring =   d.getDate() + "  " + monthNamesShort[d.getMonth()] + " " + d.getFullYear() ;
    var datestring =   ('0'+d.getDate()).slice(-2) + "/" + ('0'+(d.getMonth()+1)).slice(-2) + "/" + d.getFullYear().toString().substr(2) ;
    return datestring
}