export class PreviewCanvas {
  private previewEl: HTMLElement;
  private previewImage!: ImageData;

  public constructor() {
    this.previewEl = document.createElement('div');
    this.previewEl.setAttribute('id', 'previewImage');
    
    document.body.appendChild(this.previewEl);

    window.addEventListener('imagePreview', this.imagePreviewEvent.bind(this), false);
  }

  private imagePreviewEvent(e: CustomEvent): void {
    let imgData = <ImageData> e.detail;
    let imgUri = this.imageDataToDataURL(imgData);

    let uri = 'url("'+ imgUri +'")';
    this.previewEl.style.backgroundImage = uri;
  }

  private imageDataToDataURL(image: ImageData): string {
    let canvas = <HTMLCanvasElement> document.createElement('canvas');
    let ctx = <CanvasRenderingContext2D> canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.putImageData(image, 0, 0);

    return canvas.toDataURL();
  }
}