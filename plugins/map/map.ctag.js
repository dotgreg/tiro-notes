//@flow
/*::
declare var api: any;
declare var L: any;
declare var autoComplete: any;
import type {iGraphPerspectiveParams, iGraphPerspectiveViewerWrapper} from "../_common/components/graph_perspective.component"
import type {iCommonLib} from "../_common/common.lib"
*/

const h = "[MAP CTAG]"

const mapCtag = (innerTagStr/*:string*/, opts/*:Object*/) => {
        // let api = window.api
        const { div, updateContent } = api.utils.createDiv()
        
        ///////////////////////////////////////////////////////////
        // 
        // MAIN LOGIC
        //
        ///////////////////////////////////////////////////////////

        const initMapAppCode = () => {
                const commonLib/*:iCommonLib*/ = window._tiroPluginsCommon.commonLib
                const {getOperatingSystem, each, onClick} = commonLib

                /**
                 * add move and delete marker
                 */

                // config map
                let config = {
                        // minZoom: 1,
                        // maxZomm: 18
                };
                // magnification with which the map will start
                const zoom = 18;
                // co-ordinates
                const lat = 52.22977;
                const lon = 21.01178;
                
                // calling map
                const map = L.map("map", config).setView([lat, lon], zoom);
                
                // Used to load and display tile layers on the map
                // Most tile servers require attribution, which you can set under `Layer`
                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                        attribution:
                        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);
                
                // add marker on click
                map.on("click", addMarker);
                
                function addMarker(e) {
                        console.log("dddddddddd")
                        // Add marker to map at click location
                        const markerPlace = document.querySelector(".marker-position");
                        markerPlace.textContent = `new marker: ${e.latlng.lat}, ${e.latlng.lng}`;
                
                        const marker = new L.marker(e.latlng, {
                        draggable: true
                        })
                        .addTo(map)
                        .bindPopup(buttonRemove);
                
                        // event remove marker
                        marker.on("popupopen", removeMarker);
                
                        // event draged marker
                        marker.on("dragend", dragedMaker);
                }
                
                const buttonRemove =
                        '<button type="button" class="remove">delte marker 💔</button>';
                
                // remove marker
                function removeMarker() {
                        const marker = this;
                        const btn = document.querySelector(".remove");
                        btn.addEventListener("click", function () {
                        const markerPlace = document.querySelector(".marker-position");
                        markerPlace.textContent = "goodbye marker 💩";
                        map.removeLayer(marker);
                        });
                }
                
                // draged
                function dragedMaker() {
                        const markerPlace = document.querySelector(".marker-position");
                        markerPlace.textContent = `change position: ${this.getLatLng().lat}, ${
                        this.getLatLng().lng
                        }`;
                }

                var points = Array.from({length: 10}, () => ({  // Generate 10 random points
                        title: `point${Math.random().toString(36).substring(7)}`,
                        lat: Math.random() * 180 - 90,
                        lon: Math.random() * 360 - 180,
                        content: `Content for point ${Math.random().toString(36).substring(7)}`
                    }));
                    
                    var markers = []; // Marker storage
                    points.forEach(function (obj) {
                        var marker = L.marker([obj.lat, obj.lon]).addTo(map)
                            .bindPopup(`<b>${obj.title}</b><br>${obj.content}`);
                        markers.push(marker);
                    });
                //     console.log(123333, markers, points)
                    
                    var group = new L.featureGroup(markers); // Group to handle all markers
                    map.fitBounds(group.getBounds()); // Adjust view to contain all markers
                
        } // end start main logic
    
        setTimeout(() => {
            setTimeout(() => {
                    api.utils.resizeIframe("100%");
            }, 100)
            setTimeout(() => {
                api.utils.loadRessources(
                    [
                        `${opts.plugins_root_url}/_common/common.lib.js`,
                        `https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js`,
                        // `https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css`,
                    ],
                    () => {
                        initMapAppCode()
                    }
                );
            }, 200)
        })


        const css = {
                heightForm: "60px",
                heightGraph: "calc(100% - 80px)"
        }
        // if we are in mobile, height of form is 100px
        if (window.innerWidth < 600) css.heightGraph = "calc(100% - 150px)"
        return `
        <link href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" rel="stylesheet"> 
        <div id="map-ctag"> 
                <div class="marker-position">click on the map, move the marker, click on the marker</div>
                <div id="map"></div>
        </div>

        <style>
        #map-ctag {
                height: calc(100vh - 30px);
                width: 100%;
                background: white;
        } 
      
        
        body,
        html,
        #map {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0
        }
        
        .marker-position {
                position: absolute;
                bottom: 35px;
                left: 0;
                z-index: 999;
                padding: 10px;
                font-weight: 700;
                background-color: #fff;
        }
        </style> `
}
// 

window.initCustomTag = mapCtag

