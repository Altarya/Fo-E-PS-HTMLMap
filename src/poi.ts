import * as Config from './config'
import * as toml from '@iarna/toml'
import * as L from "leaflet"

export function setupPOI(map: L.Map) {
    fetch(Config.configPath+"main.toml").then((response => {
        if (response.ok) {
            return response.blob()
            //tropicsFile = URL.createObjectURL(await response.blob()).toString()
        }
        }))
        .then((result) => {
            result.text().then(response => {
                try {
                    var parsed = toml.parse(response);
                    
                    const map = new Map(Object.entries(parsed));

                    // Map(3) { 'user1' => 'John', 'user2' => 'Kate', 'user3' => 'Peter' }
                    console.log(map);

                    var PATH = new Map(Object.entries(map.get("PATH")))
                    var poiList = new Map(Object.entries(PATH.get("poi_list")))
                    for (let entry of Array.from(poiList.entries())) {
                        let key = entry[0];
                        let value = entry[1];
                        console.log(key+" "+value)
                    }
                } catch (error) {
                    console.error("Parsing error on line " + error.line + ", column " + error.column + ": " + error.message);
                }
            }
        )
    })
}