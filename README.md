# Multiview Window
A web component plugin for the [geocamxyz/geocam-viewer](https://github.com/geocamxyz/geocam-viewer) to add a control to the viewer for quickly resizing/moving the window around the screen particularly with respect to a map
### NPM Installation:
```
npm install 'https://gitpkg.now.sh/geocamxyz/plugin-multiview-window/src?v2.0.3'
```
or for a particual commit version:
```
npm install 'https://gitpkg.now.sh/geocamxyz/plugin-multiview-window/src?530d98c'
```
### Import Map (External Loading):
```
https://cdn.jsdelivr.net/gh/geocamxyz/plugin-multiview-window@v2.0.3/dist/multiview-window.js
```
or for a particual commit version:
```
https://cdn.jsdelivr.net/gh/geocamxyz/plugin-multiview-window@530d98c/dist/multiview-window.js
```
### Usage:
The .js file can be imported into your .html file using the below code (This can be ignored if your using the NPM package).
```
 <script type="module" src="https://cdn.jsdelivr.net/gh/geocamxyz/plugin-multiview-window@v2.0.3/dist/multiview-window.js"></script>
 ```

 Or with an importmap
 ```
<script type="importmap">
  {
    "imports": {
      "multiview-window": "https://cdn.jsdelivr.net/gh/geocamxyz/plugin-multiview-window@v2.0.3/dist/multiview-window.js"
    }
  }
</script>
```
The plugin can then be imported via a module script or using the npm package and using the below import statement.
```
import "multiview-window"
```
### Setup:
The plugin can then be added to the viewer by making the custom element a child of the viewer parent element.  

```
<geocam-viewer>
  <geocam-viewer-multiview-window target="map"></geocam-viewer-multiview-window>
</geocam-viewer>
```

There are no attribute settings.