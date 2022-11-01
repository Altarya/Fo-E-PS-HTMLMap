import * as L from "leaflet"

const threeDButton = L.Control.extend({
    onAdd: function(map: L.Map) {
        var button = document.createElement('button')
        button.type = 'button'
        button.className = 'leaftlet-button'
        button.onclick = function() {
            var mapC = document.getElementById("map2")
            mapC.style.height = "100%"
            mapC.style.width = "100%"
            var mapL = document.getElementById("map")
            mapL.style.height = "0%"
            mapL.style.width = "0%"
        }
        button.textContent = '3D'

        return button
    },

    onRemove: function(map: L.Map) {
        // Nothing to do here
    }
})

export function ThreeDButton(opts: any) {
    return new threeDButton(opts)
}
