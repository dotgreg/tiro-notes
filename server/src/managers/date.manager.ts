export const formatDateNewNote = (d: Date): string => {
    var datestring = d.getFullYear()  + "-" + (d.getMonth()+1) + "-" + d.getDate() + " at " +
    d.getHours() + "h" + d.getMinutes();
    return datestring
  }

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