import * as Config from './config'
import * as toml from '@iarna/toml'
import * as L from "leaflet"

var Lextra: any
if (typeof exports === 'object') {
    Lextra = require('leaflet');
} else {
    if(typeof window.L === 'undefined')
        throw 'Leaflet must be loaded first';
    Lextra = L
}

var lines: L.FeatureGroup<any>[] = new Array();
var locationsLayers = L.layerGroup(lines)

export function setupLines(layerController: L.Control.Layers, map: Map<string, toml.AnyJson>, mapSize: [number, number]) {

    const PATH = new Map(Object.entries(map.get("PATH")))

    const layersList = new Map(Object.entries(PATH.get("lines_layers")))

    for (let entry of Array.from(layersList.entries())) {
        let key = entry[0]
        let value: string = <string>entry[1]
        let i = parseInt(key)
        let layer = new L.FeatureGroup
        lines.push(layer)

        locationsLayers.addLayer(lines[i])

        layerController.addOverlay(lines[i], value)
    }

    const featureList = new Map(Object.entries(PATH.get("lines_list")))
    for (let entry of Array.from(featureList.entries())) {
        let key = entry[0];
        let value = entry[1];
        //console.log(key+" "+value)

        fetch(Config.linesPath+value+".toml").then((response => {
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

                            const name: string = ent[0][1]
                            const classNamev: string = ent[1][1]
                            const colorv: string = ent[2][1]
                            const layerv: number = ent[3][1]
                            let latlng: Array<[number, number]> = ent[4][1]
                            for (let i = 0; i < latlng.length; i++) {
                                latlng[i][0] = ((latlng[i][0]/mapSize[0])*180)-90
                                latlng[i][1] = ((latlng[i][1]/mapSize[1])*360)-180
                            }
                            const width: number = ent[5][1]
                            const smooothing: number = ent[6][1]
                            const description: string = ent[7][1]

                            const label = L.tooltip({
                                className: classNamev,
                                direction: 'center',
                            }).setContent(name)

                            var line = L.polyline(
                                latlng,
                                {
                                    weight: width,
                                    color: colorv,
                                    smoothFactor: smooothing
                                }
                            ).bindTooltip(label).bindPopup(
                                "<h1>" + name + "</h1>" + description
                            )

                            lines[layerv].addLayer(line)
                        }
                    } catch (error) {
                        console.error("Parsing error on line " + error.line + ", column " + error.column + ": " + error.message);
                    }
                })
            }
        )
    }

    return locationsLayers
}