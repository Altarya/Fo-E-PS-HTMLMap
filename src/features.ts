import * as Config from './config'
import * as toml from '@iarna/toml'
import * as L from "leaflet"
import * as Cesium from "cesium"

var features = new L.FeatureGroup()
var locationsLayers = L.layerGroup([features])

export function setupFeatures(layerController: L.Control.Layers, map: Map<string, toml.AnyJson>, mapSize: [number, number]) {

    layerController.addOverlay(locationsLayers, "Features")

    const PATH = new Map(Object.entries(map.get("PATH")))
    const featureList = new Map(Object.entries(PATH.get("features_list")))
    for (let entry of Array.from(featureList.entries())) {
        let key = entry[0]
        let value = entry[1]
        //console.log(key+" "+value)

        fetch(Config.featuresPath+value+".toml").then((response => {
            if (response.ok) {
                return response.blob()
            }
            }))
            .then((result) => {
                result.text().then(response => {
                    try {
                        var parsed = toml.parse(response)

                        const pois = new Map(Object.entries(parsed))
                        //console.log(pois)

                        for (let entry of Array.from(pois.entries())) {
                            let key = entry[0]
                            let value = entry[1]
                            //console.log(key+" "+value)

                            const entm = new Map(Object.entries(pois.get(key)))
                            const ent = Array.from(entm.entries())

                            //console.log(ent)

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
                        console.error("Parsing error on line " + error.line + ", column " + error.column + ": " + error.message)
                    }
                })
            }
        )
    }

    return locationsLayers
}

export function setupFeaturesCesium(entities: Cesium.EntityCollection, map: Map<string, toml.AnyJson>, mapSize: [number, number]) {
    const PATH = new Map(Object.entries(map.get("PATH")))
    const poiList = new Map(Object.entries(PATH.get("features_list")))
    const listOfColours = new Map(Object.entries(map.get("features_colour_list")))
    for (let entry of Array.from(poiList.entries())) {
        let value = entry[1]
        fetch(Config.featuresPath+value+".toml").then((response => {
            if (response.ok) {
                return response.blob()
            }
            }))
            .then((result) => {
                result.text().then(response => {
                    //try {
                        var parsed = toml.parse(response)

                        const pois = new Map(Object.entries(parsed))

                        for (let entry of Array.from(pois.entries())) {
                            let key = entry[0]

                            const entm = new Map(Object.entries(pois.get(key)))
                            const ent = Array.from(entm.entries())

                            if(ent.length == 4) {
                                const name: string = ent[0][1]
                                const classNamev: string = ent[1][1]
                                const lat: number = ((ent[2][1]/mapSize[0])*180)-90
                                const lng: number = ((ent[3][1]/mapSize[1])*360)-180

                                let icon = classNamev.match(" (.*)")
                                let iconImage: string = ""
                                let colourName = classNamev
                                let hasIcon: boolean = false
                                if (icon) {
                                    hasIcon = true
                                    iconImage = "./assets/icons/poi/" + icon[1] + ".webp"
                                    colourName = classNamev.match("(.*) ")[1]
                                }
                                let far = 5000000.0
                                let scalev = 2.0

                                let colorv = new Cesium.Color(255,255,255)
                                let colourEntry = Array.from(Object.entries( listOfColours.get(colourName)))
                                if (colourEntry.length) {
                                    colorv = new Cesium.Color(parseFloat(<string>colourEntry[0][1])/255.0,parseFloat(<string>colourEntry[1][1])/255.0,parseFloat(<string>colourEntry[2][1])/255.0)
                                }

                                entities.add({
                                    name: name,
                                    billboard: {
                                        show: hasIcon,
                                        width: 15,
                                        height: 15,
                                        scale: scalev,
                                        image: iconImage,
                                        color: colorv,
                                        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, far),
                                        translucencyByDistance: new Cesium.NearFarScalar(far*0.75, 1.0, far, 0.0),
                                    },
                                    point : {
                                        show: !hasIcon,
                                        pixelSize : 10*scalev,
                                        color: colorv,
                                        outlineColor : Cesium.Color.BLACK,
                                        outlineWidth : 2,
                                        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, far),
                                        translucencyByDistance: new Cesium.NearFarScalar(far*0.75, 1.0, far, 0.0),
                                    },
                                    label: {
                                        show: true,
                                        text: name,
                                        font: "Fallouty",
                                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                                        verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
                                        fillColor: colorv,
                                        outlineColor : Cesium.Color.BLACK,
                                        outlineWidth : 2,
                                        pixelOffset : new Cesium.Cartesian2(0, -17),
                                        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, far),
                                        scale: scalev,
                                        translucencyByDistance: new Cesium.NearFarScalar(far*0.75, 1.0, far, 0.0),
                                    },
                                    position: Cesium.Cartesian3.fromDegrees(lng, lat),
                                })
                                if(hasIcon) {
                                    entities.add({
                                        name: name+" Shadow",
                                        billboard: {
                                            show: hasIcon,
                                            width: 19,
                                            height: 19,
                                            scale: scalev,
                                            image: iconImage,
                                            color: Cesium.Color.BLACK,
                                            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, far),
                                            translucencyByDistance: new Cesium.NearFarScalar(far*0.75, 0.75, far, 0.0),
                                        },
                                        position: Cesium.Cartesian3.fromDegrees(lng, lat),
                                    })
                                }
                            } else {
                                console.error("ERROR: Entry " + ent[0][1] + " has an invalid table, it has " + ent.length + " Entries and needs 8!")
                            }
                        }
                    //} catch (error) {
                    //    console.error("Parsing error on line " + error.line + ", column " + error.column + ": " + error.message)
                    //}
                }
            )
        })
    }
}