import * as L from "leaflet"
import { LatLngBounds, LatLngBoundsExpression, LatLngExpression, LeafletMouseEvent, ImageOverlayOptions } from "leaflet";
import { setupPOI } from "./poi";
import * as Config from './config'
import * as toml from '@iarna/toml'
import saveAs from "file-saver";
import { setupFeatures } from "./features";
import { setupLayers } from "./layers";
import { setupRivers } from "./river";
import { setupLines } from "./lines";
import terminator from "./daynight";
import AutoGraticule from "leaflet-auto-graticule";
import betterscale from "./scalebar";

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

            const mainConfigParsed = toml.parse(response)
            const mainConfigMap = new Map(Object.entries(mainConfigParsed))

            const CONFIG = new Map(Object.entries(mainConfigMap.get("CONFIG")))

            try {

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
                    .bindPopup(e.latlng.lat + ", " + e.latlng.lng + " Lat and Lng<p>" + ((e.latlng.lat+90)/180)*mapSize[0]+ ", " + ((e.latlng.lat+180)/360)*mapSize[1]+" X/Y</p>")
                    .addTo(map)
                    .openPopup();
                });
                locMarker.on('drag', (e: LeafletMouseEvent) => {
                    locMarker.setLatLng(e.latlng)
                    .bindPopup(e.latlng.lat + ", " + e.latlng.lng + " Lat and Lng<p>" + ((e.latlng.lat+90)/180)*mapSize[0]+ ", " + ((e.latlng.lat+180)/360)*mapSize[1]+" X/Y</p>") 
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

            } catch (error) {
                console.error("Parsing error on line " + error.line + ", column " + error.column + ": " + error.message);
            }
        }
    )
})
