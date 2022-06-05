## Install/Update a Custom Tag
### Install  <!-- {docsify-ignore} -->

To install the custom tag ```[[latex]]```, create a markdown note named ```latex``` in the ```/.tiro/tags/``` folder. It will then be available across your notes.


### Update  <!-- {docsify-ignore} -->

In order to update a custom tag to a newest version, replace the content of that custom tag to the newest version

### Install third-party Custom tags <!-- {docsify-ignore} -->

Simply paste the provided code in the note. However make sure to trust the developer of that code as a custom tags can access to your notes content!


## Available






### ```[[latex]]```
#### Description :
Use Latex formulas inside your note.

#### Examples :
```
[[latex]]
\sqrt{x^2+1} 
[[latex]] 
 

[[latex]]
c = \\pm\\sqrt{a^2 + b^2}"
[[latex]] 


[[latex]]
x = \\pm\\sqrt{a^2 + b^2}"
[[latex]] 
```

#### Screenshots : 
<img src="https://user-images.githubusercontent.com/2981891/171807776-baf63670-aac2-42c6-926f-547fe15f8290.png" width="200"/>

#### Install : 
 - create the note ```/.tiro/tags/latex``` and paste the following content : 
```
[[script]]
// latex V1.0.0
return api.utils.loadCustomTag("https://rawcdn.githack.com/dotgreg/tiro-notes/1826d6bf5560c8443b948c67e5f38e10cd6fe22e/custom-tags/latex/latex.js",`{{innerTag}}`)
[[script]]
```











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
return api.utils.loadCustomTag("https://rawcdn.githack.com/dotgreg/tiro-notes/1826d6bf5560c8443b948c67e5f38e10cd6fe22e/custom-tags/mermaid/mermaid.js",`{{innerTag}}`)
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
return api.utils.loadCustomTag("https://rawcdn.githack.com/dotgreg/tiro-notes/1826d6bf5560c8443b948c67e5f38e10cd6fe22e/custom-tags/spreadsheet/spreadsheet.js",`{{innerTag}}`)
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
// RSS V1.0.0
return api.utils.loadCustomTag("https://rawcdn.githack.com/dotgreg/tiro-notes/1826d6bf5560c8443b948c67e5f38e10cd6fe22e/custom-tags/rss/rss.js",`{{innerTag}}`, {size: "80%", rssToJsonUrl: "https://api.rss2json.com/v1/api.json?api_key=jiqsgkdxnqclbmppcao4wegdo9mghhmzl2ho3xdy&count=200&rss_url="})
[[script]]
```
- Options
	- size : size in height in percentage
	- rssToJsonUrl : currently using a free limited service called https://rss2json that convert rss xml feeds to json. It is free up to 25 feeds, you can add your api key by replacing the url by https://api.rss2json.com/v1/api.json?api_key=YOUR_URL_KEY&count=200&rss_url=. You can alternatively use other xml to js service.

#### Changelog :
 v0.30.3 : 02/06/2022 : fixing issues  

<details>
  <summary>Previous versions</summary>
</details>







### ```[[view]]```
#### Description :
Display ressources in a dedicated viewer. Currently supporting the following files types
- pdf
- mp4
- mp3

Types support planned :
- xls, xlsx (partial)

Link can be a local file in your notes (```./.resources/myvideo.mp4```) or external (```https://awebsite.com/avideo.mp4```)

#### Usage :
```
[[view]]
./.resources/mydoc.pdf
[[view]]

```
#### Screenshots : 
<img src="https://user-images.githubusercontent.com/2981891/171811720-1ca54379-93ac-4f3e-8f0a-a8b41194a4e7.png" width="200"/>

#### Install : 
...wip










## Planned

### ```[[calendar]]```
#### Description :
A fully functional calendar which displays all your event either on a monthly calendar or a small next event widget

#### Usage :
#### Screenshot : 
<img src="https://user-images.githubusercontent.com/2981891/171815747-c6996d43-55e9-49ee-a769-6f45b0ff2637.jpg" width="200"/>

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