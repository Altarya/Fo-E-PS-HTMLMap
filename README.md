# Fo-E-PS-HTMLMap
An interactive map(or Map template) made using LeafletJS, Typescript and Electron.
[![Demo Video](https://cdn.discordapp.com/attachments/455198803478183938/1030905650689093734/unknown.png)](https://cdn.discordapp.com/attachments/455198803478183938/1030905064736444508/map.mp4)
^ Click here for a demo video.
and here: https://altarya.github.io/Fo-E-PS-HTMLMap/ for the whole thing working.

# Features
- Vectorised fully configurable waypoints that appear at different zoom levels
- Togable Layers
- Search bar
- (Semi-accurate) Distance and Bearing ruler
- Loose files for deployment with the packaged Electron Launcher or anywhere that can render WebGL and HTML5
- Easilly moldable for those that want to use this as a base for their own maps

# How to use?
## Standalone
- 1 - Download the latest release
- 2 - Unpack it somewhere
- 3 - Run htmlmap.exe
## As a webpage
- 1 - Run your http server of choice(like npx http-server .\) on (extracted folder)/resources/app/docs
- 2 - Open the address of the server, and it should be the default page
## Within Foundry Virtual Tabletop
- 1 - Download and enable the HTML To Scene Module
- 2 - Create a new scene
- 3 - Edit Scene properties and open the HTML To Scene tab
- 4 - Enable it
- 5 - On the location, point it to (extracted folder)/resources/app/docs/index.html

# How to modify?
Most editing is done by modifying files in assets and config
## Layers
To modify the layers, edit the webp image files within assets/layers, THEY MUST BE THE SAME RESOLUTION AND ASPECT RATIO AS THE ORIGINAL FILES
(This is something i want to make configurable in the future)
## Waypoints(Locations)
First modify the list of locations file in config/main.toml->poi_list, your lists must be within the config/poi folder, the paths are relative to
said folder. Then in the list follow this:
```toml
[YourWaypointNameWithoutSpacesOrSpecialCharacters]
    name = "Your Waypoint Name"
    class ="CSS Class(See styling)"
    lat = #Latitude, clicking on the map will display lat and lng coordinates that you can use here
    lng = #Longitude
    zoom_level = 0 #A value of 0 to 3 that determines at which zoom level this waypoint will be visible where:
    #0-Always Visible, 1-Major City, 2-Small City, 3-Street Level
```
Add as many as you want following that template.
## Waypoints (Features)
Much in the same way as the locations ones, except you add your list files to config/features folder and within main.toml the features_list list
For each entry use:
```toml
[YourFeatureNameWithoutSpacesOrSpecialCharacters]
    name = "Your Feature Name"
    class ="CSS Class(See styling)"
    lat = #Latitude, clicking on the map will display lat and lng coordinates that you can use here
    lng = #Longitude
```
Note that features are always visible regardless of zoom levels.
## Styling
This is how you give each marker its own style, this is done by calling the className property of the marker in a css file, for locations
use pointsofinterest.css and for features use features.css.
I'd reccommend reading a bit about CSS Styling before you attempt to mess with these.
```css
  .yourClassNameHere {
      /* Styling */
  }
```
You can also modify other Leaflet ui things using this same format, you can of course find out what classes to modify using your browser's(or
the bundled Electron's) webpage inspector(Inspect Element).

# Future Ideas
- Custom configurable layers
- Configurable Resolution
- Configurable icons without the need of CSS
- GeoJson support

# Why?
I greatly enjoy making maps for tabletop rpg games and such, and up until this project I'd do them on an image editor like Photoshop,
while thats usually perfectly fine, there is a limit to the amount of information density a static map can display without getting cluttered,
plus they lack the ability to measure docsances and to search the marked locations. There are many mapping tools available online, most with
far more features than this will ever have, but I've yet to find one that outputs a file that can be easilly integrated into Foundry, so I took
matters into my own hands.

# Whats the bundled map for?
It is the world map of my currently running ttrpg game between friends, its setting is an AU version of Fallout Equestria.
## Can I use your map for (X thing)
Yep! Go ahead, just give a little note crediting me if you want and its all good, the map contains locations from several other Fo:E sidefics and if you're
a bigger nerd than me, feel free to poke me about including more(Or from your creations too!).
