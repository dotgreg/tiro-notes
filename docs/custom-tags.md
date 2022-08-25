## Install/Update a Custom Tag
### Install  <!-- {docsify-ignore} -->

To install the custom tag ```[[letter-header]]```, create a markdown note named ```letter-header``` in the ```/.tiro/tags/``` folder. It will then be available across your notes.


### Update  <!-- {docsify-ignore} -->

In order to update a custom tag to a newest version, replace the content of that custom tag to the newest version

### Install third-party Custom tags <!-- {docsify-ignore} -->

Simply paste the provided code in the note. However make sure to trust the developer of that code as a custom tags can access to your notes content!


## Available






### ```[[latex]]```
#### Description :
Use Latex formulas inside your note.
You can use [[l]] or [[latex]]

#### Examples :
```
[[latex]]
\sqrt{x^2+1} 
[[latex]] 
 

[[latex]]
c = \\pm\\sqrt{a^2 + b^2}"
[[latex]] 


[[l]]
x = \\pm\\sqrt{a^2 + b^2}"
[[l]] 
```

#### Screenshots : 
<img src="https://user-images.githubusercontent.com/2981891/171807776-baf63670-aac2-42c6-926f-547fe15f8290.png" width="200"/>

#### Install : 
- Already included in Tiro notes starting 0.30.42. No install needed.









### ```[[toc]]```
#### Description :
generate a table of content of your note.

#### Examples :
```
[[toc]]
[[toc]]

... note content ...
```

#### Screenshots : 
<img src="https://user-images.githubusercontent.com/2981891/176912694-bee5b592-4f79-46c5-9ed7-116e1b80b533.png" width="200"/>

#### Install : 
 - create the note ```/.tiro/tags/toc``` and paste the following content : 
```
[[script]]
// toc V1.0.2
return api.utils.loadCustomTag("https://raw.githubusercontent.com/dotgreg/tiro-notes/bb7c60628a3aed2cf9ea30b1f8184fec93baddc8/custom-tags/toc/toc.js",`{{innerTag}}`, {refresh_interval: 5})
[[script]]
```
- Options
	- refresh_interval : interval between each content refresh

#### Changelog :
 - 1.0.22 (25/08/2022) : fixing bugs when line jumping
 - 1.0.1 (10/07/2022) : adding autorefresh functionality + bugfix
 - 1.0.0 : initial version


















### ```[[mermaid]] ```
(UML/Gantt/Flowcharts/Pies)

