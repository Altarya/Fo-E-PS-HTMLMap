# Fo-E-PS-HTMLMap
An interactive map(or Map template) made using LeafletJS, Typescript and Electron.
[![Demo Video](https://cdn.discordapp.com/attachments/455198803478183938/1030905650689093734/unknown.png)](https://cdn.discordapp.com/attachments/455198803478183938/1030905064736444508/map.mp4)
^ Click here for a demo video.
and here: https://altarya.github.io/Fo-E-PS-HTMLMap/ for the whole thing working.

# Features
- Vectorised fully configurable waypoints that appear at different zoom levels
- HTML compliant popups on markers
- Togable and customisable Layers
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
To modify the layers, edit the webp image files within assets/layers, THEY MUST BE THE SAME RESOLUTION AND ASPECT RATIO AS THE VALUE SET IN main.toml.
You can add any amount of layers you want or modify the existing ones.
To edit or add new layers navigate to (extracted folder)/resources/app/docs/config/layers/layers.toml,
within then you can add/remove layers by modifying these entries:
```toml
    [NameOfYourLayerWithoutSpacesOrSpecialCharacters]
        name = "Your Layer Name"
        zindex = 0 #Number to define the sorting for this layer, lower numbers mean that layer will be
        #bellow layers with a higher z-index
        image = "your-layer-image.webp" #You can use PNG/JPEG as well
        #but webp is recommended for performance
        base = false #Wether this is a base layer or not, base layers override the terrain layer
        #and only one can be active at a time
```

## Waypoints(Locations)
First modify the list of locations file in (extracted folder)/resources/app/docs/config/main.toml->poi_list, your lists must be within the config/poi folder, the paths are relative to
said folder. Then in the list follow this:
```toml
[YourWaypointNameWithoutSpacesOrSpecialCharacters]
    name = "Your Waypoint Name"
    class = "CSS Class(See styling) or multiple separated by a space"
    lat = 0 #Latitude, clicking on the map will display lat and lng coordinates that you can use here
    lng = 0 #Longitude
    zoom_level = 0 #A value of 0 to 3 that determines at which zoom level this waypoint will be visible where:
    #0-Always Visible, 1-Major City, 2-Small City, 3-Street Level
    description = "" #The description of the poi, fully html compliant
    link = "" #A link to say a wiki page of this poi
    from = 0 #where this poi is from a number from 0 to last on the atribution_list in main.toml
```
Add as many as you want following that template.
## Waypoints (Features)
Much in the same way as the locations ones, except you add your list files to (extracted folder)/resources/app/docs/config/features folder and within main.toml the features_list list
For each entry use:
```toml
[YourFeatureNameWithoutSpacesOrSpecialCharacters]
    name = "Your Feature Name"
    class ="CSS Class(See styling)"
    lat = 0 #Latitude, clicking on the map will display lat and lng coordinates that you can use here
    lng = 0 #Longitude
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
## Other Settings
There are a few other settings with explanations in main.toml that you may want to disable/enable depending on your use case

# Future Ideas
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
