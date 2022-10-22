import * as L from "leaflet"
import { LatLngBounds, LatLngBoundsExpression, LatLngExpression, LeafletMouseEvent, ImageOverlayOptions } from "leaflet";
import { setupPOI } from "./poi";
import * as Config from './config'
import * as toml from '@iarna/toml'
import saveAs from "file-saver";
import { setupFeatures } from "./features";
import { setupLayers } from "./layers";

var Lextra: any;
let centerOfMap = new L.LatLng(3374, 3339)
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
    crs: L.CRS.Simple,
    center: centerOfMap,
    zoom: 0,
    minZoom: -3
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

                var southWest: LatLngExpression = new L.LatLng(0, 0)
                var northEast: LatLngExpression = new L.LatLng(mapSize[0], mapSize[1])

                L.imageOverlay(
                    './assets/layers/terrain.webp', 
                    L.latLngBounds( southWest, northEast),
                    {
                        zIndex: 0
                    }
                ).addTo(map)

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
                    .bindPopup(e.latlng.lat + " " + e.latlng.lng + " Latitude and Longitude")
                    .addTo(map)
                    .openPopup();
                });
                locMarker.on('drag', (e: LeafletMouseEvent) => {
                    locMarker.setLatLng(e.latlng)
                    .bindPopup(e.latlng.lat + " " + e.latlng.lng + " Latitude and Longitude")
                    .addTo(map)
                    .openPopup();
                });

                var poiLayer = setupPOI(map, layerController, mainConfigMap);
                var featuresLayer = setupFeatures(layerController, mainConfigMap);

                var searchLayers = L.layerGroup([poiLayer, featuresLayer])
                map.addControl( new Lextra.Control.Search({layer: searchLayers, zoom: 5, initial: false}) );
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
                        factor: 0.05,               // This value will be used to convert from kilometers. Example: 1000 (from kilometers to meters)  
                        label: 'Distance:'           
                    },
                    angleUnit: {
                        display: '&deg;',           // This is the display value will be shown on the screen. Example: 'Gradian'
                        decimal: 2,                 // Bearing result will be fixed to this value.
                        factor: 0.05,                // This option is required to customize angle unit. Specify solid angle value for angle unit. Example: 400 (for gradian).
                        label: 'Bearing:'
                    }
                };
                Lextra.control.ruler(options).addTo(map);
                console.log("Loaded Ruler")

                const isPartyEnabled: boolean = CONFIG.get("enable_party_indicator")

                    if (isPartyEnabled) {
                        const defaultPos: [number, number] = CONFIG.get("default_party_indicator")

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

            } catch (error) {
                console.error("Parsing error on line " + error.line + ", column " + error.column + ": " + error.message);
            }
        }
    )
})
