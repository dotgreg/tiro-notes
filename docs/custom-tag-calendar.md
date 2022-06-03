# DESCRIPTION

A calendar app for [Tiro Notes](https://github.com/dotgreg/tiro-notes) with the data stored on a markdown note

 ## SCREENSHOTS
 <img src="https://user-images.githubusercontent.com/2981891/160671645-9d973a0b-d6a8-4c2c-999e-7c18c272890b.jpg" width="600"/>

## INSTALLATION

1. Place in /.tiro/tags/calendar.md

```
[[script]] 
window.tiroCli.loadScripts.f(['https://gistcdn.githack.com/dotgreg/720511c275ad28d1f7e0870324ab4a96/raw/d3c4ba148dbb43ce5346be53d2009bde5929fdba/tiro-calendar-app.js'], () => {
    window.tiroCal.render('calendar-wrapper')
});
//tiroCli.setTempViewType.f('preview');
return `<div id="calendar-wrapper"></div>` 
[[script]]  
```
1. You can then use the ```[[calendar]] [[calendar]]``` in your notes

## USAGE
- Event
  - if location field of an event has the string "repeat-month", the event will be repeated every month
  - if location field of an event has the string "repeat-year", the event will be repeated every year

 - remove ```//``` of  ```//tiroCli.setTempViewType.f('preview'); ``` to always show the calendar fullscreen

- Data is store by default in ```/.tiro/tags-data/calendar_data.md```.  (Modify ```window.tiroCal.noteDbPath``` to store it elsewhere)

 ## SCREENSHOTS
![Screenshot 2022-03-29 at 19 35 08](https://user-images.githubusercontent.com/2981891/160671645-9d973a0b-d6a8-4c2c-999e-7c18c272890b.jpg)

