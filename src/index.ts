import * as L from "leaflet"
import * as Cesium from "cesium"
import { LatLngBounds, LatLngBoundsExpression, LatLngExpression, LeafletMouseEvent, ImageOverlayOptions } from "leaflet"
import { setupPOI, setupPOICesium } from "./poi"
import * as Config from './config'
import * as toml from '@iarna/toml'
import saveAs from "file-saver"
import { setupFeatures, setupFeaturesCesium } from "./features"
import { setupLayers } from "./layers"
import { setupRivers } from "./river"
import { setupLines } from "./lines"
import terminator from "./daynight"
import AutoGraticule from "leaflet-auto-graticule"
import betterscale from "./scalebar"
import makeSlider from "./slider"
import htmllegend from "./htmllegend"
import { ThreeDButton } from "./threedbutton"

var Lextra: any
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
})

if (typeof exports === 'object') {
    Lextra = require('leaflet')
} else {
    if(typeof window.L === 'undefined')
        throw 'Leaflet must be loaded first'
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
            const PATH = new Map(Object.entries(mainConfigMap.get("PATH")))

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

                var htmlLegendLayers = htmllegend({
                    position: 'topright',
                    disableVisibilityControls: true,
                    collapsedOnInit: true
                })
                htmlLegendLayers.addTo(map)
                htmlLegendLayers.addLegend({
                    name: "Legend",
                    layer: terrainMinimap,
                    elements: [{
                        html: "Legends go here"
                    }]
                })
                fetch(PATH.get("terrain_legend")).then((response => {
                    if (response.ok) {
                        return response.blob()
                    }
                    }))
                    .then((result) => {
                        result.text().then(response => {
                        htmlLegendLayers.addLegend({
                            name: "Terrain",
                            layer: terrain,
                            elements: [{
                                html: response
                            }]
                        })
                    })
                })
                setupLayers(map, layerController, southWest, northEast, htmlLegendLayers)

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
                })

                map.on('click', (e: LeafletMouseEvent) => {
                    locMarker.setLatLng(e.latlng)
                    .bindPopup(e.latlng.lat + ", " + e.latlng.lng + " Lat and Lng<p>" + ((e.latlng.lat+90)/180)*mapSize[0]+ ", " + ((e.latlng.lng+180)/360)*mapSize[1]+" X/Y</p>")
                    .addTo(map)
                    .openPopup()
                })
                locMarker.on('drag', (e: LeafletMouseEvent) => {
                    locMarker.setLatLng(e.latlng)
                    .bindPopup(e.latlng.lat + ", " + e.latlng.lng + " Lat and Lng<p>" + ((e.latlng.lat+90)/180)*mapSize[0]+ ", " + ((e.latlng.lng+180)/360)*mapSize[1]+" X/Y</p>") 
                    .addTo(map)
                    .openPopup()
                })

                layerController.addBaseLayer(terrain, "Terrain")

                var poiLayer = setupPOI(map, layerController, mainConfigMap, mapSize)
                fetch(PATH.get("poi_legend")).then((response => {
                    if (response.ok) {
                        return response.blob()
                    }
                    }))
                    .then((result) => {
                        result.text().then(response => {
                        htmlLegendLayers.addLegend({
                            name: "Locations",
                            layer: poiLayer,
                            elements: [{
                                html: response
                            }]
                        })
                    })
                })
                var featuresLayer = setupFeatures(layerController, mainConfigMap, mapSize)
                fetch(PATH.get("features_legend")).then((response => {
                    if (response.ok) {
                        return response.blob()
                    }
                    }))
                    .then((result) => {
                        result.text().then(response => {
                        htmlLegendLayers.addLegend({
                            name: "Features",
                            layer: featuresLayer,
                            elements: [{
                                html: response
                            }]
                        })
                    })
                })
                var riversLayer = setupRivers(layerController, mainConfigMap, mapSize)
                var linesLayer = setupLines(layerController, mainConfigMap, mapSize, htmlLegendLayers).addTo(map)

                var searchLayers = L.layerGroup([poiLayer, featuresLayer])
                map.addControl( new Lextra.Control.Search({layer: searchLayers, zoom: 10, initial: false}) )
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
                        display: '&deg',           // This is the display value will be shown on the screen. Example: 'Gradian'
                        decimal: 2,                 // Bearing result will be fixed to this value.
                        factor: 1,                // This option is required to customize angle unit. Specify solid angle value for angle unit. Example: 400 (for gradian).
                        label: 'Bearing:'
                    }
                }
                Lextra.control.ruler(options).addTo(map)
                console.log("Loaded Ruler")

                Lextra.control.MiniMap(terrainMinimap, {
                    position: 'bottomright',
                    toggleDisplay: true,
                    zoomAnimation: true,
                    zoomLevelFixed: true,
                    zoomLevelOffset: -5
                }).addTo(map)

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
                            saveAs(new File([serialPos], "party-pos.toml", {type: "text/plaincharset=utf-8"}))
                        })
                    }

                    fetch("./party-pos.toml").then((response => {
                        if (response.ok) {
                            return response.blob()
                        }
                        }))
                        .then((result) => {
                            result.text().then(response => {
                                const posParsed = toml.parse(response)
                                const posParsedMap = new Map(Object.entries(posParsed))
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
                        saveAs(new File([serialPos], "party-pos.toml", {type: "text/plaincharset=utf-8"}))
                    })
                }

                var daynight = terminator({
                    interactive: true
                })

                layerController.addOverlay(daynight, "Day/Night")
                
                const dayone = <number>CONFIG.get("julian_first_day")
                const daylast = <number>CONFIG.get("julian_last_day")
                var currentTime = new Date()
                var currentLeg = 1
                const slider = function () {}

                const saveButton = L.Control.extend({
                    onAdd: function(map: L.Map) {
                        var button = document.createElement('button')
                        button.type = 'button'
                        button.className = 'leaftlet-button'
                        button.onclick = function() {
                            let serialTime = 
                            "time = '" +
                            currentTime.toISOString() + 
                            "'"
                        saveAs(new File([serialTime], "time.toml", {type: "text/plaincharset=utf-8"}))
                        }
                        button.textContent = 'Save Time'

                        return button
                    },
                })

                const saveButtonVar = new saveButton({
                    position: "topleft"
                })

                var htmlLegendDayNight = htmllegend({
                    position: 'topleft',
                    disableVisibilityControls: true
                })
                htmlLegendDayNight.addTo(map)
                htmlLegendDayNight.addLegend({
                    name: "Time",
                    layer: daynight,
                    elements: [{
                        html: "<p>"+currentTime.toDateString()+" "+currentTime.getHours()+":"+currentTime.getMinutes()+"</p>"
                    }]
                })

                fetch("./time.toml").then((response => {
                    if (response.ok) {
                        return response.blob()
                    }
                    }))
                    .then((result) => {
                        result.text().then(response => {
                            const timeParsed = toml.parse(response)
                            const timeParsedMap = new Map(Object.entries(timeParsed))
                            const time: string = <any>timeParsedMap.get("time")
                            currentTime = new Date(Date.parse(time))
                            let currentMilis = (currentTime.getTime() / 86400000) + 2440587.5 + 0.125
                            var timeSlider = makeSlider(slider, {
                                size: '1000px',
                                position: 'bottomleft',
                                min: dayone,
                                max: daylast,
                                step: 0.005,
                                id: "slider",
                                value: currentMilis,
                                collapsed: false,
                                title: 'Time Slider',
                                logo: 'T',
                                orientation: 'horizontal',
                                increment: true,
                                getValue: function(value: any) {
                                    var millis = (parseFloat(value) - 2440587.5) * 86400000
                                    currentTime = new Date(millis)
                                    htmlLegendDayNight.removeLegend(currentLeg)
                                    htmlLegendDayNight.addLegend({
                                        name: "Time",
                                        //layer: daynight,
                                        elements: [{
                                            html: "<p>"+currentTime.toDateString()+" "+currentTime.getHours()+":"+currentTime.getMinutes()+"</p>"
                                        }]
                                    })
                                    currentLeg++
                                    daynight.setTime(new Date(millis))
                                    return value
                                },
                                showValue: true,
                            })

                            daynight.on('add', function() {
                                if (currentLeg) {
                                    currentLeg = 0
                                }
                                htmlLegendDayNight.addTo(map)
                                timeSlider.addTo(map)
                                saveButtonVar.addTo(map)
                                //htmlLegendDayNight.addTo(map)
                            })
                            daynight.on('remove', function() {
                                map.removeControl(timeSlider)
                                map.removeControl(saveButtonVar)
                                map.removeControl(htmlLegendDayNight)
                                //htmlLegendDayNight.remove()
                            })
                        })
                    }
                )
                .catch(error => {
                    console.log("No time.toml file found, will use current date")
                    let currentMilis = (currentTime.getTime() / 86400000) + 2440587.5 + 0.125
                    var timeSlider = makeSlider(slider, {
                        size: '1000px',
                        position: 'bottomleft',
                        min: dayone,
                        max: daylast,
                        step: 0.005,
                        id: "slider",
                        value: currentMilis,
                        collapsed: false,
                        title: 'Time Slider',
                        logo: 'T',
                        orientation: 'horizontal',
                        increment: true,
                        getValue: function(value: any) {
                            var millis = (parseFloat(value) - 2440587.5) * 86400000
                            currentTime = new Date(millis)
                            htmlLegendDayNight.removeLegend(currentLeg)
                            htmlLegendDayNight.addLegend({
                                name: "Time",
                                layer: daynight,
                                elements: [{
                                    html: "<p>"+currentTime.toDateString()+" "+currentTime.getHours()+":"+currentTime.getMinutes()+"</p>"
                                }]
                            })
                            currentLeg++
                            daynight.setTime(new Date(millis))
                            return value
                        },
                        showValue: true,
                    })

                    daynight.on('add', function() {
                        timeSlider.addTo(map)
                        saveButtonVar.addTo(map)
                    })
                    daynight.on('remove', function() {
                        map.removeControl(timeSlider)
                        map.removeControl(saveButtonVar)
                    })
                })

                var graticule = new AutoGraticule()

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
                    }).addTo(map)
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

                    const LabelCollectionGeocoder: any = function(): void {}
                    LabelCollectionGeocoder.prototype.geocode = function (viewModel: string, geocodeType: number) {
                        var searchtext = viewModel
                        var searchlist: any[] = []

                        var plen = viewer.scene.primitives.length
                        for (var i = 0; i < plen; ++i) {
                            var l: Cesium.PrimitiveCollection = viewer.scene.primitives.get(i) 
                            if (l.constructor.name == "PrimitiveCollection") {
                                var gcLC = l.get(0)
                                var len = gcLC.length
                                for (var j = 0; j < len; ++j) {
                                    var ld: any = gcLC.get(j)._labelCollection._labels
                                    for (let i = 0; i < ld.length; i++) {
                                        const element = ld[i]
                                        if ( element.text.toLowerCase().indexOf( searchtext.toLowerCase() ) > -1 ) {
                                            searchlist.push(element)
                                        }
                                    }
                                }
                            }
                        }

                        return Cesium.Resource.fetch({
                            url: "",
                        }).then(function (results: any) {
                                return searchlist.map(function (resultObject) {
                                    var lonlat = Cesium.Ellipsoid.WGS84.cartesianToCartographic(resultObject.position)
                                    var heightmin = 10000
                                    var heightmax = 10000
                                    if (resultObject.distanceDisplayCondition.near) heightmin = resultObject.distanceDisplayCondition.near/100
                                    if (resultObject.distanceDisplayCondition.far) heightmax = resultObject.distanceDisplayCondition.far/100
                                    var horizdeg = Math.sqrt(0.5*6371000*(heightmax+heightmin)/10)/111000
                                    var nwlat = lonlat.latitude + Math.PI/180*horizdeg/2; if (nwlat > Math.PI/2) nwlat=(nwlat/Math.PI/2) % 1 * Math.PI/2
                                    var nwlon = lonlat.longitude + Math.PI/360*horizdeg; if (nwlon > Math.PI) nwlon=(nwlon/Math.PI - 1) % 1 * Math.PI
                                    var swlat = lonlat.latitude - Math.PI/180*horizdeg/2; if (swlat < -Math.PI/2) swlat=(swlat/Math.PI/2) % 1 * Math.PI/2
                                    var swlon = lonlat.longitude - Math.PI/360*horizdeg; if (swlon < -Math.PI) swlon=(swlon/Math.PI + 1) % 1 * Math.PI
                                    var carto = [
                                            new Cesium.Cartographic(swlon, swlat, heightmin),
                                            new Cesium.Cartographic(nwlon, nwlat, heightmax)
                                                ]
                                    var recto = Cesium.Rectangle.fromCartographicArray(carto)
                                    var returnObject =  {
                                        displayName: resultObject.text,
                                        destination: recto
                                    }
                                    return returnObject
                                })
                            }
                        )
                    }

                    const viewer = new Cesium.Viewer('map2', {
                        //terrainProvider: Cesium.createWorldTerrain(
                        imageryProvider: terrainc,
                        baseLayerPicker: false,
                        shadows: false,
                        projectionPicker: true,
                        geocoder: new LabelCollectionGeocoder(),
                        //geocoder: false,
                        sceneModePicker: true,
                        timeline: false,
                    })
                    var poi = viewer.entities

                    setupPOICesium(poi, mainConfigMap, mapSize)
                    setupFeaturesCesium(poi, mainConfigMap, mapSize)

                    var button = document.createElement('button')
                    button.type = 'button'
                    button.className = 'cesium-button'
                    button.onclick = function() {
                        var mapC = document.getElementById("map2")
                        mapC.style.height = "0%"
                        mapC.style.width = "0%"
                        var mapL = document.getElementById("map")
                        mapL.style.height = "100%"
                        mapL.style.width = "100%"
                    }
                    button.textContent = '2D'
                    document.getElementsByClassName('cesium-viewer-toolbar').item(0).appendChild(button)

                    ThreeDButton({
                        position: "topleft"
                    }).addTo(map)
                }

            //} catch (error) {
            //    console.error("Parsing error on line " + error.line + ", column " + error.column + ": " + error.message)
            //}
        }
    )
})
