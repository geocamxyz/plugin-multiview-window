const node = (name, attrs = {}, content = "") => {
  const node = document.createElement(name);
  for (let i in attrs) {
    node.setAttribute(i, attrs[i]);
  }
  node.innerHTML = content;
  return node;
};

const injectStyle = (id, rules) => {
  if (!document.getElementById(id)) {
  document
    .getElementsByTagName("head")[0]
    .prepend(node("STYLE", { type: "text/css" }, rules));
  }
  return true;
};

export const multiviewWindow = function (config = {}) {
  const modes = ["map", "split", "image"]; // map mode image floats over map, split mode side by side, image mode map floats over image
  const windowClasses = {
    map: "geocam-floating-window",
    split: "geocam-split-window",
    image: "geocam-base-window",
  };
  const windowPositionDefaults = {
    map: { left: "50", top: "50", width: "50", height: "50" },
    split: { left: "50", top: "0", width: "50", height: "100" },
    image: { left: "0", top: "0", width: "100", height: "100" },
  };
  let viewer,
    wind,
    moveControls,
    moving = null,
    mapElement = config.mapElement,
    mode = "map";

  const STYLES = `
    .hidden {
      display: none;
    }

    .relative {
      position: relative;
    }

    .absolute {
      position: absolute;
    }

    .geocam-base-window {
      position: absolute;
      z-index: 0;
    }

    .geocam-split-window {
      position: absolute;
    }

    .geocam-floating-window {
      position: absolute;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 4.0px 8.0px 8.0px hsl(0deg 0% 0% / 0.38);
       z-index: 1
    }

    .geocam-window-move {
      display: none;
    }

    .geocam-floating-window .geocam-window-move, .geocam-split-window .geocam-window-move {
      display: block;
      position: absolute;
      left: 0px;
      right: 0px;
      top: 0px;
      bottom: 0px;
      display: grid;
      grid-template-areas: "nwse ns nesw"
        "ew main ew"
        "nesw ns nwse";
      grid-template-columns: 16px 1fr 16px;
      grid-template-rows: 16px 1fr 16px;
      z-index: 2;
      pointer-events: none;
    }
    .geocam-window-move-handler {
      pointer-events: auto;
    }
    .geocam-split-window .geocam-window-move-handler {
      pointer-events: none;
      cursor: auto;
    }
    .geocam-split-window.geocam-split-bottom .geocam-window-move-handler:nth-child(2) {
       cursor:ns-resize;
       pointer-events: auto;
    }
    .geocam-split-window.geocam-split-right .geocam-window-move-handler:nth-child(4) {
       pointer-events: auto;
    }
    .geocam-split-window.geocam-split-left .geocam-window-move-handler:nth-child(6) {
       pointer-events: auto;
    }
    .geocam-split-window.geocam-split-top .geocam-window-move-handler:nth-child(8) {
       pointer-events: auto;
    }
    .geocam-floating-window-noevents .geocam-window-move-handler{
      pointer-events: none;
    }
    .geocam-window-move-handler:nth-child(1) {
      cursor:nwse-resize;
    }
    .geocam-window-move-handler:nth-child(2) {
      cursor:move;
    }
    .geocam-window-move-handler:nth-child(3) {
      cursor:nesw-resize;
    }
    .geocam-window-move-handler:nth-child(4) {
      cursor:ew-resize;
    }
    .geocam-window-move-spacer {
      pointer-events: none;
    }
    .geocam-window-move-handler:nth-child(6) {
      cursor:ew-resize;
    }
    .geocam-window-move-handler:nth-child(7) {
      cursor:nesw-resize;
    }
    .geocam-window-move-handler:nth-child(8) {
      cursor:ns-resize;
    }
    .geocam-window-move-handler:nth-child(9) {
       cursor:nwse-resize;
    }

    .geocam-split-window .geocam-window-close-button {
      display: none;
     }

    .geocam-floating-window  .geocam-window-close-button {
      display: block;
      background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>');
    }

    .geocam-position-menu-wrapper {
      position: absolute;
      background-color: rgba(255, 255, 255, 1);
      padding: 0.25rem;
    }

    .geocam-position-menu {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      grid-template-rows: repeat(3, minmax(0, 1fr));
      gap: 0.25rem;
    }

    .geocam-window-position-button {
        background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve"><g><g><path d="M81.5,76.3h-63c-4.9,0-8.9-4-8.9-8.9V32.6c0-4.9,4-8.9,8.9-8.9l63,0c4.9,0,8.9,4,8.9,8.9v34.7    C90.4,72.3,86.4,76.3,81.5,76.3 M81.5,78.3c6,0,10.9-4.9,10.9-10.9V32.6c0-6-4.9-10.9-10.9-10.9l-63,0c-6,0-10.9,4.9-10.9,10.9    v34.7c0,6,4.9,10.9,10.9,10.9H81.5L81.5,78.3z"></path></g><path d="M68.1,34.8H31.9c-3.2,0-5.8,2.6-5.8,5.8v18.8c0,3.2,2.6,5.8,5.8,5.8h36.1c3.2,0,5.8-2.6,5.8-5.8V40.6   C73.9,37.4,71.3,34.8,68.1,34.8z"></path></g></svg>');
    }

    .geocam-position-split-left {
        background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve"><path d="M81.5,23.7c4.9,0,8.9,4,8.9,8.9v34.7c0,4.9-4,8.9-8.9,8.9h-63c-4.9,0-8.9-4-8.9-8.9V32.6c0-4.9,4-8.9,8.9-8.9H81.5   M81.5,21.7h-63c-6,0-10.9,4.9-10.9,10.9v34.7c0,6,4.9,10.9,10.9,10.9h63c6,0,10.9-4.9,10.9-10.9V32.6  C92.4,26.6,87.5,21.7,81.5,21.7L81.5,21.7z"></path><path d="M42,74.6H19.6c-4.6,0-8.4-3.8-8.4-8.4V33.8c0-4.6,3.8-8.4,8.4-8.4H42c4.6,0,8.4,3.8,8.4,8.4v32.4  C50.3,70.8,46.6,74.6,42,74.6z"></path><path d="M53.3,50.7C53.2,50.6,53.2,50.6,53.3,50.7c-0.1-0.1-0.1-0.1-0.1-0.2c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0-0.1,0-0.1  c0,0,0-0.1,0-0.1c0,0,0-0.1,0-0.1c0,0,0-0.1,0-0.1c0,0,0-0.1,0-0.1c0,0,0-0.1,0-0.1c0,0,0-0.1,0-0.1c0,0,0,0,0-0.1c0,0,0-0.1,0-0.1  c0,0,0,0,0-0.1c0,0,0,0,0,0c0,0,0,0,0-0.1c0,0,0,0,0-0.1c0,0,0-0.1,0.1-0.1c0,0,0,0,0-0.1c0,0,0-0.1,0.1-0.1c0,0,0,0,0,0l5.6-5.6  c0.5-0.5,1.2-0.5,1.7,0c0.5,0.5,0.5,1.2,0,1.7l-3.6,3.6h11.2c0.4,0,0.8,0.2,1,0.5c0.1,0.2,0.2,0.4,0.2,0.7c0,0.3-0.1,0.6-0.4,0.9  c-0.2,0.2-0.5,0.4-0.9,0.4v0H57.2l3.6,3.6c0.5,0.5,0.5,1.2,0,1.7c-0.2,0.2-0.5,0.4-0.9,0.4c-0.3,0-0.6-0.1-0.9-0.4l-5.6-5.6  c0,0,0,0,0,0C53.4,50.8,53.3,50.8,53.3,50.7C53.3,50.7,53.3,50.7,53.3,50.7z"></path></svg>');
    }

    .geocam-position-split-top{
        background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve"><path d="M81.5,23.7c4.9,0,8.9,4,8.9,8.9v34.7c0,4.9-4,8.9-8.9,8.9h-63c-4.9,0-8.9-4-8.9-8.9V32.6c0-4.9,4-8.9,8.9-8.9H81.5   M81.5,21.7h-63c-6,0-10.9,4.9-10.9,10.9v34.7c0,6,4.9,10.9,10.9,10.9h63c6,0,10.9-4.9,10.9-10.9V32.6  C92.4,26.6,87.5,21.7,81.5,21.7L81.5,21.7z"></path><path d="M80.2,50H19.8c-4.6,0-8.4-3.8-8.4-8.4v-7.8c0-4.6,3.8-8.4,8.4-8.4h60.3c4.6,0,8.4,3.8,8.4,8.4v7.8  C88.5,46.2,84.8,50,80.2,50z"></path><path d="M49.3,53.6C49.4,53.6,49.4,53.5,49.3,53.6c0.1-0.1,0.1-0.1,0.2-0.1c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0.1,0,0.1,0  c0,0,0.1,0,0.1,0c0,0,0.1,0,0.1,0c0,0,0.1,0,0.1,0c0,0,0.1,0,0.1,0c0,0,0.1,0,0.1,0c0,0,0.1,0,0.1,0c0,0,0,0,0.1,0c0,0,0.1,0,0.1,0  c0,0,0,0,0.1,0c0,0,0,0,0,0c0,0,0,0,0.1,0c0,0,0,0,0.1,0c0,0,0.1,0,0.1,0.1c0,0,0,0,0.1,0c0,0,0.1,0,0.1,0.1c0,0,0,0,0,0l5.6,5.6  c0.5,0.5,0.5,1.2,0,1.7c-0.5,0.5-1.2,0.5-1.7,0l-3.6-3.6v11.2c0,0.4-0.2,0.8-0.5,1c-0.2,0.1-0.4,0.2-0.7,0.2c-0.3,0-0.6-0.1-0.9-0.4  c-0.2-0.2-0.4-0.5-0.4-0.9h0V57.5l-3.6,3.6c-0.5,0.5-1.2,0.5-1.7,0c-0.2-0.2-0.4-0.5-0.4-0.9c0-0.3,0.1-0.6,0.4-0.9l5.6-5.6  c0,0,0,0,0,0C49.2,53.7,49.2,53.6,49.3,53.6C49.3,53.6,49.3,53.6,49.3,53.6z"></path></svg>');
    }

    .geocam-position-split-right{
        background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve"><g><path d="M18.5,23.7l63,0c4.9,0,8.9,4,8.9,8.9v34.7c0,4.9-4,8.9-8.9,8.9h-63c-4.9,0-8.9-4-8.9-8.9V32.6   C9.6,27.7,13.6,23.7,18.5,23.7 M18.5,21.7c-6,0-10.9,4.9-10.9,10.9v34.7c0,6,4.9,10.9,10.9,10.9h63c6,0,10.9-4.9,10.9-10.9V32.6   c0-6-4.9-10.9-10.9-10.9L18.5,21.7L18.5,21.7z"></path></g><path d="M58,74.6h22.3c4.6,0,8.4-3.8,8.4-8.4V33.8c0-4.6-3.8-8.4-8.4-8.4H58c-4.6,0-8.4,3.8-8.4,8.4v32.4  C49.7,70.8,53.4,74.6,58,74.6z"></path><path d="M41,43.5c-1.1-1.1-2.8,0.6-1.7,1.7l3.6,3.6c-10.8,0-12.4-0.5-12.4,1.2c0,0.7,0.5,1.2,1.2,1.2v0h11.2l-3.6,3.6  c-1.1,1.1,0.6,2.8,1.7,1.7c0.1-0.1,5.7-5.6,5.7-5.8C47.7,49.5,46.1,48.7,41,43.5z"></path></svg>');
    }

    .geocam-position-split-bottom{
        background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve"><path d="M18.5,76.3c-4.9,0-8.9-4-8.9-8.9V32.6c0-4.9,4-8.9,8.9-8.9h63c4.9,0,8.9,4,8.9,8.9v34.7c0,4.9-4,8.9-8.9,8.9H18.5   M18.5,78.3h63c6,0,10.9-4.9,10.9-10.9V32.6c0-6-4.9-10.9-10.9-10.9h-63c-6,0-10.9,4.9-10.9,10.9v34.7C7.6,73.4,12.5,78.3,18.5,78.3  L18.5,78.3z"></path><path d="M19.8,50h60.3c4.6,0,8.4,3.8,8.4,8.4v7.8c0,4.6-3.8,8.4-8.4,8.4H19.8c-4.6,0-8.4-3.8-8.4-8.4v-7.8  C11.5,53.8,15.2,50,19.8,50z"></path><path d="M50.7,46.4C50.6,46.4,50.6,46.5,50.7,46.4c-0.1,0.1-0.1,0.1-0.2,0.1c0,0,0,0,0,0c0,0,0,0,0,0c0,0-0.1,0-0.1,0  c0,0-0.1,0-0.1,0c0,0-0.1,0-0.1,0c0,0-0.1,0-0.1,0c0,0-0.1,0-0.1,0c0,0-0.1,0-0.1,0c0,0-0.1,0-0.1,0c0,0,0,0-0.1,0c0,0-0.1,0-0.1,0  c0,0,0,0-0.1,0c0,0,0,0,0,0c0,0,0,0-0.1,0c0,0,0,0-0.1,0c0,0-0.1,0-0.1-0.1c0,0,0,0-0.1,0c0,0-0.1,0-0.1-0.1c0,0,0,0,0,0l-5.6-5.6  c-0.5-0.5-0.5-1.2,0-1.7c0.5-0.5,1.2-0.5,1.7,0l3.6,3.6V31.4c0-0.4,0.2-0.8,0.5-1c0.2-0.1,0.4-0.2,0.7-0.2c0.3,0,0.6,0.1,0.9,0.4  c0.2,0.2,0.4,0.5,0.4,0.9h0v11.2l3.6-3.6c0.5-0.5,1.2-0.5,1.7,0c0.2,0.2,0.4,0.5,0.4,0.9c0,0.3-0.1,0.6-0.4,0.9l-5.6,5.6  c0,0,0,0,0,0C50.8,46.3,50.8,46.4,50.7,46.4C50.7,46.4,50.7,46.4,50.7,46.4z"></path></svg>');
    }

    .geocam-position-image-top-left{
        background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve"><g><path d="M81.5,23.7c4.9,0,8.9,4,8.9,8.9v34.7c0,4.9-4,8.9-8.9,8.9h-63c-4.9,0-8.9-4-8.9-8.9V32.6c0-4.9,4-8.9,8.9-8.9H81.5    M81.5,21.7h-63c-6,0-10.9,4.9-10.9,10.9v34.7c0,6,4.9,10.9,10.9,10.9h63c6,0,10.9-4.9,10.9-10.9V32.6   C92.4,26.6,87.5,21.7,81.5,21.7L81.5,21.7z"></path></g><path d="M42.1,50H19.8c-4.6,0-8.4-3.8-8.4-8.4v-7.8c0-4.6,3.8-8.4,8.4-8.4h22.3c4.6,0,8.4,3.8,8.4,8.4v7.8  C50.5,46.2,46.7,50,42.1,50z"></path><path d="M50.6,51.5c0.2-0.3,0.6-0.4,0.5-0.4c0.4-0.1,8.1-0.1,8.4-0.1c1.6,0,1.6,2.4,0,2.4l-5.1,0c8,8,8.4,8,8.2,9  c-0.2,0.9-1.4,1.3-2,0.6l0,0l-7.9-7.9l0,5.1c0,1.6-2.4,1.6-2.4,0C50.4,51.9,50.2,52,50.6,51.5z"></path></svg>');
    }

    .geocam-position-image-top-right{
        background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve"><g><g><path d="M18.5,23.7l63,0c4.9,0,8.9,4,8.9,8.9v34.7c0,4.9-4,8.9-8.9,8.9h-63c-4.9,0-8.9-4-8.9-8.9V32.6    C9.6,27.7,13.6,23.7,18.5,23.7 M18.5,21.7c-6,0-10.9,4.9-10.9,10.9v34.7c0,6,4.9,10.9,10.9,10.9h63c6,0,10.9-4.9,10.9-10.9V32.6    c0-6-4.9-10.9-10.9-10.9L18.5,21.7L18.5,21.7z"></path></g><path d="M57.9,50h22.3c4.6,0,8.4-3.8,8.4-8.4v-7.8c0-4.6-3.8-8.4-8.4-8.4H57.9c-4.6,0-8.4,3.8-8.4,8.4v7.8   C49.5,46.2,53.3,50,57.9,50z"></path><path d="M49.4,51.5c-0.2-0.3-0.6-0.4-0.5-0.4c-0.4-0.1-8-0.1-8.4-0.1c-1.6,0-1.6,2.4,0,2.4l5.1,0l-7.9,7.9   c-1.1,1.1,0.6,2.8,1.7,1.7l0,0l7.9-7.9l0,5.1c0,1.6,2.4,1.6,2.4,0C49.6,51.9,49.8,52,49.4,51.5z"></path></g></svg>');
    }

    .geocam-position-image-bottom-right{
        background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve"><g><g><path d="M18.5,76.3c-4.9,0-8.9-4-8.9-8.9V32.6c0-4.9,4-8.9,8.9-8.9l63,0c4.9,0,8.9,4,8.9,8.9v34.7c0,4.9-4,8.9-8.9,8.9H18.5     M18.5,78.3h63c6,0,10.9-4.9,10.9-10.9V32.6c0-6-4.9-10.9-10.9-10.9l-63,0c-6,0-10.9,4.9-10.9,10.9v34.7    C7.6,73.4,12.5,78.3,18.5,78.3L18.5,78.3z"></path></g><path d="M57.9,50h22.3c4.6,0,8.4,3.8,8.4,8.4v7.8c0,4.6-3.8,8.4-8.4,8.4H57.9c-4.6,0-8.4-3.8-8.4-8.4v-7.8   C49.5,53.8,53.3,50,57.9,50z"></path><path d="M48.4,49l-8,0c-1.6,0-1.6-2.4,0-2.4l5.1,0c-7.7-7.7-9.1-8.4-7.9-9.6c0.5-0.5,1.2-0.5,1.7,0l0,0l7.9,7.9l0-5.1   c0-1.6,2.4-1.6,2.4,0l0,8C49.6,48.5,49.1,49,48.4,49z"></path></g></svg>');
    }

    .geocam-position-image-bottom-left{
        background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve"><g><g><path d="M81.5,76.3h-63c-4.9,0-8.9-4-8.9-8.9V32.6c0-4.9,4-8.9,8.9-8.9l63,0c4.9,0,8.9,4,8.9,8.9v34.7    C90.4,72.3,86.4,76.3,81.5,76.3 M81.5,78.3c6,0,10.9-4.9,10.9-10.9V32.6c0-6-4.9-10.9-10.9-10.9l-63,0c-6,0-10.9,4.9-10.9,10.9    v34.7c0,6,4.9,10.9,10.9,10.9H81.5L81.5,78.3z"></path></g><path d="M42.1,50H19.8c-4.6,0-8.4,3.8-8.4,8.4v7.8c0,4.6,3.8,8.4,8.4,8.4h22.3c4.6,0,8.4-3.8,8.4-8.4v-7.8   C50.5,53.8,46.7,50,42.1,50z"></path><path d="M59.5,49c1.6,0,1.6-2.4,0-2.4l-5.1,0c7.7-7.7,9.1-8.4,7.9-9.6c-0.5-0.5-1.2-0.5-1.7,0l0,0l-7.9,7.9l0-5.1   c0-0.7-0.5-1.2-1.2-1.2c-1.7,0-1.2,1.8-1.2,9.2C50.4,49.6,53.4,49,59.5,49z"></path></g></svg>');
    }

    .geocam-position-map-top-left{
        background-image: url('data:image/svg+xml;charset=UTF-8,<?xml version="1.0" encoding="utf-8"?><svg version="1.1" x="0px" y="0px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xmlns="http://www.w3.org/2000/svg">    <g transform="matrix(1, 0, 0, 1, 1, 0)">    <rect style="stroke: rgb(0, 0, 0);" x="6.912" y="22.506" width="85.155" height="57.214" rx="12" ry="12"/>  </g>  <path d="M42.1,50H19.8c-4.6,0-8.4-3.8-8.4-8.4v-7.8c0-4.6,3.8-8.4,8.4-8.4h22.3c4.6,0,8.4,3.8,8.4,8.4v7.8  C50.5,46.2,46.7,50,42.1,50z" style="fill: rgb(255, 255, 255);"/>  <path d="M50.6,51.5c0.2-0.3,0.6-0.4,0.5-0.4c0.4-0.1,8.1-0.1,8.4-0.1c1.6,0,1.6,2.4,0,2.4l-5.1,0c8,8,8.4,8,8.2,9  c-0.2,0.9-1.4,1.3-2,0.6l0,0l-7.9-7.9l0,5.1c0,1.6-2.4,1.6-2.4,0C50.4,51.9,50.2,52,50.6,51.5z" style="fill: rgb(255, 255, 255);"/></svg>');
    }

    .geocam-position-map-top-right{
        background-image: url('data:image/svg+xml;charset=UTF-8,<?xml version="1.0" encoding="utf-8"?><svg version="1.1" x="0px" y="0px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xmlns="http://www.w3.org/2000/svg">    <g>    <g>      <rect style="stroke: rgb(0, 0, 0);" x="6.713" y="21.786" width="85.155" height="57.214" rx="12" ry="12"/>    </g>    <path d="M57.9,50h22.3c4.6,0,8.4-3.8,8.4-8.4v-7.8c0-4.6-3.8-8.4-8.4-8.4H57.9c-4.6,0-8.4,3.8-8.4,8.4v7.8   C49.5,46.2,53.3,50,57.9,50z" style="fill: rgb(255, 255, 255);"/>    <path d="M49.4,51.5c-0.2-0.3-0.6-0.4-0.5-0.4c-0.4-0.1-8-0.1-8.4-0.1c-1.6,0-1.6,2.4,0,2.4l5.1,0l-7.9,7.9   c-1.1,1.1,0.6,2.8,1.7,1.7l0,0l7.9-7.9l0,5.1c0,1.6,2.4,1.6,2.4,0C49.6,51.9,49.8,52,49.4,51.5z" style="fill: rgb(255, 255, 255);"/>  </g></svg>');
    }

    .geocam-position-map-bottom-right{
        background-image: url('data:image/svg+xml;charset=UTF-8,<?xml version="1.0" encoding="utf-8"?><svg version="1.1" x="0px" y="0px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xmlns="http://www.w3.org/2000/svg">    <g>    <g>      <rect style="stroke: rgb(0, 0, 0);" x="6.894" y="21.682" width="85.155" height="57.214" rx="12" ry="12"/>    </g>    <path d="M57.9,50h22.3c4.6,0,8.4,3.8,8.4,8.4v7.8c0,4.6-3.8,8.4-8.4,8.4H57.9c-4.6,0-8.4-3.8-8.4-8.4v-7.8   C49.5,53.8,53.3,50,57.9,50z" style="fill: rgb(255, 255, 255);"/>    <path d="M48.4,49l-8,0c-1.6,0-1.6-2.4,0-2.4l5.1,0c-7.7-7.7-9.1-8.4-7.9-9.6c0.5-0.5,1.2-0.5,1.7,0l0,0l7.9,7.9l0-5.1   c0-1.6,2.4-1.6,2.4,0l0,8C49.6,48.5,49.1,49,48.4,49z" style="fill: rgb(255, 255, 255);"/>  </g></svg>');
    }

    .geocam-position-map-bottom-left{
        background-image: url('data:image/svg+xml;charset=UTF-8,<?xml version="1.0" encoding="utf-8"?><svg version="1.1" x="0px" y="0px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xmlns="http://www.w3.org/2000/svg">    <g>    <g>      <rect style="stroke: rgb(0, 0, 0);" x="7.464" y="21.449" width="85.155" height="57.214" rx="12" ry="12"/>    </g>    <path d="M42.1,50H19.8c-4.6,0-8.4,3.8-8.4,8.4v7.8c0,4.6,3.8,8.4,8.4,8.4h22.3c4.6,0,8.4-3.8,8.4-8.4v-7.8   C50.5,53.8,46.7,50,42.1,50z" style="fill: rgb(255, 255, 255);"/>    <path d="M59.5,49c1.6,0,1.6-2.4,0-2.4l-5.1,0c7.7-7.7,9.1-8.4,7.9-9.6c-0.5-0.5-1.2-0.5-1.7,0l0,0l-7.9,7.9l0-5.1   c0-0.7-0.5-1.2-1.2-1.2c-1.7,0-1.2,1.8-1.2,9.2C50.4,49.6,53.4,49,59.5,49z" style="fill: rgb(255, 255, 255);"/>  </g></svg>');
    }


  `;

  injectStyle("geocam-multiview-window", STYLES);

  const moveProps = [
    ["left", "top"],
    ["move"],
    ["width", "top"],
    ["left"],
    [],
    ["width"],
    ["left", "height"],
    ["height"],
    ["width", "height"],
  ];

  function round(value, decimals) {
    return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
  }

  const targetWindow = function () {
    return mode === "image" && mapElement ? mapElement : wind;
  };

  const get = function (prop, el) {
    if (!el) el = targetWindow();
    return parseFloat(el.style[prop]);
  };

  const set = function (prop, percent, el) {
    if (!el) el = targetWindow();
    el.style[prop] = `${round(percent, 2)}%`;
  };

  const onMouseDown = function (event) {
    wind.classList.add("geocam-floating-window-noevents");
    const target = event.target;
    if (target.classList.contains("geocam-window-move-handler")) {
      // start a move
      const pos = Array.from(target.parentNode.children).indexOf(target);
      moving = {
        x: event.clientX,
        y: event.clientY,
        left: get("left"),
        top: get("top"),
        width: get("width"),
        height: get("height"),
        props: moveProps[pos],
      };
    }
  };

  const onMouseMove = function (event) {
    if (moving) {
      const diffX = event.clientX - moving.x;
      const diffY = event.clientY - moving.y;
      const diffXpc = (diffX / window.innerWidth) * 100;
      const diffYpc = (diffY / window.innerHeight) * 100;
      for (let i = 0; i < moving.props.length; i++) {
        const prop = moving.props[i];
        switch (prop) {
          case "move":
            set("top", moving.top + diffYpc);
            if (mode !== "split") {
              set("left", moving.left + diffXpc);
            } else {
              set("height", moving.height - diffYpc);
              mapElement.style.height = `${moving.top + diffYpc}%`;
            }
            break;
          case "left":
            set("left", moving.left + diffXpc);
            set("width", moving.width - diffXpc);
            if (mode === "split") {
              mapElement.style.width = `${moving.left + diffXpc}%`;
            }
            break;
          case "top":
            set("top", moving.top + diffYpc);
            set("height", moving.height - diffYpc);
            break;
          case "width":
            set("width", moving.width + diffXpc);
            if (mode === "split") {
              mapElement.style.left = `${moving.width + diffXpc}%`;
              mapElement.style.width = `${100 - (moving.width + diffXpc)}%`;
            }
            break;
          case "height":
            set("height", moving.height + diffYpc);
              if (mode === "split") {
              mapElement.style.top = `${ moving.height + diffYpc}%`;
              mapElement.style.height = `${100 - ( moving.height + diffYpc)}%`;
            }
            break;
        }
      }
    }
  };

  const updateViewerStores = function () {
    const props = ["left", "top", "width", "height"];
    for (let i = 0; i < props.length; i++) {
      const k = props[i];
      viewer.stores[k] ? viewer.stores[k](get(k)) : viewer.store(k, get(k));
    }
   viewer.stores['mode'] ?  viewer.mode( mode) : viewer.store('mode', mode);
  };

  const onMouseUp = function () {
    if (moving) {
      //write the values to stores;
      updateViewerStores();
      moving = null;
    }
    wind.classList.remove("geocam-floating-window-noevents");
  };

  const setMoveControlsParent = function (element) {
    element.prepend(moveControls);
  };

  const setWindow = function (position) {
    console.log("in set window", position, mode);
    switch (mode) {
      case "map":
        setMoveControlsParent(wind);
        wind.classList.remove("geocam-base-window");
        wind.classList.remove("geocam-split-window");
        wind.classList.add("geocam-floating-window");
        set("width", 50);
        set("height", 50);
        switch (position) {
          case "top-left":
            set("left", 0);
            set("top", 0);
            break;
          case "top-right":
            set("left", 50);
            set("top", 0);
            break;
          case "bottom-right":
            set("left", 50);
            set("top", 50);
            break;
          case "bottom-left":
            set("left", 0);
            set("top", 50);
            break;
          default:
            const hashParams = new URLSearchParams(
              window.location.hash.substr(1)
            );
            set("left", hashParams.get("left") || 0);
            set("top", hashParams.get("top") || 0);
        }
        if (mapElement) {
          mapElement.classList.remove("geocam-split-window");
          mapElement.classList.remove("geocam-floating-window");
          mapElement.classList.add("geocam-base-window");
          mapElement.style.left = "0%";
          mapElement.style.top = "0%";
          mapElement.style.width = "100%";
          mapElement.style.height = "100%";
        }
        break;
      case "split":
        setMoveControlsParent(wind);
        wind.classList.remove("geocam-base-window");
        wind.classList.remove("geocam-floating-window");
        wind.classList.add("geocam-split-window");
        switch (position) {
          case "left":
            set("left", 0);
            set("top", 0);
            set("width", 50);
            set("height", 100);
            break;
          case "top":
            set("left", 0);
            set("top", 0);
            set("width", 100);
            set("height", 50);
            break;
          case "right":
            set("left", 50);
            set("top", 0);
            set("width", 50);
            set("height", 100);
            break;
          case "bottom":
            set("left", 0);
            set("top", 50);
            set("width", 100);
            set("height", 50);
            break;
          default:
            const hashParams = new URLSearchParams(
              window.location.hash.substr(1)
            );
            set("left", hashParams.get("left") || 50);
            set("top", hashParams.get("top") || 0);
            set("width", hashParams.get("width") || 50);
            set("height", hashParams.get("height") || 100);
        }
        if (mapElement) {
          mapElement.classList.remove("geocam-base-window");
          mapElement.classList.remove("geocam-floating-window");
          mapElement.classList.add("geocam-split-window");
          switch (position) {
            case "left":
              mapElement.style.left = "50%";
              mapElement.style.top = "0%";
              mapElement.style.width = "50%";
              mapElement.style.height = "100%";
              break;
            case "top":
              mapElement.style.left = "0%";
              mapElement.style.top = "50%";
              mapElement.style.width = "100%";
              mapElement.style.height = "50%";
              break;
            case "right":
              mapElement.style.left = "0%";
              mapElement.style.top = "0%";
              mapElement.style.width = "50%";
              mapElement.style.height = "100%";
              break;
            case "bottom":
              mapElement.style.left = "0%";
              mapElement.style.top = "0%";
              mapElement.style.width = "100%";
              mapElement.style.height = "50%";
              break;
            default:
              const hashParams = new URLSearchParams(
                window.location.hash.substr(1)
              );
              const [left, top, width, height] = [
                get("left"),
                get("top"),
                get("width"),
                get("height"),
              ];
              const vertical = height === 100 && top === 0;
              if (vertical) {
                mapElement.style.top = "0%";
                mapElement.style.height = "100%";
                mapElement.style.left = left > 0 ? "0%" : `${100 - width}%`;
                mapElement.style.width = left > 0 ? `${left}%` : `${width}%`;
                position = left > 0 ? "right" : "left";
              } else {
                mapElement.style.left = "0%";
                mapElement.style.width = "100%";
                mapElement.style.top = top > 0 ? "0%" : `${100 - height}%`;
                mapElement.style.height = top > 0 ? `${top}%` : `${height}%`;
                position = top > 0 ? "bottom" : "top";
              }
          }
        }
        wind.classList.remove(
          "geocam-split-left",
          "geocam-split-right",
          "geocam-split-top",
          "geocam-split-bottom"
        );
        wind.classList.add(`geocam-split-${position}`);
        break;
      case "image":
        wind.classList.remove("geocam-split-window");
        wind.classList.remove("geocam-floating-window");
        wind.classList.add("geocam-base-window");
        wind.style.left = "0%";
        wind.style.top = "0%";
        wind.style.width = "100%";
        wind.style.height = "100%";

        if (mapElement) {
          setMoveControlsParent(mapElement);
          mapElement.classList.remove("geocam-split-window");
          mapElement.classList.remove("geocam-base-window");
          mapElement.classList.add("geocam-floating-window");
          set("width", 50);
          set("height", 50);
          switch (position) {
            case "top-left":
              set("left", 0);
              set("top", 0);
              break;
            case "top-right":
              set("left", 50);
              set("top", 0);
              break;
            case "bottom-right":
              set("left", 50);
              set("top", 50);
              break;
            case "bottom-left":
              set("left", 0);
              set("top", 50);
              break;
            default:
              const hashParams = new URLSearchParams(
                window.location.hash.substr(1)
              );
              mapElement.style.left = `${hashParams.get("left") || 50}%`;
              mapElement.style.top = `${hashParams.get("top") || 50}%`;
              mapElement.style.width = `${hashParams.get("width") || 50}%`;
              mapElement.style.height = `${hashParams.get("height") || 50}%`;
          }
        }
        break;
    }
    updateViewerStores();
  };

  this.setMapElement = function (el) {
    mapElement = el;
  };

  this.init = function (geocamViewer) {
    const hashParams = new URLSearchParams(window.location.hash.substr(1));
    viewer = geocamViewer;

    const posWrapper = node("div", {});
    const position = node("div", {
      class: "geocam-window-position-button geocam-viewer-control-button",
      title: "position geocam viewer",
    });
    posWrapper.appendChild(position);
    const posMenuWrapper = node("div", { class: "relative" });
    const posMenu = node("div", {
      class: "absolute bg-white p-1 shadow hidden geocam-position-menu-wrapper",
      style:
        "top: -32px; left: calc(32px + 0.25rem); width: calc(128px + 1.25rem)",
    });
    const posOptions = node("div", {
      class: "geocam-position-menu grid grid-cols-4 grid-rows-3 gap-1",
    });
    posOptions.appendChild(
      node("div", {
        class: "geocam-position-image-top-left geocam-viewer-control-button ",
        "data-position": "top-left",
        "data-mode": "map",
        title: "float viewer over the map at the top left",
      })
    );
    posOptions.appendChild(
      node("div", {
        class: "geocam-position-image-top-right geocam-viewer-control-button",
        "data-position": "top-right",
        "data-mode": "map",
        title: "float viewer over the map at the top right",
      })
    );
    posOptions.appendChild(
      node("div", {
        class:
          "geocam-position-image-bottom-right geocam-viewer-control-button",
        "data-position": "bottom-right",
        "data-mode": "map",
        title: "float viewer over the map at the bottom right",
      })
    );
    posOptions.appendChild(
      node("div", {
        class: "geocam-position-image-bottom-left geocam-viewer-control-button",
        "data-position": "bottom-left",
        "data-mode": "map",
        title: "float viewer over the map at the bottom left",
      })
    );
    posOptions.appendChild(
      node("div", {
        class: "geocam-position-split-left geocam-viewer-control-button",
        "data-position": "left",
        "data-mode": "split",
        title: "split the window with viewer on the left and map on the right",
      })
    );
    posOptions.appendChild(
      node("div", {
        class: "geocam-position-split-top geocam-viewer-control-button",
        "data-position": "top",
        "data-mode": "split",
        title: "split the window with viewer on the top and map on the bottom",
      })
    );
    posOptions.appendChild(
      node("div", {
        class: "geocam-position-split-right geocam-viewer-control-button",
        "data-position": "right",
        "data-mode": "split",
        title: "split the window with viewer on the right and map on the left",
      })
    );
    posOptions.appendChild(
      node("div", {
        class: "geocam-position-split-bottom geocam-viewer-control-button",
        "data-position": "bottom",
        "data-mode": "split",
        title: "split the window with viewer on the bottom and map on the top",
      })
    );
    posOptions.appendChild(
      node("div", {
        class: "geocam-position-map-top-left geocam-viewer-control-button",
        "data-position": "top-left",
        "data-mode": "image",
        title: "float map over the viewer at the top left",
      })
    );
    posOptions.appendChild(
      node("div", {
        class: "geocam-position-map-top-right geocam-viewer-control-button",
        "data-position": "top-right",
        "data-mode": "image",
        title: "float map over the viewer at the top right",
      })
    );
    posOptions.appendChild(
      node("div", {
        class: "geocam-position-map-bottom-right geocam-viewer-control-button",
        "data-position": "bottom-right",
        "data-mode": "image",
        title: "float map over the viewer at the bottom right",
      })
    );
    posOptions.appendChild(
      node("div", {
        class: "geocam-position-map-bottom-left geocam-viewer-control-button",
        "data-position": "bottom-left",
        "data-mode": "image",
        title: "float map over the viewer at the bottom left",
      })
    );
    posMenu.appendChild(posOptions);
    posMenuWrapper.appendChild(posMenu);
    posWrapper.appendChild(posMenuWrapper);
    viewer.addControl(posWrapper, "left-top", { prepend: true });

    const onClickOutside = function (event) {
      if (!event.target.closest(".geocam-position-menu-wrapper")) {
        posMenu.classList.add("hidden");
      }
    };

    position.addEventListener("click", function () {
      posMenu.classList.toggle("hidden");
      if (posMenu.classList.contains("hidden")) {
        document.removeEventListener("mousedown", onClickOutside);
      } else {
        document.addEventListener("mousedown", onClickOutside);
      }
    });

    posMenu.addEventListener("click", function (event) {
      const target = event.target;
      if (target.classList.contains("geocam-viewer-control-button")) {
        posMenu.classList.add("hidden");
        document.removeEventListener("mousedown", onClickOutside);
        mode = target.getAttribute("data-mode");
        const position = target.getAttribute("data-position");
        setWindow(position);
      }
    });

    const close = node("div", {
      class: "geocam-window-close-button geocam-viewer-control-button",
      title: "close geocam viewer",
    });
    close.addEventListener("click", viewer.hide);
    viewer.addControl(close, "left-top", { prepend: true });

    mode = hashParams.get("mode") ? JSON.parse(hashParams.get("mode")) : mode;
    console.log("mode is", mode);
    wind = node("DIV", { class: `${windowClasses[mode]}` });
    /*
    wind.style.left = `${
      hashParams.get("left") || windowPositionDefaults[mode].left
    }%`;
    wind.style.top = `${
      hashParams.get("top") || windowPositionDefaults[mode].top
    }%`;
    wind.style.height = `${
      hashParams.get("height") || windowPositionDefaults[mode].height
    }%`;
    wind.style.width = `${
      hashParams.get("width") || windowPositionDefaults[mode].width
    }%`;
    */
    moveControls = node("DIV", { class: "geocam-window-move" });
    for (let i = 0; i < 9; i++) {
      moveControls.appendChild(
        node("DIV", {
          class:
            i == 4 ? "geocam-window-move-spacer" : "geocam-window-move-handler",
        })
      );
    }
    setWindow();

    // viewer.wrapper.prepend(moveControls);
    viewer.wrapper.parentNode.appendChild(wind);
    wind.appendChild(viewer.wrapper);
    viewer.visible(
      (v) => {
        v
          ? wind.classList.remove("geocam-viewer-hidden")
          : wind.classList.add("geocam-viewer-hidden");
      },
      { prepend: true }
    );
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  this.destroy = function () {
    window.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    wind.parentNode.appendChild(viewer.wrapper);
    wind.parentNode.removeChild(wind);
  };
};
