import * as Config from './config'
import * as toml from '@iarna/toml'
import * as L from "leaflet"

var features = new L.FeatureGroup();
var locationsLayers = L.layerGroup([features])

export function setupFeatures(layerController: L.Control.Layers, map: Map<string, toml.AnyJson>, mapSize: [number, number]) {

    layerController.addOverlay(locationsLayers, "Features")

    const PATH = new Map(Object.entries(map.get("PATH")))
    const featureList = new Map(Object.entries(PATH.get("features_list")))
    for (let entry of Array.from(featureList.entries())) {
        let key = entry[0];
        let value = entry[1];
        //console.log(key+" "+value)

        fetch(Config.featuresPath+value+".toml").then((response => {
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

                            const name = ent[0]
                            const classNamev = ent[1]
                            const lat: number = ((ent[2][1]/mapSize[0])*180)-90
                            const lng: number = ((ent[3][1]/mapSize[1])*360)-180

                            const label = L.tooltip({
                                className: classNamev[1],
                                permanent: true,
                                direction: 'center',
                            }).setLatLng((new L.LatLng(lat, lng))).setContent(name[1])

                            var featureIcon = new L.Icon({
                                iconSize:     [24, 24],
                                shadowSize:   [0, 0],
                                iconAnchor:   [12, 12],
                                shadowAnchor: [0, 0],
                                tooltipAnchor:  [-12, -16],
                                iconUrl: "./assets/icons/poi/feature.webp",
                                className: classNamev[1]
                            })

                            var marker = L.marker(
                                (new L.LatLng(lat, lng)), {
                                    title: name[1],
                                    icon: featureIcon
                                }
                            ).bindTooltip(label)

                            features.addLayer(marker)

                            marker.setIcon(featureIcon)
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