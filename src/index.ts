//import * as L from "leaflet"
import { LatLngBounds, LatLngBoundsExpression, LatLngExpression, LeafletMouseEvent, ImageOverlayOptions } from "leaflet";
import { setupPOI } from "./poi";

var L = require('leaflet')
require('./search.ts')
require('./ruler.ts')

let map = new L.Map('map', {
    crs: L.CRS.Simple,
    center: new L.LatLng(3374, 3339),
    zoom: 0,
    minZoom: -3
});

var layerController = L.control.layers().addTo(map)

var southWest: LatLngExpression = new L.LatLng(0, 0)
var northEast: LatLngExpression = new L.LatLng(5120, 9728)

L.imageOverlay(
    './assets/layers/terrain.webp', 
    L.latLngBounds( southWest, northEast),
    {
        zIndex: 0
    }
).addTo(map)

var statesFilled = L.imageOverlay(
    './assets/layers/statesfilled.webp', 
    L.latLngBounds( southWest, northEast),
    {
        zIndex: 1
    }
)
var municipalities = L.imageOverlay(
    './assets/layers/municipalities.webp', 
    L.latLngBounds( southWest, northEast),
    {
        zIndex: 2
    }
)
var states = L.imageOverlay(
    './assets/layers/states.webp', 
    L.latLngBounds( southWest, northEast),
    {
        zIndex: 3
    }
)
var tropics = L.imageOverlay(
    './assets/layers/tropics.webp', 
    L.latLngBounds( southWest, northEast),
    {
        zIndex: 4
    }
)
var continents = L.imageOverlay(
    './assets/layers/continentsoceans.webp', 
    L.latLngBounds( southWest, northEast),
    {
        zIndex: 5
    }
)

layerController.addOverlay(municipalities, "Municipalities, Sub-states and Sea Regions")
layerController.addOverlay(statesFilled, "Administrative Divisions(States) Filled")
layerController.addOverlay(states, "Administrative Divisions(States)")
layerController.addOverlay(tropics, "Tropics")
layerController.addOverlay(continents, "Continents and Oceans")

map.on('click', (e: LeafletMouseEvent) => {
    let marker = L.marker(e.latlng)
    
    .bindPopup("You clicked the map at " + e.latlng.toString())
    .addTo(map)
    .openPopup();
});

var poiLayer = setupPOI(map, layerController);

map.addControl( new L.Control.Search({layer: poiLayer, zoom: 5}) );
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
L.control.ruler(options).addTo(map);
console.log("Loaded Ruler")


