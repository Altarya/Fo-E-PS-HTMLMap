import * as L from "leaflet"
import * as Cesium from "cesium"
import { LatLngBounds, LatLngBoundsExpression, LatLngExpression, LeafletMouseEvent, ImageOverlayOptions } from "leaflet";
import { setupPOI, setupPOICesium } from "./poi";
import * as Config from './config'
import * as toml from '@iarna/toml'
import saveAs from "file-saver";
import { setupFeatures, setupFeaturesCesium } from "./features";
import { setupLayers } from "./layers";
import { setupRivers } from "./river";
import { setupLines } from "./lines";
import terminator from "./daynight";
import AutoGraticule from "leaflet-auto-graticule";
import betterscale from "./scalebar";
import makeSlider from "./slider";
import htmllegend from "./htmllegend";
import { ThreeDButton } from "./threedbutton";

var Lextra: any;
let centerOfMap = new L.LatLng(0, 0)
let partyIcon = new L.Icon({
    iconSize:     [48, 48],
    shadowSize:   [0, 0],
    iconAnchor:   [24, 24],
    shadowAnchor: [0, 0],
    tooltipAnchor:  [16, 0],
    iconUrl: "./assets/icons/ui/party.webp",
    className: "party-indicator"
})
let tooltip = L.tooltip({className: "party-indicator"}).setContent("Party Location")
var markerParty = L.marker(centerOfMap, {
    icon: partyIcon,
    draggable: true,
    title: "Party Location",
}).bindTooltip(tooltip)
var map = new L.Map('map', {
    //crs: L.CRS.Simple,
    crs: L.CRS.EPSG4326,
    center: centerOfMap,
    zoom: 5,
    minZoom: 2
});

if (typeof exports === 'object') {
    Lextra = require('leaflet');
} else {
    if(typeof window.L === 'undefined')
        throw 'Leaflet must be loaded first';
    Lextra = L
}

require('./search.ts')
require('./ruler.ts')
require('./minimap.ts')
require('./river.ts')

