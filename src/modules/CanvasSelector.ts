import { Anchor } from "./Anchor";
import { AnchorMatrix } from "./AnchorMatrix";

export class CanvasSelector {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private originSelectX: number = 0;
  private originSelectY: number = 0;

  private currentSelectX: number = 0;
  private currentSelectY: number = 0;
  private previousSelectX: number = 0;
  private previousSelectY: number = 0;

  private selectWidth: number = 0;
  private selectHeight: number = 0;

  private boundaryX: number = 50;
  private boundaryY: number = 50;
  private boundaryWidth: number = 500;
  private boundaryHeight: number = 500;

  private anchorActive: boolean = false;
  private selectActive: boolean = false;
  private lockCol: boolean = false;
  private lockRow: boolean = false;

  private anchors: Anchor[] = [];
  private anchorMatrix: AnchorMatrix = new AnchorMatrix();

  private redrawEvent: Event = new Event('redraw');
  
  public constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = <CanvasRenderingContext2D> canvas.getContext('2d');

    this.drawBoundary();

    this.canvas.addEventListener('mousedown', this.mouseDownEvent.bind(this), false);
    this.canvas.addEventListener('mouseup', this.mouseUpEvent.bind(this), false);
    this.canvas.addEventListener('mousemove', this.mouseMoveEvent.bind(this), false);
    this.canvas.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      return false;
    }, false);
  }

  public getBoundaries(): any{
    return {
      x: this.boundaryX,
      y: this.boundaryY,
      width: this.boundaryWidth,
      height: this.boundaryHeight
    };
  }

  /**
   * Draws the selected selection and overlay around it.
   */
  public draw(): void {
    this.canvas.dispatchEvent(this.redrawEvent);

    // Add transparency around the selected area.
    let anchorMatrix = this.setAnchorMatrix();
    if (anchorMatrix.length > 0) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
      this.ctx.fillRect(this.boundaryX, this.boundaryY, anchorMatrix[0][0].x - this.boundaryX, this.boundaryHeight);
      this.ctx.fillRect(anchorMatrix[0][2].x, this.boundaryY, Math.abs(anchorMatrix[0][2].x - (this.boundaryWidth + this.boundaryX)), this.boundaryHeight);
      this.ctx.fillRect(anchorMatrix[0][0].x, this.boundaryY, Math.abs(this.selectWidth), anchorMatrix[0][0].y - this.boundaryY);
      this.ctx.fillRect(anchorMatrix[2][0].x, anchorMatrix[2][0].y, Math.abs(this.selectWidth), Math.abs(anchorMatrix[2][0].y - (this.boundaryHeight + this.boundaryY)));
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
  private mouseDownEvent(e: MouseEvent): void {
    e.preventDefault();

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

    // Make sure we cant draw a selection outside boundary.ß
    if (this.collideWithBoundary(x,y)) {
      return;
    }

    // Otherwise run default click option.
    this.selectClick(e);
  }

  /**
   * Mouseup event handler.
   * @param e MouseEvent
   */
  private mouseUpEvent(e: MouseEvent): void {
    e.preventDefault();

    if (this.anchorActive !== false) {
      this.anchorActive = false;
    }

    // Let go off selecting selection.
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
  private mouseMoveEvent(e: MouseEvent): void {
    e.preventDefault();

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
  private hoverCursor(e: MouseEvent): void {
    let x = e.layerX;
    let y = e.layerY;

    // Check if we hover on anchors.
    let collidingAnchor = this.anchorMatrix.getCollidingAnchor(x, y);
    if (collidingAnchor !== false) {
      if (e.ctrlKey) {
        this.canvas.style.cursor = 'move';
      }
      else {
        this.canvas.style.cursor = collidingAnchor.cursor;
      }
      return;
    }

    // Otherwise run default hover option.
    this.canvas.style.cursor = "auto";
  } 

  private selectClick(e: MouseEvent) {
    // If we're currently selecting a selection.
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
   * Calculates the width and height of the selected selection.
   * @param e MouseEvent
   */
  private selectMove(e: MouseEvent): void {
    if (!this.selectActive) {
      return;
    }

    this.currentSelectX = e.layerX;
    this.currentSelectY = e.layerY;

    if (this.collideWithBoundary(this.currentSelectX, this.currentSelectY)) {
      if (this.currentSelectX < this.boundaryX) {
        this.currentSelectX = this.boundaryX;
      }
      if (this.currentSelectX > (this.boundaryWidth + this.boundaryX)) {
        this.currentSelectX = this.boundaryX + this.boundaryWidth;
      }
      if (this.currentSelectY < this.boundaryY) {
        this.currentSelectY = this.boundaryY;
      }
      if (this.currentSelectY > (this.boundaryHeight + this.boundaryY)) {
        this.currentSelectY = this.boundaryY + this.boundaryHeight;
      }
    }

    // Move: Check if we are holding ctrl while pulling anchor handles.
    if (e.ctrlKey && !e.shiftKey) {
      // @todo: Fix moving selection..
      if (this.collideWithBoundary(e.layerX, e.layerY)) {
        this.originSelectX = this.currentSelectX - this.selectWidth;
        this.originSelectY = this.currentSelectY - this.selectHeight;
      }
      
      if (!this.collideWithBoundary(this.originSelectX, this.originSelectY) || !this.collideWithBoundary(e.layerX, e.layerY)) {
        this.originSelectX = this.currentSelectX - this.selectWidth;
        this.originSelectY = this.currentSelectY - this.selectHeight;
      }

      if (this.collideWithBoundary(this.originSelectX, this.originSelectY)) {
        if (this.originSelectX < this.boundaryX) {
          this.originSelectX = this.boundaryX;
        }
        if (this.originSelectY < this.boundaryY) {
          this.originSelectY = this.boundaryY;
        }
      }
    }

    // Scale: Check if we are holding shift key while we pull the diagonal anchor handles.
    else if ((e.shiftKey && !e.ctrlKey) && !this.lockRow && !this.lockCol) {
      // @todo: Fix proper scaling and so it works on all anchors.
      let maxSelect = Math.max(this.currentSelectX, this.currentSelectY);
      this.selectWidth = maxSelect - this.originSelectX;
      this.selectHeight = maxSelect - this.originSelectY;
    }

    // Draw selection.
    else {
      this.selectWidth = (!this.lockRow) ? this.currentSelectX - this.originSelectX : this.selectWidth;
      this.selectHeight = (!this.lockCol) ? this.currentSelectY - this.originSelectY : this.selectHeight;
    }

    // Redraw.
    this.draw();

    this.previousSelectX = e.layerX;
    this.previousSelectY = e.layerY;
  }

  private drawBoundary(): void {
    this.ctx.rect(this.boundaryX, this.boundaryY, this.boundaryWidth, this.boundaryHeight);
    this.ctx.stroke();
  }

  /**
   * Check if a coordinate collides with boundary.
   * @param x X Coordinate
   * @param y Y Coordinate
   */
  private collideWithBoundary(x: number, y: number): boolean {
    if (x < this.boundaryX || y < this.boundaryY || x > (this.boundaryX + this.boundaryWidth) || y > (this.boundaryY + this.boundaryHeight)) {
      return true;
    }

    return false;
  }
}