import * as Config from './config'
import * as toml from '@iarna/toml'
import * as L from "leaflet"

var capitals = new L.FeatureGroup(); //Level 0
var cities = new L.FeatureGroup(); //Level 1
var settlements = new L.FeatureGroup(); //Level 2
var intraSettlement = new L.FeatureGroup(); //Level 3
var locationsLayers = L.layerGroup([capitals, cities, settlements, intraSettlement])

function zoomCheck(mapVar: L.Map) {
    if (mapVar.hasLayer(locationsLayers)) {
        let zoom = mapVar.getZoom()
        mapVar.addLayer(capitals);
        if (zoom > 4){
            mapVar.addLayer(cities);
        }
        else {
            mapVar.removeLayer(cities);
        }
        if (zoom > 6){
            mapVar.addLayer(settlements);
        }
        else {
            mapVar.removeLayer(settlements);
        }
        if (zoom > 8){
            mapVar.addLayer(intraSettlement);
        }
        else {
            mapVar.removeLayer(intraSettlement);
        }
    }
}

export function setupPOI(mapVar: L.Map, layerController: L.Control.Layers, map: Map<string, toml.AnyJson>, mapSize: [number, number]) {

    var poiIcon: new(any: any) => L.Icon = L.Icon.extend({
        options: {
            iconSize:     [24, 24],
            shadowSize:   [0, 0],
            iconAnchor:   [12, 12],
            shadowAnchor: [0, 0],
            popupAnchor:  [8, 0],
            tooltipAnchor:  [8, 0]
        }
    });

    layerController.addOverlay(locationsLayers, "Locations")

    mapVar.on('zoomend', function() {
        zoomCheck(mapVar)
    });
    mapVar.on('overlayadd', function() {
        zoomCheck(mapVar)
    });

    //const map = new Map(Object.entries(parsed));
    //console.log(map);

    const PATH = new Map(Object.entries(map.get("PATH")))
    const poiList = new Map(Object.entries(PATH.get("poi_list")))
    const atribLists = new Array(PATH.get("atribution_list"))
    const realAtribList: [string] = atribLists[0]
    for (let entry of Array.from(poiList.entries())) {
        let key = entry[0];
        let value = entry[1];
        //console.log(key+" "+value)

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
                        //console.log(pois);

                        for (let entry of Array.from(pois.entries())) {
                            let key = entry[0];
                            let value = entry[1];
                            //console.log(key+" "+value)

                            const entm = new Map(Object.entries(pois.get(key)))
                            const ent = Array.from(entm.entries())

                            //console.log(ent);

                            if(ent.length == 8) {
                                const name: string = ent[0][1]
                                const classNamev: string = ent[1][1]
                                const lat: number = ((ent[2][1]/mapSize[0])*180)-90
                                const lng: number = ((ent[3][1]/mapSize[1])*360)-180
                                const zoom_level: number = ent[4][1]
                                const description: string = ent[5][1]
                                const link: string = ent[6][1]
                                const from: number = ent[7][1]

                                const label = L.tooltip({className: classNamev, permanent: true}).setLatLng((new L.LatLng(lat, lng))).setContent(name)

                                var marker = L.marker(
                                    (new L.LatLng(lat, lng)), {
                                        title: name
                                    }
                                ).bindTooltip(label)

                                let iconImage: string = ""
                                switch (zoom_level) {
                                    case 1:
                                        iconImage = "./assets/icons/poi/1.webp"
                                        cities.addLayer(marker);
                                        break;
                                    case 2:
                                        iconImage = "./assets/icons/poi/2.webp"
                                        settlements.addLayer(marker);
                                        break;
                                    case 3:
                                        iconImage = "./assets/icons/poi/3.webp"
                                        intraSettlement.addLayer(marker);
                                        break;
                                    default:
                                        iconImage = "./assets/icons/poi/0.webp"
                                        capitals.addLayer(marker);
                                        break;
                                }

                                let linkVar = ""
                                if (link.length) {
                                    linkVar = "<h2><a href='" + link + "'>Link</a></h2>"
                                }

                                let descVar = ""
                                if (description.length) {
                                    descVar = "<h2>Description</h2>" + description
                                }

                                let fromVar = ""
                                if (realAtribList[from].length && from < realAtribList.length) {
                                    fromVar = "<h2>From</h2>" + realAtribList[from]
                                }

                                marker.bindPopup("<h1>" + name + "</h1>" + descVar + linkVar + fromVar);

                                var Icon = new poiIcon({iconUrl: iconImage, className: classNamev})
                                marker.setIcon(Icon)
                            } else {
                                console.error("ERROR: Entry " + ent[0][1] + " has an invalid table, it has " + ent.length + " Entries and needs 8!")
                            }
                        }
                    } catch (error) {
                        console.error("Parsing error on line " + error.line + ", column " + error.column + ": " + error.message);
                    }
                }
            )
        })
    }
    return locationsLayers
}