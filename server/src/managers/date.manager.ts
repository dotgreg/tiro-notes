const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "June",
  "July", "Aug", "Sept", "Oct", "Nov", "Dec"
];


export const getDateTime = (dateString?:string) => {
  let d = dateString ? new Date(dateString) : new Date()
  let year = d.getFullYear()
  let month = d.getMonth()+1
  let day = d.getDate()
  let syear = year.toString()
  let smonth = ('0'+(month)).slice(-2);
  let sday = ('0'+day).slice(-2);
  let hour = ('0'+d.getHours()).slice(-2);
  let min = ('0'+d.getMinutes()).slice(-2);
  let full = `${smonth}/${sday}/${syear} ${hour}:${min}`
  let date = `${smonth}/${sday}/${syear}`
  let num = {
      year, month, day,hour:d.getHours(), min:d.getMinutes(), timestamp: d.getTime(),
  }
  let raw = d
  return {year:syear, month:smonth, day:sday, hour, min, full, num, date, raw}
}

export type iDateTime = ReturnType<typeof getDateTime>

// 010521
export const dateId = (d:Date): string => {
  let day = ('0'+d.getDate()).slice(-2);
  let shortMonth = ('0'+d.getMonth()).slice(-2);
  let shortYear = new Date().getFullYear().toString().substr(2);
  const datestring = `${day}${shortMonth}${shortYear}`
  return datestring
}

export const formatDateNewNote = (d:Date): string => {
  let day = ('0'+d.getDate()).slice(-2);
  let shortMonth = monthNamesShort[d.getMonth()];
  let shortYear = new Date().getFullYear().toString().substr(2);
  const datestring = `${day} ${shortMonth} ${shortYear}`
  return datestring
}

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