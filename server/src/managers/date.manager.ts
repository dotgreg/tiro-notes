
const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "June",
  "July", "Aug", "Sept", "Oct", "Nov", "Dec"
];






// 010521
export const dateId = (d:Date): string => {
  let day = ('0'+d.getDate()).slice(-2);
  let shortMonth = ('0'+d.getMonth()).slice(-2);
  let shortYear = new Date().getFullYear().toString().substr(2);
  const datestring = `${day}${shortMonth}${shortYear}`
  return datestring
}

// 01-05-21
export const formatDateNewNote = (d:Date): string => {
  let day = ('0'+d.getDate()).slice(-2);
  let shortMonth = ('0'+(d.getMonth()+1)).slice(-2);
  let shortYear = new Date().getFullYear().toString().substr(2);
  const datestring = `${day}-${shortMonth}-${shortYear}`
  return datestring
}
// export const formatDateNewNote = (d:Date): string => {
//   let day = ('0'+d.getDate()).slice(-2);
//   let shortMonth = monthNamesShort[d.getMonth()];
//   let shortYear = new Date().getFullYear().toString().substr(2);
//   const datestring = `${day} ${shortMonth} ${shortYear}`
//   return datestring
// }

// export const formatDateNewNote = (d: Date): string => {
//     var datestring = d.getFullYear()  + "-" + (d.getMonth()+1) + "-" + d.getDate() + " at " +
//     d.getHours() + "h" + d.getMinutes();
//     return datestring
//   }

  export const formatDateTag = (d: Date): string => {
    var datestring = d.getFullYear()  + "-" + (d.getMonth()+1) + "-" + d.getDate() + "--" +
    d.getHours() + "h-" + d.getMinutes()+'m';
    return datestring
  }


// minutes => change every 10m
export const formatDateHistory = (d: Date): string => {
    var datestring = d.getFullYear()  + "" + (d.getMonth()+1) + "" + d.getDate() + "-" +
    d.getHours() + "h" + Math.round(new Date().getMinutes()/10);
    return datestring
  }
