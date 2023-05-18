# Multiview Window
A plugin for the geocam-viewer.
### NPM Installation:
```
npm install 'https://gitpkg.now.sh/geocamxyz/plugin-multiview-window/src?v1.0.0'
```
or for a particual commit version:
```
npm install 'https://gitpkg.now.sh/geocamxyz/plugin-multiview-window/src?c7d31be'
```
### Import Map (External Loading):
```
https://cdn.jsdelivr.net/gh/geocamxyz/plugin-multiview-window@v1.0.0/dist/multiview-window.js
```
or for a particual commit version:
```
https://cdn.jsdelivr.net/gh/geocamxyz/plugin-multiview-window@c7d31be/dist/multiview-window.js
```
### Usage:
The .js file can be imported into your .html file using the below code (This can be ignored if your using the NPM package).
```
<script type="importmap">
  {
    "imports": {
      "multiview-window": "https://cdn.jsdelivr.net/gh/geocamxyz/plugin-multiview-window@v1.0.0/dist/multiview-window.js"
    }
  }
</script>
```
The plugin can be imported via a module script or using the npm package and using the below import statement.
```
import { multiviewWindow } from "multiview-window"
```
### Setup:
The plugin can then be added into the plugins array for the init of the viewer class as seen below
```
const sceneElement = document.getElementById("scene");
const multiviewWindowPlugin = new multiviewWindow({ sceneElement });
const viewer = new geocamViewer(node, {
	plugins: [
        multiviewWindowPlugin,
      ],
});
```
If using arcgisScene it can be into it as a plugin
```
 scenePromise.then((sceneView) => {
      if (sceneView) {
        sceneView.when(() => {
          viewer.plugin(
            new arcgisScene({
              multiviewWindowPlugin,
            })
          );
        });
      }
    });
```