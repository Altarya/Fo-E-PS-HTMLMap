//https://github.com/ggolikov/Leaflet.River/blob/master/src/L.River.js

/*
* @class River
* @aka L.River
* @inherits FeatureGroup
*
* A class for drawing 'flowing' ploylines. Extends `FeatureGroup`.
 */

(function(factory, window){
    "use strict";
    /*if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);
    } else*/ if (typeof exports === 'object') {
        module.exports = factory(require('leaflet'));
    } else {
        if(typeof window.L === 'undefined')
            throw 'Leaflet must be loaded first';
        factory(window.L);
    }
    }(function (L: any) {
        L.River = L.FeatureGroup.extend({
            options: {
                color: 'blue',
                minWidth: 1,
                maxWidth: 10,
                ratio: null
            },

            initialize: function (latLngs: any, options: any) {
                L.FeatureGroup.prototype.initialize.call(this, [], options);
                this._latLngs = latLngs;

                L.setOptions(this, options);
                this._buildLines(latLngs);
            },

            onAdd: function (map: any) {
                L.FeatureGroup.prototype.onAdd.call(this, map);
                this._getLength(map);
                this.setStyle();
            },

            _buildLines: function (latLngs: string | any[]) {
                for (var i = 0; i < latLngs.length - 1; i++) {
                    var line = L.polyline([latLngs[i], latLngs[i+1]]);

                    this.addLayer(line);
                }
            },

            _getLength: function (map: { latLngToLayerPoint: (arg0: any) => { (): any; new(): any; distanceTo: { (arg0: any): number; new(): any; }; }; }) {
                var latLngs = this._latLngs,
                    totalLength = 0;

                for (var i = 0; i < latLngs.length - 1; i++) {
                    totalLength += map.latLngToLayerPoint(latLngs[i]).distanceTo(map.latLngToLayerPoint(latLngs[i+1]));
                }

                return this._length = totalLength;
            },

            /* pubic interface */
            setStyle: function (style: any) {
                this.options = L.extend(this.options, style);

                var opt = this.options,
                    totalLength = this._length,
                    map = this._map,
                    layers = this._layers,
                    points = this._points,
                    length = 0,
                    layer, latLngs;

                for (var key in layers) {
                    layer = layers[key];
                    latLngs = layer.getLatLngs();
                    length += map.latLngToLayerPoint(latLngs[0]).distanceTo(map.latLngToLayerPoint(latLngs[1]));

                    var percent = length / totalLength;
                    var w = opt.minWidth + (opt.maxWidth * percent);

                    layer.setStyle(L.extend({}, opt, {
                        weight: opt.ratio ? length / opt.ratio : opt.minWidth + (opt.maxWidth - opt.minWidth) * percent
                    }));
                }
            },

            setMinWidth: function (width: any) {
                this.setStyle({
                    minWidth: width
                })
            },

            setMaxWidth: function (width: any) {
                this.setStyle({
                    maxWidth: width
                })
            },

            getMinWidth: function () {
                return this.options.minWidth;
            },

            getMaxWidth: function () {
                return this.options.maxWidth;
            },

            useLength: function (ratio: any) {
                L.setOptions(this, {ratio: ratio});
                return this;
            },

            convertToPolyline: function (options: any) {
                return L.polyline(this._latLngs, options);
            }
        });

        L.river = function (latLngs: any, options: any) {
            return new L.River(latLngs, options);
        };
}, window));

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

var features = new L.FeatureGroup();
var locationsLayers = L.layerGroup([features])

export function setupRivers(layerController: L.Control.Layers, map: Map<string, toml.AnyJson>) {

    layerController.addOverlay(locationsLayers, "Rivers")

    const PATH = new Map(Object.entries(map.get("PATH")))
    const featureList = new Map(Object.entries(PATH.get("rivers_list")))
    for (let entry of Array.from(featureList.entries())) {
        let key = entry[0];
        let value = entry[1];
        //console.log(key+" "+value)

        fetch(Config.riversPath+value+".toml").then((response => {
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
                            const latlng: [] = ent[2][1]
                            const minWidthv: number = ent[3][1]
                            const maxWidthv: number = ent[4][1]
                            const opacityv: number = ent[5][1]

                            const label = L.tooltip({
                                className: classNamev,
                                direction: 'center',
                            }).setContent(name)

                            var river = Lextra.river(
                                latlng,
                                {
                                    minWidth: minWidthv,  
                                    maxWidth: maxWidthv,
                                    interactive: true,
                                    options: {
                                        className: classNamev,
                                        opacity: opacityv
                                    }
                                }
                            ).bindTooltip(label)

                            features.addLayer(river)
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