fetch(Config.configPath+"main.toml").then((response => {
    if (response.ok) {
        return response.blob()
    }
    }))
    .then((result) => {
        result.text().then(response => {
            /****** LEAFLET  ******/
            const mainConfigParsed = toml.parse(response)
            const mainConfigMap = new Map(Object.entries(mainConfigParsed))

            const CONFIG = new Map(Object.entries(mainConfigMap.get("CONFIG")))

            //try {

                var layerController = L.control.layers().addTo(map)

                let mapSize: [number, number] = CONFIG.get("map_size")

                var southWest: LatLngExpression = new L.LatLng(-90, -180)
                var northEast: LatLngExpression = new L.LatLng(90, 180)

                const terrain = L.imageOverlay(
                    './assets/layers/terrain.webp', 
                    L.latLngBounds( southWest, northEast),
                    {
                        zIndex: 0
                    }
                ).addTo(map)

                const terrainMinimap = L.imageOverlay(
                    './assets/layers/terrain.webp', 
                    L.latLngBounds( southWest, northEast),
                    {
                        zIndex: 0
                    }
                )

                setupLayers(map, layerController, southWest, northEast)

                let locMarkerIcon = new L.Icon({
                    iconSize:     [24, 24],
                    shadowSize:   [0, 0],
                    iconAnchor:   [12, 12],
                    shadowAnchor: [0, 0],
                    iconUrl: "./assets/icons/ui/click-location-indicator.webp",
                    className: "click-location-indicator"
                })

                let locMarker = L.marker(centerOfMap, {
                    icon: locMarkerIcon,
                    draggable: true
                });

                map.on('click', (e: LeafletMouseEvent) => {
                    locMarker.setLatLng(e.latlng)
                    .bindPopup(e.latlng.lat + ", " + e.latlng.lng + " Lat and Lng<p>" + ((e.latlng.lat+90)/180)*mapSize[0]+ ", " + ((e.latlng.lng+180)/360)*mapSize[1]+" X/Y</p>")
                    .addTo(map)
                    .openPopup();
                });
                locMarker.on('drag', (e: LeafletMouseEvent) => {
                    locMarker.setLatLng(e.latlng)
                    .bindPopup(e.latlng.lat + ", " + e.latlng.lng + " Lat and Lng<p>" + ((e.latlng.lat+90)/180)*mapSize[0]+ ", " + ((e.latlng.lng+180)/360)*mapSize[1]+" X/Y</p>") 
                    .addTo(map)
                    .openPopup();
                });

                layerController.addBaseLayer(terrain, "Terrain")

                var poiLayer = setupPOI(map, layerController, mainConfigMap, mapSize)
                var featuresLayer = setupFeatures(layerController, mainConfigMap, mapSize)
                var riversLayer = setupRivers(layerController, mainConfigMap, mapSize)
                var linesLayer = setupLines(layerController, mainConfigMap, mapSize).addTo(map)

                var searchLayers = L.layerGroup([poiLayer, featuresLayer])
                map.addControl( new Lextra.Control.Search({layer: searchLayers, zoom: 10, initial: false}) );
                console.log("Loaded Search")

                var options = {
                    position: 'topleft',
                    circleMarker: {               // Leaflet circle marker options for points used in this plugin
                        color: 'red',
                        radius: 2
                    },
                    lineStyle: {                  // Leaflet polyline options for lines used in this plugin
                        color: 'red',
                        dashArray: '1,6'
                    },
                    lengthUnit: {                 // You can use custom length units. Default unit is kilometers.
                        display: 'km',              // This is the display value will be shown on the screen. Example: 'meters'
                        decimal: 2,                 // Distance result will be fixed to this value. 
                        factor: 1,               // This value will be used to convert from kilometers. Example: 1000 (from kilometers to meters)  
                        label: 'Distance:'           
                    },
                    angleUnit: {
                        display: '&deg;',           // This is the display value will be shown on the screen. Example: 'Gradian'
                        decimal: 2,                 // Bearing result will be fixed to this value.
                        factor: 1,                // This option is required to customize angle unit. Specify solid angle value for angle unit. Example: 400 (for gradian).
                        label: 'Bearing:'
                    }
                };
                Lextra.control.ruler(options).addTo(map);
                console.log("Loaded Ruler")

                Lextra.control.MiniMap(terrainMinimap, {
                    position: 'bottomright',
                    toggleDisplay: true,
                    zoomAnimation: true,
                    zoomLevelFixed: true,
                    zoomLevelOffset: -5
                }).addTo(map);

                const isPartyEnabled: boolean = CONFIG.get("enable_party_indicator")

                if (isPartyEnabled) {
                    let defaultPos: [number, number] = CONFIG.get("default_party_indicator")

                    defaultPos[0] = ((defaultPos[0]/mapSize[0])*180)-90
                    defaultPos[1] = ((defaultPos[1]/mapSize[1])*360)-180

                    markerParty.setLatLng(defaultPos).addTo(map)

                    searchLayers.addLayer(markerParty)

                    map.setView(defaultPos)

                    const isPartyDragEnabled: boolean = CONFIG.get("enable_party_indicator_save_on_drag")

                    if (isPartyDragEnabled) {
                        markerParty.on('dragend', (e: LeafletMouseEvent) => {
                            let pos = markerParty.getLatLng()
                            let serialPos = 
                                "position = [\n" +
                                pos.lat + ",\n" +
                                pos.lng + "\n" +
                                "]\n"
                            saveAs(new File([serialPos], "party-pos.toml", {type: "text/plain;charset=utf-8"}));
                        })
                    }

                    fetch("./party-pos.toml").then((response => {
                        if (response.ok) {
                            return response.blob()
                        }
                        }))
                        .then((result) => {
                            result.text().then(response => {
                                const posParsed = toml.parse(response);
                                const posParsedMap = new Map(Object.entries(posParsed));
                                const pos: [number, number] = <any>posParsedMap.get("position")

                                markerParty.setLatLng(pos)
                                map.setView(pos)
                            })
                        }
                    )

                    markerParty.on('click', (e: LeafletMouseEvent) => {
                        let pos = markerParty.getLatLng()
                        let serialPos = 
                            "position = [\n" +
                            pos.lat + ",\n" +
                            pos.lng + "\n" +
                            "]\n"
                        saveAs(new File([serialPos], "party-pos.toml", {type: "text/plain;charset=utf-8"}));
                    })
                }

                var daynight = terminator({
                    interactive: true
                })

                layerController.addOverlay(daynight, "Day/Night")

                const dayone = 2478938.50000
                const daylast = 2479303.49999
                var currentTime = new Date()
                var currentLeg = 1
                const slider = function () {
                }
                var htmlLegend = htmllegend({
                    position: 'topleft',
                    disableVisibilityControls: true
                })
                htmlLegend.addTo(map)
                htmlLegend.addLegend({
                    name: "Time",
                    layer: daynight,
                    elements: [{
                        html: "<p>"+currentTime.toDateString()+"</p>"
                    }]
                })
                var timeSlider = makeSlider(slider, {
                    size: '1000px',
                    position: 'bottomleft',
                    min: dayone,
                    max: daylast,
                    step: 0.005,
                    id: "slider",
                    value: dayone,
                    collapsed: false,
                    title: 'Time Slider',
                    logo: 'T',
                    orientation: 'horizontal',
                    increment: true,
                    getValue: function(value: any) {
                        var millis = (parseFloat(value) - 2440587.5) * 86400000
                        currentTime = new Date(millis)
                        htmlLegend.removeLegend(currentLeg)
                        htmlLegend.addLegend({
                            name: "Time",
                            layer: daynight,
                            elements: [{
                                html: "<p>"+currentTime.toDateString()+"</p>"
                            }]
                        })
                        currentLeg++
                        daynight.setTime(new Date(millis))
                        return value;
                    },
                    showValue: true,
                })

                daynight.on('add', function() {
                    timeSlider.addTo(map)
                });
                daynight.on('remove', function() {
                    map.removeControl(timeSlider)
                });

                var graticule = new AutoGraticule();

                layerController.addOverlay(graticule, "Lat/Lng Graticule")

                const isBetterscaleEnabled: boolean = CONFIG.get("enable_better_scalebar")
                if (isBetterscaleEnabled) {
                    betterscale({
                        metric: 1,
                        imperial: 0
                    }).addTo(map)
                }

                const isScaleEnabled: boolean = CONFIG.get("enable_leaflet_scalebar")
                if (isScaleEnabled) {
                    L.control.scale({
                        imperial: false
                    }).addTo(map);
                }


                /******* CESIUM *******/
                const isGlobeEnabled: boolean = CONFIG.get("enable_globe")
                if (isGlobeEnabled) {
                    const terrainc = new Cesium.SingleTileImageryProvider({
                        url: './assets/layers/terrain.webp',
                        rectangle: new Cesium.Rectangle(-Math.PI, -Math.PI/2, Math.PI, Math.PI/2),
                    })
                    terrainc.defaultMagnificationFilter = Cesium.TextureMagnificationFilter.NEAREST
                    terrainc.defaultMinificationFilter = Cesium.TextureMinificationFilter.NEAREST

                    //const layersc = new Cesium.ImageryLayerCollection()
                    //layersc.addImageryProvider(terrainc)

                    const viewer = new Cesium.Viewer('map2', {
                        //terrainProvider: Cesium.createWorldTerrain(
                        imageryProvider: terrainc,
                        baseLayerPicker: false,
                        shadows: false,
                        projectionPicker: true,
                        //geocoder: new LabelCollectionGeocoder(),
                        geocoder: false,
                        sceneModePicker: true,
                        timeline: false,
                    });
                    var poi = viewer.entities

                    setupPOICesium(poi, mainConfigMap, mapSize)
                    setupFeaturesCesium(poi, mainConfigMap, mapSize)

                    var button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'cesium-button';
                    button.onclick = function() {
                        var mapC = document.getElementById("map2");
                        mapC.style.height = "0%"
                        mapC.style.width = "0%"
                        var mapL = document.getElementById("map");
                        mapL.style.height = "100%"
                        mapL.style.width = "100%"
                    };
                    button.textContent = '2D';
                    document.getElementsByClassName('cesium-viewer-toolbar').item(0).appendChild(button);

                    ThreeDButton({
                        position: "topleft"
                    }).addTo(map)
                }

            //} catch (error) {
            //    console.error("Parsing error on line " + error.line + ", column " + error.column + ": " + error.message);
            //}
        }
    )
})
