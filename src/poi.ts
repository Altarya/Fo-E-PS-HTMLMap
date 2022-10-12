import * as Config from './config'
import * as toml from '@iarna/toml'
import * as L from "leaflet"

require('./search.ts')

var capitals = new L.FeatureGroup(); //Level 0
var cities = new L.FeatureGroup(); //Level 1
var settlements = new L.FeatureGroup(); //Level 2
var intraSettlement = new L.FeatureGroup(); //Level 3
var locationsLayers = L.layerGroup([capitals, cities, settlements, intraSettlement])

function zoomCheck(mapVar: L.Map) {
    if (mapVar.hasLayer(locationsLayers)) {
        let zoom = mapVar.getZoom()
        mapVar.addLayer(capitals);
        if (zoom > 0){
            mapVar.addLayer(cities);
        }
        else {
            mapVar.removeLayer(cities);
        }
        if (zoom > 2){
            mapVar.addLayer(settlements);
        }
        else {
            mapVar.removeLayer(settlements);
        }
        if (zoom > 4){
            mapVar.addLayer(intraSettlement);
        }
        else {
            mapVar.removeLayer(intraSettlement);
        }
    }
}

export function setupPOI(mapVar: L.Map, layerController: L.Control.Layers) {

    layerController.addOverlay(locationsLayers, "Locations")

    mapVar.on('zoomend', function() {
        zoomCheck(mapVar)
    });
    mapVar.on('overlayadd', function() {
        zoomCheck(mapVar)
    });
    fetch(Config.configPath+"main.toml").then((response => {
        if (response.ok) {
            return response.blob()
        }
        }))
        .then((result) => {
            result.text().then(response => {
                try {
                    const parsed = toml.parse(response);

                    const map = new Map(Object.entries(parsed));
                    console.log(map);

                    const PATH = new Map(Object.entries(map.get("PATH")))
                    const poiList = new Map(Object.entries(PATH.get("poi_list")))
                    for (let entry of Array.from(poiList.entries())) {
                        let key = entry[0];
                        let value = entry[1];
                        console.log(key+" "+value)

                        fetch(Config.poiPath+value+".toml").then((response => {
                            if (response.ok) {
                                return response.blob()
                            }
                            }))
                            .then((result) => {
                                result.text().then(response => {
                                    try {
                                        var parsed = toml.parse(response);

                                        const pois = new Map(Object.entries(parsed));
                                        console.log(pois);

                                        for (let entry of Array.from(pois.entries())) {
                                            let key = entry[0];
                                            let value = entry[1];
                                            console.log(key+" "+value)

                                            const entm = new Map(Object.entries(pois.get(key)))
                                            const ent = Array.from(entm.entries())

                                            console.log(ent);

                                            const name = ent[0]
                                            const classNamev = ent[1]
                                            const lat = ent[2]
                                            const lng = ent[3]
                                            const zoom_level = ent[4]

                                            const label = L.tooltip({className: classNamev[1], permanent: true}).setLatLng((new L.LatLng(lat[1], lng[1]))).setContent(name[1])

                                            var marker = L.marker(
                                                (new L.LatLng(lat[1], lng[1])), {
                                                    title: name[1]
                                                }
                                            ).bindTooltip(label)

                                            switch (zoom_level[1]) {
                                                case 1:
                                                    cities.addLayer(marker);
                                                    break;
                                                case 2:
                                                    settlements.addLayer(marker);
                                                    break;
                                                case 3:
                                                    intraSettlement.addLayer(marker);
                                                    break;
                                                default:
                                                    capitals.addLayer(marker);
                                                    break;
                                            }
                                        }
                                    } catch (error) {
                                        console.error("Parsing error on line " + error.line + ", column " + error.column + ": " + error.message);
                                    }
                                }
                            )
                        })
                    }
                } catch (error) {
                    console.error("Parsing error on line " + error.line + ", column " + error.column + ": " + error.message);
                }
            }
        )
    })
    return locationsLayers
}