#### Description :
Use [Mermaid](https://mermaid-js.github.io/mermaid/#/) syntax to easily generate UML/Gantt/Flowcharts/Pies in your note
#### Usage :
```
# FLOWCHART
[[mermaid]]
graph TD 
A[Client] --> B[Load Balancer] 
B --> C[Server01] 
B --> D[Server02]
[[mermaid]]

# GANTT
[[mermaid]]
gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d

[[mermaid]]


# PIE
[[mermaid]]
pie
    title Key elements in Product X
    "Calcium" : 42.96
    "Potassium" : 50.05
    "Magnesium" : 10.01
    "Iron" :  5

[[mermaid]]
```

#### Screenshots : 
<img src="https://user-images.githubusercontent.com/2981891/171695811-13f215b0-2168-4c49-85db-1a6daf4b881f.png" width="200"/>
<img src="https://user-images.githubusercontent.com/2981891/171695893-58cb7358-bbb8-40f4-94d2-d6be24106f99.png" width="200"/>
<img src="" width="200"/>

#### Install : 
 - create the note ```/.tiro/tags/mermaid``` and paste the following content : 
```
[[script]]
// MERMAID V1.0.0
return api.utils.loadCustomTag("https://raw.githubusercontent.com/dotgreg/tiro-notes/bb7c60628a3aed2cf9ea30b1f8184fec93baddc8/custom-tags/mermaid/mermaid.js",`{{innerTag}}`)
[[script]]
```








### ```[[spreadsheet]]```

#### Description :
Add spreadsheet formulas you would use on excel or open office to your markdown table

#### Usage :
```
[[spreadsheet]]
Task|Hour|Rate|Total
-|-|-|-
task 1|42|300|=B1*C1
task 2|52|200|=B2*C2
task 3|52|300|=B3*C3
task 4|32|500|=B4*C4
-|-|-|-
||Subtaxes|=SUM(D1:D4) * 0.20
||All included|=SUM(D1:D4)
[[spreadsheet]]
```

#### Screenshot : 
<img src="https://user-images.githubusercontent.com/2981891/171697299-cfa9ad93-d3ed-4252-b716-7f8e1157908b.png" width="200"/>

#### Install : 
 - create the note ```/.tiro/tags/spreadsheet``` and paste the following content : 
```
[[script]]
// SPREADSHEET V1.0.0
return api.utils.loadCustomTag("https://raw.githubusercontent.com/dotgreg/tiro-notes/bb7c60628a3aed2cf9ea30b1f8184fec93baddc8/custom-tags/spreadsheet/spreadsheet.js",`{{innerTag}}`)
[[script]]
```











### ```[[rss]]```

#### Description:

A full fledge RSS reader inside Tiro Notes. Designed to work on small screens/windows as well as on desktop.
Simply call it and paste your rss feeds with their name in it

#### Example :
```
[[rss]]
hacker_news https://hnrss.org/newest?points=100
ny_times https://rss.nytimes.com/services/xml/rss/nyt/World.xml
korben https://korben.info/feed 
[[rss]]

```

#### Screenshots :

##### Desktop View 
<img src="https://user-images.githubusercontent.com/2981891/171813360-e9a30fc1-9fbd-469b-9cf5-8279d7647c74.jpg" width="300"/>

##### Small Window/Mobile View 
<img src="https://user-images.githubusercontent.com/2981891/171813363-9ab4ae49-e0f4-45a3-b946-75950583e0e1.jpg" width="150"/>
<img src="https://user-images.githubusercontent.com/2981891/171813366-fb7e5032-dff7-4113-8bb7-5133da9c76a9.jpg" width="150"/>



#### Install :
 - create the note ```/.tiro/tags/rss``` and paste the following content : 
```
[[script]]
// RSS V1.0.1
return api.utils.loadCustomTag("https://raw.githubusercontent.com/dotgreg/tiro-notes/bb7c60628a3aed2cf9ea30b1f8184fec93baddc8/custom-tags/rss/rss.js",`{{innerTag}}`, {size: "80%", rssToJsonUrl: "https://api.rss2json.com/v1/api.json?api_key=jiqsgkdxnqclbmppcao4wegdo9mghhmzl2ho3xdy&count=200&rss_url="})
[[script]]
```
- Options
	- size : size in height in percentage
	- rssToJsonUrl : currently using a free limited service called https://rss2json that convert rss xml feeds to json. It is free up to 25 feeds, you can add your api key by replacing the url by https://api.rss2json.com/v1/api.json?api_key=YOUR_URL_KEY&count=200&rss_url=. You can alternatively use other xml to js service.

#### Changelog :
 - 1.0.1 (02/06/2022) fixing issues  








### ```[[pdf]]```
#### Description :
A pdf viewer inside Tiro designed for studying large documents.
- Cross platform : works on any browser including android chrome and apple safari .
- Save the document page (per-device).
- Only load the required page (only if PDF is linearized, you can use <a href="https://www.google.com/search?q=linearize+pdf+online" target="_blank">online tools</a> for that.).

#### Usage :
```
[[pdf]]
.resources/mydoc.pdf
[[pdf]]

```

#### Install : 
 - create the note ```/.tiro/tags/pdf``` and paste the following content : 
```
[[script]]
// PDF V1.0.0
return api.utils.loadCustomTag("https://raw.githubusercontent.com/dotgreg/tiro-notes/bb7c60628a3aed2cf9ea30b1f8184fec93baddc8/custom-tags/pdf/pdf.js",`{{innerTag}}`)
[[script]]

```
#### Screenshots : 
##### Desktop
<img src="https://user-images.githubusercontent.com/2981891/178155769-a5b575c2-ce0f-4fc9-95ea-dede81c9e971.png" width="200"/>

##### Mobile
<img src="https://user-images.githubusercontent.com/2981891/178155773-b677cd2d-a879-4215-940b-70b13c219849.jpg" width="100"/>




### ```[[calendar]]```
#### Description :
A monthly calendar which displays events from a note.

#### Install : 
1. create the note ```/.tiro/tags/calendar``` and paste the following content : 
```
[[script]]
api.utils.canScrollIframe(true)
return api.utils.loadCustomTag("https://raw.githubusercontent.com/dotgreg/tiro-notes/bb7c60628a3aed2cf9ea30b1f8184fec93baddc8/custom-tags/calendar/calendar.js",`{{innerTag}}`,{size:"80%", source: "/mynotes/planning/events.md"})
[[script]]
```
- configuration
	- source : the note path where your events are stored, (ex => source: "/mynotes/planning/events.md")

2. Create a note to store your events. For instance "/mynotes/planning/events.md".
- Each line is a new event.
- the line format is the following : TITLE | mm/dd/yy | POPUP DESCRIPTION
```
meeting with john | 09/22/22 | About project 1 https://www.google.com/maps/search/chatelet,+paris 
14h doctor appointment | 10/22/22 | bring papers!
other event | 11/22/22 | other description

```

#### Todo : 
- [ ] repeat weekly, monthly and yearly events
- [ ] events lasting more than a day

#### Screenshot : 
<img src="https://user-images.githubusercontent.com/2981891/186639094-03a3e35b-76f1-4676-8d59-6726bedbe01e.jpg" width="200"/>





## Planned

#### Install : 

### ```[[nodes]]```
#### Description :
Display the current notes folder with a nodal, structured and connected view

#### Usage :
#### Screenshot : 
<img src="https://user-images.githubusercontent.com/2981891/171816664-563eaaf7-dfce-44fd-82d0-b3e8810d914c.jpg" width="200"/>

#### Install : 

### ```[[timeline]]```
#### Description :
Display the current notes folder as a timeline

#### Usage :
#### Screenshot : 
<img src="https://user-images.githubusercontent.com/2981891/171819462-66a40f4c-1e92-427c-af63-49e9a4155deb.jpg" width="200"/>


#### Install : 