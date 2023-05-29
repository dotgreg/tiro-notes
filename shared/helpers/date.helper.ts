export const getDateObj = (dateString?:string) => {
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
    let full_file = `${smonth}-${sday}-${syear}_${hour}h${min}m`
    let date = `${smonth}/${sday}/${syear}`
    let num = {
        year, month, day,hour:d.getHours(), min:d.getMinutes(), timestamp: d.getTime(),
    }
    let raw = d
    return {year:syear, month:smonth, day:sday, hour, min, full, num, date, raw, full_file}
  }