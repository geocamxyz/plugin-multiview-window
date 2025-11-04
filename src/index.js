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
    const host = this.closest("geocam-viewer");
    if (!host) {
      console.error(
        "GeocamViewerMultiviewWindow must be a child of GeocamViewer"
      );
      return;
    }

    const attach = () => {
      const viewer = host.viewer;
      if (viewer && typeof viewer.plugin === "function") {
        const target = this.getAttribute("target");
        const element =
          document.getElementById(target) || document.querySelector(target);
        if (!element) {
          console.error(`multiview-window: target '${target}' not found`);
          return;
        }
        this.viewer = viewer;
        this.plugin = new multiviewWindow({ mapElement: element });
        this.viewer.plugin(this.plugin);
      } else {
        setTimeout(attach, 50);
      }
    };

    attach();
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
