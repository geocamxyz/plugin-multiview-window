import { multiviewWindow } from "./lib/multiview-window.js";

export class GeocamViewerMultiviewWindow extends HTMLElement {
  constructor() {
    super();
    this.plugin = null;
    // this.yaw = this.getAttribute('yaw') || 0;
    console.log("multiview-window init");
  }

  connectedCallback() {
    console.log("multiview-window connected");
    const node = this;
    const parent = this.parentNode;
    this.viewer = parent.viewer;
    if (this.viewer && this.viewer.plugin) {
      // Call a method on the parent
      const target = this.getAttribute("target");
      const element =
        document.getElementById(target) || document.querySelector(target);
      if (!element) {
        console.error(`multiview-window: target '${target}' not found`);
        return;
      }
      this.plugin = new multiviewWindow(element);
      this.viewer.plugin(this.plugin);
    } else {
      console.error(
        "GeocamViewerMultiviewWindow must be a child of GeocamViewer"
      );
    }
  }

  disconnectedCallback() {
    this.plugin = null;
    this.viewer = null;
    console.log("multiview-window disconnected");
    // Clean up the viewer
  }
}

window.customElements.define(
  "geocam-viewer-multiview-window",
  GeocamViewerMultiviewWindow
);
