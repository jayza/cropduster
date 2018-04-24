import { Anchor } from "./Anchor";
import { AnchorMatrix } from "./AnchorMatrix";

export class CanvasSelector {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private originSelectX: number = 0;
  private originSelectY: number = 0;

  private selectWidth: number = 0;
  private selectHeight: number = 0;

  private anchorActive: boolean = false;
  private selectActive: boolean = false;
  private selectProportionalDimensions: boolean = false;
  private lockCol: boolean = false;
  private lockRow: boolean = false;

  private anchors: Anchor[] = [];
  private anchorMatrix: AnchorMatrix = new AnchorMatrix();

  private redrawEvent: Event = new Event('redraw');
  
  public constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = <CanvasRenderingContext2D> canvas.getContext('2d');

    this.canvas.addEventListener('mousedown', this.mouseDownEvent.bind(this), false);
    this.canvas.addEventListener('mouseup', this.mouseUpEvent.bind(this), false);
    this.canvas.addEventListener('mousemove', this.mouseMoveEvent.bind(this), false);
  }

  /**
   * Draws the selected boundary and overlay around it.
   */
  public draw() {
    this.canvas.dispatchEvent(this.redrawEvent);

    // Add transparency around the selected area.
    let anchorMatrix = this.setAnchorMatrix();
    if (anchorMatrix.length > 0) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
      this.ctx.fillRect(0,0, anchorMatrix[0][0].x, this.canvas.height);
      this.ctx.fillRect(anchorMatrix[0][2].x, 0, Math.abs(this.canvas.width - this.selectWidth), this.canvas.height);
      this.ctx.fillRect(anchorMatrix[0][0].x, 0, Math.abs(this.selectWidth), anchorMatrix[0][0].y);
      this.ctx.fillRect(anchorMatrix[2][0].x, anchorMatrix[2][0].y, Math.abs(this.selectWidth), Math.abs(this.canvas.height - anchorMatrix[2][0].y));
      this.ctx.restore();
    }

    // Draw the selected area.
    this.ctx.rect(
      this.originSelectX, 
      this.originSelectY, 
      this.selectWidth,
      this.selectHeight
    );

    this.ctx.stroke();
  }

  /**
   * Build new anchor matrix.
   */
  public setAnchorMatrix(): Anchor[][] {
    let anchors = [
      new Anchor(this.originSelectX, this.originSelectY), //origin
      new Anchor(this.originSelectX + this.selectWidth, this.originSelectY + this.selectHeight), //opposite origin
      new Anchor(this.originSelectX + this.selectWidth, this.originSelectY), //corner 1
      new Anchor(this.originSelectX, this.originSelectY + this.selectHeight), //corner 2
      new Anchor((this.selectWidth / 2) + this.originSelectX, this.originSelectY), //horizontal middle 1
      new Anchor((this.selectWidth / 2) + this.originSelectX, this.originSelectY + this.selectHeight), //horizontal middle 2
      new Anchor(this.originSelectX, (this.selectHeight / 2) + this.originSelectY), //vertical middle 1
      new Anchor(this.originSelectX + this.selectWidth, (this.selectHeight / 2) + this.originSelectY) // vertical middle 2
    ];

    this.anchorMatrix.anchors = anchors

    return this.anchorMatrix.getAnchorMatrix();
  }

  /**
   * Reset all the coordinate and data values to default.
   */
  private resetOrigin(): void {
    let anchorMatrix = this.anchorMatrix.getAnchorMatrix();

    this.selectProportionalDimensions = false;
    this.lockCol = false;
    this.lockRow = false;

    this.originSelectX = anchorMatrix[0][0].x;
    this.originSelectY = anchorMatrix[0][0].y;

    this.selectWidth = Math.abs(this.selectWidth);
    this.selectHeight = Math.abs(this.selectHeight);
  }

  /**
   * Draw the anchor handles.
   */
  private drawAnchorHandles(): void {
    let anchorMatrix = this.anchorMatrix.getAnchorMatrix();

    anchorMatrix.forEach((anchorRow: Anchor[], row: number) => {
      anchorRow.forEach((anchor: Anchor, col: number) => {
        this.ctx.fillRect(anchor.x - (anchor.size / 2), anchor.y - (anchor.size / 2), anchor.size, anchor.size);
      });
    });
  }

  /**
   * Find out if the coordinates collide with any anchor in the matrix.
   * 
   * @param x number X coordinate
   * @param y number Y coordinate
   */
  private collidingAnchor(x: number, y: number): Anchor|false {
    return this.anchorMatrix.getCollidingAnchor(x, y);
  }

  /**
   * Mousedown event handler.
   * @param e MouseEvent
   */
  private mouseDownEvent(e: MouseEvent) {
    let x = e.layerX;
    let y = e.layerY;

    window.dispatchEvent(new Event('keydown'));

    // Check if we click on anchors.
    let collidingAnchor = this.collidingAnchor(x,y);
    if (collidingAnchor !== false && !this.selectActive) {
      this.anchorActive = true;

      let anchorOriginOpposite = this.anchorMatrix.getOppositeOriginAnchor(collidingAnchor);

      if (collidingAnchor.row == 1) {
        this.lockCol = true;
      } 
      else if (collidingAnchor.row != 1 && collidingAnchor.col == 1) {
        this.lockRow = true;
      }

      this.originSelectX = anchorOriginOpposite.x;
      this.originSelectY = anchorOriginOpposite.y;

      this.selectActive = true;
      this.selectMove(e);

      return;
    }

    // Otherwise run default click option.
    this.selectClick(e);
  }

  /**
   * Mouseup event handler.
   * @param e MouseEvent
   */
  private mouseUpEvent(e: MouseEvent) {
    if (this.anchorActive !== false) {
      this.anchorActive = false;
    }

    // Let go off selecting boundary.
    if (this.selectActive) {
      this.selectActive = false;
      this.anchorActive = false;

      // Reset so origin is in top left anchor.
      this.resetOrigin();

      // Output preview image of selected area.
      this.canvas.dispatchEvent(this.redrawEvent);
      let previewImage = this.ctx.getImageData(this.originSelectX, this.originSelectY, this.selectWidth, this.selectHeight);
      let eventImagePreview = new CustomEvent('imagePreview', { detail: previewImage });
      window.dispatchEvent(eventImagePreview);

      this.draw();
      this.drawAnchorHandles();
    }
  }

  /**
   * Mousemove event handler.
   * @param e MouseEvent
   */
  private mouseMoveEvent(e: MouseEvent) {
    if (this.selectActive) {
      this.selectMove(e);
      return;
    }

    this.hoverCursor(e);
  }

  /**
   * Determines what cursor to use when hovering over different elements in canvas.
   * 
   * @param e MouseEvent
   */
  private hoverCursor(e: MouseEvent) {
    let x = e.layerX;
    let y = e.layerY;

    // Check if we hover on anchors.
    let collidingAnchor = this.anchorMatrix.getCollidingAnchor(x, y);
    if (collidingAnchor !== false) {
      this.canvas.style.cursor = collidingAnchor.cursor;
      return;
    }

    // Otherwise run default hover option.
    this.canvas.style.cursor = "auto";
    // this.selectMove(e);
  } 

  private selectClick(e: MouseEvent) {
    // If we're currently selecting a boundary.
    if (this.selectActive) {
      this.selectActive = false;
      return;
    }

    // Clear previous boundaries.
    this.canvas.dispatchEvent(this.redrawEvent);

    this.selectActive = true;

    this.originSelectX = e.layerX,
    this.originSelectY = e.layerY;
  }

  /**
   * Calculates the width and height of the selected boundary.
   * @param e MouseEvent
   */
  private selectMove(e: MouseEvent) {
    if (!this.selectActive) {
      return;
    }

    let currentSelectX = e.layerX;
    let currentSelectY = e.layerY;

    if (!this.selectProportionalDimensions) {
      this.selectWidth = (!this.lockRow) ? currentSelectX - this.originSelectX : this.selectWidth;
      this.selectHeight = (!this.lockCol) ? currentSelectY - this.originSelectY : this.selectHeight;
    }
    else {
      let maxSelect = Math.max(currentSelectX, currentSelectY);
      this.selectWidth = maxSelect - this.originSelectX;
      this.selectHeight = maxSelect - this.originSelectY;
    }
    // Redraw.
    this.draw();
  }

}