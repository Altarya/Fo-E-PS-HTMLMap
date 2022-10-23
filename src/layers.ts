import * as Config from './config'
import * as toml from '@iarna/toml'
import * as L from "leaflet"

export function setupLayers(mapVar: L.Map, layerController: L.Control.Layers, southWest: L.LatLngExpression, northEast: L.LatLngExpression) {
    fetch(Config.layersPath+"layers.toml").then((response => {
        if (response.ok) {
            return response.blob()
        }
        }))
        .then((result) => {
            result.text().then(response => {
                try {
                    var parsed = toml.parse(response);

                    const layers = new Map(Object.entries(parsed));
                    //console.log(pois);

                    for (let entry of Array.from(layers.entries())) {
                        let key = entry[0];
                        let value = entry[1];
                        //console.log(key+" "+value)

                        const entm = new Map(Object.entries(layers.get(key)))
                        const ent = Array.from(entm.entries())

                        //console.log(ent);

                        const name = <string>ent[0][1]
                        const zindex = <number>ent[1][1]
                        const image = <string>ent[2][1]
                        const isBase = <boolean>ent[3][1]

                        var layer = L.imageOverlay(
                            "./assets/layers/" + image, 
                            L.latLngBounds( southWest, northEast),
                            {
                                zIndex: zindex,
                            }
                        )

                        if(!isBase) {
                            layerController.addOverlay(layer, name)
                        } else {
                            layerController.addBaseLayer(layer, name)
                        }
                    }
                } catch (error) {
                    console.error("Parsing error on line " + error.line + ", column " + error.column + ": " + error.message);
                }
            }
        )
    })
}