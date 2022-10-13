//import * as L from "leaflet"
import { LatLngBounds, LatLngBoundsExpression, LatLngExpression, LeafletMouseEvent, ImageOverlayOptions } from "leaflet";
import { setupPOI } from "./poi";

var L = require('leaflet')
require('./search.ts')

fetch("./assets/layers/tropics.svg").then((response => {
    if (response.ok) {
        return response.blob()
    }
    }))
    .then((result) => {
        result.text().then(response => {

            fetch("./assets/layers/continentsoceans.svg").then((response => {
                if (response.ok) {
                    return response.blob()
                }
                }))
                .then((result) => {
                    result.text().then(response => {

                        let map = new L.Map('map', {
                            crs: L.CRS.Simple,
                            center: new L.LatLng(3374, 3339),
                            zoom: 0,
                            minZoom: -3
                        });
                        
                        var layerController = L.control.layers().addTo(map)
                        
                        var southWest: LatLngExpression = new L.LatLng(0, 0)
                        var northEast: LatLngExpression = new L.LatLng(5120, 9728)
                        
                        var terrain = L.imageOverlay(
                            './assets/layers/terrain.webp', 
                            L.latLngBounds( southWest, northEast),
                            {
                                zIndex: 0
                            }
                        ).addTo(map)

                        var municipalities = L.imageOverlay(
                            './assets/layers/municipalities.webp', 
                            L.latLngBounds( southWest, northEast),
                            {
                                zIndex: 1
                            }
                        )
                        var states = L.imageOverlay(
                            './assets/layers/states.webp', 
                            L.latLngBounds( southWest, northEast),
                            {
                                zIndex: 2
                            }
                        )

                        var tropicsParse = new DOMParser()
                        var tropicsDoc = tropicsParse.parseFromString(response, "image/svg+xml")
                        var tropicsElem:SVGAElement = <SVGAElement>tropicsDoc.getElementsByTagNameNS("http://www.w3.org/2000/svg", "svg").item(0);

                        var tropics = L.svgOverlay(
                            tropicsElem,
                            L.latLngBounds( southWest, northEast),
                            {
                                zIndex: 3
                            }
                        )

                        var continentsParse = new DOMParser()
                        var continentsDoc = continentsParse.parseFromString(response, "image/svg+xml")
                        var continentsElem:SVGAElement = <SVGAElement>continentsDoc.getElementsByTagNameNS("http://www.w3.org/2000/svg", "svg").item(0);

                        var continents = L.svgOverlay(
                            continentsElem,
                            L.latLngBounds( southWest, northEast),
                            {
                                zIndex: 3
                            }
                        )

                        layerController.addOverlay(municipalities, "Municipalities, Sub-states and Sea Regions")
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
                    })
                }
            )
        })
    }
)


