import { ImageDrawer } from "./modules/ImageDrawer";
import { CanvasSelector } from "./modules/CanvasSelector";

let canvas = <HTMLCanvasElement> document.getElementById('canvas');
let imageDrawer = new ImageDrawer(canvas);
let canvasSelector = new CanvasSelector(canvas);