import { CanvasSelector } from "./CanvasSelector";

export class ImageDrawer {
  public canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private reader: FileReader;
  private image: HTMLImageElement;
  private form: HTMLFormElement;

  private canvasSelector: CanvasSelector;

  public constructor(canvasEl: HTMLCanvasElement, canvasSelector: CanvasSelector) {
    this.canvas = canvasEl;
    this.ctx = <CanvasRenderingContext2D> canvasEl.getContext('2d');
    this.form = document.createElement('form');
    this.reader = new FileReader();
    this.image = new Image();
    this.canvasSelector = canvasSelector;

    this.init();

    this.reader.addEventListener('load', this.readerLoad.bind(this), false);
    this.image.addEventListener('load', this.imageLoad.bind(this), false);
    this.form.addEventListener('submit', this.formUpload.bind(this), false);
    this.canvas.addEventListener('redraw', this.redraw.bind(this), false);
  }

  public formUpload(e: Event) {
    e.preventDefault();
    let fileInput = <HTMLInputElement> this.form.children[0];
    let file = fileInput.files![0];
    this.loadFile(file);
  }

  /**
   * Do some stuff when DOM has been fully loaded.
   */
  public init() {

    this.form.setAttribute('id', 'file');

    let fileInput = document.createElement('input');
        fileInput.setAttribute('type', 'file');
        fileInput.setAttribute('name', 'file');
        fileInput.setAttribute('id', 'file');

    let submitButton = document.createElement('input');
        submitButton.setAttribute('type', 'submit');
        submitButton.setAttribute('value', 'Add');
        submitButton.setAttribute('id', 'submit');

    this.form.appendChild(fileInput);
    this.form.appendChild(submitButton);
    document.body.insertBefore(this.form, this.canvas);
  }

  /**
   * Draws the uploaded image onto this.canvas.
   */
  public draw() {
    let boundaries = this.canvasSelector.getBoundaries();
    this.ctx.drawImage(this.image, boundaries.x, boundaries.y, boundaries.width, boundaries.height);
  }

  /**
   * Clears the canvas.
   */
  public clear() {
    this.ctx.beginPath();
    this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
    this.ctx.closePath();
  }

  /**
   * Short hand for clearing canvas and redrawing image.
   */
  public redraw() {
    this.clear();
    this.draw();
  }

  /**
   * Create an image when the reader has fully loaded the uploaded file.
   */
  public readerLoad() {
    let encodedImage = this.reader.result;
    this.image.src = encodedImage;
  }

  /**
   * Load file from upload form.
   * 
   * @param file 
   */
  public loadFile(file: File) {
    this.reader.readAsDataURL(file);
  }

  /**
   * Start drawing when uploaded image has been fully loaded.
   */
  public imageLoad () {
    this.draw();
  }
}