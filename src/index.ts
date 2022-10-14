//import * as L from "leaflet"
import { LatLngBounds, LatLngBoundsExpression, LatLngExpression, LeafletMouseEvent, ImageOverlayOptions } from "leaflet";
import { setupPOI } from "./poi";

var L = require('leaflet')
require('./search.ts')

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
//searchLayer is a L.LayerGroup contains searched markers

console.log("Loaded Search")
