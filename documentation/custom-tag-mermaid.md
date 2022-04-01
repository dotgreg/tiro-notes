## DESCRIPTION

Tiro Notes [[mermaid]] Custom tag for Uml, Gantt and flowcharts using Mermaid.js

Library Documentation here : https://mermaid-js.github.io/mermaid

## SCREENSHOTS

<img src="https://user-images.githubusercontent.com/2981891/161111905-8a5d03e8-08ad-4524-9345-a095245a2905.jpg" width="400"/>

## INSTALLATION

1. Place in /.tiro/tags/mermaid.md

```
[[script]] 
const id = Math.round(Math.random() * 100000000)
const classId = `mermaid-${id}`

window.tiroCli.loadScripts.f(['https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js'], () => {
    document.getElementById(`mermaid-${id}-wrapper`).innerHTML=`
    <div class="${classId}">
        {{innerTag}}
    </div>
    `;
    mermaid.initialize({});
    mermaid.init({noteMargin: 10}, `.${classId}`);
});
return `<div id="mermaid-${id}-wrapper"></div>` 
[[script]]  
```

1. You can then use the ```[[mermaid]] [[mermaid]]``` in your notes

# EXAMPLE

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
