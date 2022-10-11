import * as L from "leaflet";
import { LatLngBounds, LatLngBoundsExpression, LatLngExpression, LeafletMouseEvent, ImageOverlayOptions } from "leaflet";

let map = new L.Map('map', {
    crs: L.CRS.Simple,
    center: new L.LatLng(3374, 3339),
    zoom: 1,
    minZoom: -3
});

var southWest: LatLngExpression = new L.LatLng(0, 0)
var northEast: LatLngExpression = new L.LatLng(5120, 9728)

var terrain = L.imageOverlay(
    './assets/layers/terrain.webp', 
    L.latLngBounds( southWest, northEast),
    {
        zIndex: 0
    }
).addTo(map)

//map.fitBounds(L.latLngBounds( southWest, northEast));
//map.fitWorld()

map.on('click', (e: LeafletMouseEvent) => {
    let marker = L.marker(e.latlng)
    
    .bindPopup("You clicked the map at " + e.latlng.toString())
    .addTo(map)
    .openPopup();
});

