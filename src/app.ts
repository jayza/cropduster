import { ImageDrawer } from "./modules/ImageDrawer";
import { CanvasSelector } from "./modules/CanvasSelector";
import { PreviewCanvas } from "./modules/PreviewCanvas";

let canvas = <HTMLCanvasElement> document.getElementById('canvas');
let canvasSelector = new CanvasSelector(canvas);
let imageDrawer = new ImageDrawer(canvas, canvasSelector);
let imagePreview = new PreviewCanvas();